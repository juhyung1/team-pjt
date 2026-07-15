/**
 * AI 챗봇 서비스
 *
 * 구조:
 *  1) buildContext()  — 공공데이터(places) + 커뮤니티(posts/tips)에서
 *                       질문과 관련된 정보를 골라 컨텍스트 문자열로 만든다.
 *  2) askOpenAI()     — API 키가 있으면 OpenAI Chat Completions 호출.
 *  3) askLocal()      — API 키가 없으면 같은 컨텍스트로 규칙 기반 답변 생성.
 *
 * 즉, "공공데이터 + 커뮤니티 게시글 기반으로 답변"하는 RAG 구조를
 * API 유무와 무관하게 동일하게 유지한다.
 *
 * OpenAI 연결 방법: 프로젝트 루트에 .env 파일을 만들고
 *   VITE_OPENAI_API_KEY=sk-...
 * 를 추가하면 자동으로 실제 API를 사용한다.
 */

import { LOCAL_TIPS, SEED_POSTS } from '../data/seed'
import seoulAttractions from '../data/seoul_attractions.json'

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? ''

function normalizeAttractions(items = []) {
  return (items || [])
    .filter((item) => item?.title)
    .map((item, index) => {
      const addr = [item.addr1, item.addr2].filter(Boolean).join(' ')
      const districtMatch = addr.match(/서울특별시\s+([^\s]+)/)
      const district = districtMatch?.[1] || '서울'
      const neighborhoodMatch = addr.match(/\(([^)]+)\)/)
      const neighborhood = neighborhoodMatch?.[1] || district

      return {
        id: item.contentid || index + 1,
        name: item.title,
        district,
        neighborhood,
        description: `${item.title}는 서울 지역에서 많이 찾는 관광지로, 여행 코스와 사진 촬영 포인트로 인기가 있습니다.`,
        hours: '정보 확인 필요',
        fee: '정보 확인 필요',
        category: '관광지',
        address: addr,
        image: item.firstimage || '',
      }
    })
}

const DATA_SOURCE = {
  attractions: normalizeAttractions(seoulAttractions?.items || []),
  posts: SEED_POSTS.map((post) => ({ ...post })),
  tips: LOCAL_TIPS.map((tip) => ({ ...tip })),
}

function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function calculateScore(item, keywords) {
  const text = [
    item.name,
    item.title,
    item.description,
    item.content,
    item.address,
    item.district,
    item.neighborhood,
    ...(item.tags || []),
  ]
    .join(' ')
    .toLowerCase()

  let score = 0

  keywords.forEach((keyword) => {
    if (text.includes(keyword)) score += 2

    if (
      item.name?.toLowerCase().includes(keyword) ||
      item.title?.toLowerCase().includes(keyword)
    ) {
      score += 3
    }
  })

  return score
}
function buildContext(question, source = {}) {
  const keywords = tokenize(question)

  const places =
    source.attractions?.length
      ? source.attractions
      : DATA_SOURCE.attractions

  const posts =
    source.posts?.length
      ? source.posts
      : DATA_SOURCE.posts

  const tips =
    source.tips?.length
      ? source.tips
      : DATA_SOURCE.tips

  const rankedPlaces = places
    .map((place) => ({
      ...place,
      score: calculateScore(place, keywords),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const placeIds = new Set(rankedPlaces.map((p) => p.id))

  const rankedPosts = posts
    .map((post) => ({
      ...post,
      score:
        calculateScore(post, keywords) +
        (placeIds.has(post.placeId) ? 5 : 0),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  const rankedTips = tips
    .filter((tip) => placeIds.has(tip.placeId))
    .slice(0, 5)

  return {
    rankedPlaces,
    rankedPosts,
    rankedTips,
  }
}

/** OpenAI API 호출 (키가 있을 때) */
async function askOpenAI(question, history, source) {
 const {
  rankedPlaces,
  rankedPosts,
  rankedTips,
} = buildContext(question, source)

  const contextText = `
[관광지]

${rankedPlaces
  .map(
    (p) => `
이름 : ${p.name}
지역 : ${p.district}
설명 : ${p.description}
주소 : ${p.address}
`
  )
  .join("\n")}

[주민TIP]

${rankedTips
  .map(
    (t) => `
작성자 : ${t.author}
내용 : ${t.content}
`
  )
  .join("\n")}

[커뮤니티]

${rankedPosts
  .map(
    (p) => `
제목 : ${p.title}
내용 : ${p.content}
조회수 : ${p.views}
좋아요 : ${p.likes ?? 0}
`
  )
  .join("\n")}
`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
         content: `
너는 LocalHub AI 관광 도우미다.

반드시 아래 데이터만 근거로 답변한다.

답변 규칙

1. 관광지 설명
2. 주민 후기 요약
3. 게시글 분석
4. 장점/단점
5. 추천 장소
6. 마지막에는 이어서 물어볼 질문 3개 생성

JSON만 반환한다.

{
 "answer":"...",
 "suggestions":[
   "...",
   "...",
   "..."
 ]
}

데이터

${contextText}
`
        },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  })

  if (!res.ok) throw new Error(`OpenAI API 오류: ${res.status}`)
  const data = await res.json()
   const content = data.choices[0].message.content

 try {
  const clean = content
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()

  return JSON.parse(clean)

} catch {
  return {
    answer: content,
    suggestions: [],
  }
}

/** 로컬 폴백 — 같은 컨텍스트로 규칙 기반 답변 */
function askLocal(question, source) {
const {
  rankedPlaces,
  rankedPosts,
  rankedTips,
} = buildContext(question, source)
 const q = question.toLowerCase()

  if (/(인기|요즘|트렌드|핫한|뜨는)/.test(q) && rankedPlaces.length === 0) {
    return [
      '요즘 지역 커뮤니티에서 자주 언급되는 곳은 다음과 같아요.',
      '',
      '1. 서울숲 — 산책과 카페가 잘 어울리는 대표 공간',
      '2. 성수동 — 최근 트렌드와 팝업이 많아 방문객이 많아요',
      '3. 효사정 — 조용하고 감성적인 산책 코스로 인기가 높아요',
      '',
      '원하시면 “성수동 분위기”, “서울숲 추천 코스”, “효사정 가볼 만한 곳”처럼 더 구체적으로 물어봐 주세요.',
    ].join('\n')
  }

  if (/(추천|어디|가볼|좋은|맛집|카페|산책|후기|분위기)/.test(q) && rankedPlaces.length === 0) {
    return [
      '아직 질문과 정확히 매칭되는 장소가 없지만, 이런 키워드에는 아래처럼 답해드릴 수 있어요.',
      '',
      '• 성수동: 카페와 팝업, 감성 있는 공간 탐방에 잘 어울려요.',
      '• 서울숲: 산책과 여유로운 시간 보내기에 추천돼요.',
      '• 효사정: 조용한 분위기와 역사적인 느낌을 원하시면 좋아요.',
      '',
      '원하시면 “성수동 카페 추천”, “서울숲 산책 코스”, “효사정 후기”처럼 더 구체적으로 질문해 주세요.',
    ].join('\n')
  }

  if (rankedPlaces.length === 0 && rankedPosts.length === 0) {
    return [
      '아직 제공된 데이터만으로는 정확히 매칭되지 않지만, 아래처럼 대화형 답변을 이어갈 수 있어요.',
      '',
      '• 성수동: 감성 있는 카페와 동네 분위기를 즐기기 좋아요.',
      '• 서울숲: 자연과 산책을 즐기기 좋은 장소예요.',
      '• 효사정: 조용한 산책과 역사적인 분위기를 느끼기 좋아요.',
      '',
      '원하시면 “성수동 후기”, “서울숲 추천”, “효사정 가볼 만한 곳”처럼 질문해 주세요.',
    ].join('\n')
  }

  const lines = []
  const place = rankedPlaces[0]

  if (place) {
    lines.push(`${place.name} (${place.district} ${place.neighborhood})에 대해 알려드릴게요.`)
    lines.push('')
    lines.push(place.description || '해당 장소에 대한 설명이 준비되어 있어요.')
    lines.push(`🕐 ${place.hours || '정보 확인 필요'} · 💰 ${place.fee || '정보 확인 필요'}`)
  }

  if (rankedTips.length > 0) {
    lines.push('')
    lines.push('[지역 주민 TIP]')
    rankedTips.slice(0, 3).forEach((t) => lines.push(`- ${t.author}: "${t.content}"`))
  }

  if (rankedPosts.length > 0) {
    lines.push('')
    lines.push('[관련 커뮤니티 게시글]')
    rankedPosts.slice(0, 3).forEach((p) => lines.push(`- ${p.title} (조회 ${p.views || 0})`))
    lines.push('')
    lines.push('원하시면 더 구체적인 추천이나 일정 형태로도 답해드릴게요!')
  }

  return lines.join('\n')
}

/** 챗봇 진입점 — API 키 유무에 따라 자동 분기 */
export async function askChatbot(question, history = [], source = {}) {
  const trimmed = (question || '').trim()
  if (!trimmed) {
    return '질의를 입력해주세요.'
  }

  if (!API_KEY) {
    return askLocal(trimmed, source)
  }

  try {
    return await askOpenAI(trimmed, history, source)
  } catch (e) {
    console.error('[chat] OpenAI 호출 실패, 로컬 응답으로 대체합니다.', e)
    return askLocal(trimmed, source)
  }
}