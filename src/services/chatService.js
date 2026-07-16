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

import { LOCAL_TIPS, SEED_POSTS } from "../data/seed";
import seoulAttractions from "../data/seoul_attractions.json";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? "";

function normalizeAttractions(items = []) {
  return (items || [])
    .filter((item) => item?.title)
    .map((item, index) => {
      const addr = [item.addr1, item.addr2].filter(Boolean).join(" ");
      const districtMatch = addr.match(/서울특별시\s+([^\s]+)/);
      const district = districtMatch?.[1] || "서울";
      const neighborhoodMatch = addr.match(/\(([^)]+)\)/);
      const neighborhood = neighborhoodMatch?.[1] || district;

      return {
        id: item.contentid || index + 1,
        name: item.title,
        district,
        neighborhood,
        description: "",
        hours: "정보 확인 필요",
        fee: "정보 확인 필요",
        category: "관광지",
        address: addr,
        image: item.firstimage || "",
      };
    });
}

const DATA_SOURCE = {
  attractions: normalizeAttractions(seoulAttractions?.items || []),
  posts: SEED_POSTS.map((post) => ({ ...post })),
  tips: LOCAL_TIPS.map((tip) => ({ ...tip })),
};

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
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
    .join(" ")
    .toLowerCase();

  let score = 0;

  keywords.forEach((keyword) => {
    if (text.includes(keyword)) score += 2;

    if (
      item.name?.toLowerCase().includes(keyword) ||
      item.title?.toLowerCase().includes(keyword)
    ) {
      score += 3;
    }
  });

  return score;
}
function buildContext(question, source = {}) {
  const keywords = tokenize(question);

  const places = source.attractions?.length
    ? source.attractions
    : DATA_SOURCE.attractions;

  const posts = source.posts?.length ? source.posts : DATA_SOURCE.posts;

  const tips = source.tips?.length ? source.tips : DATA_SOURCE.tips;

  const rankedPlaces = places
    .map((place) => ({
      ...place,
      score: calculateScore(place, keywords),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const placeIds = new Set(rankedPlaces.map((p) => Number(p.id)));

  const rankedPosts = posts
    .map((post) => ({
      ...post,
      score:
        calculateScore(post, keywords) +
        (placeIds.has(Number(post.placeId)) ? 5 : 0),
    }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const postPlaceIds = new Set(rankedPosts.map((p) => Number(p.placeId)));

  const rankedTips = tips
    .filter((tip) => postPlaceIds.has(Number(tip.placeId)))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  return {
    rankedPlaces,
    rankedPosts,
    rankedTips,
  };
}

/** OpenAI API 호출 (키가 있을 때) */
async function askOpenAI(question, history, source) {
  const { rankedPlaces, rankedPosts, rankedTips } = buildContext(
    question,
    source,
  );

  const contextText = `
[관광지]

${rankedPlaces
  .map(
    (p) => `
이름 : ${p.name}
지역 : ${p.district}
설명 : ${p.description}
주소 : ${p.address}
`,
  )
  .join("\n")}

[주민TIP]

${rankedTips
  .map(
    (t) => `
작성자 : ${t.author}
내용 : ${t.content}
`,
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
`,
  )
  .join("\n")}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
너는 LocalHub AI 관광 도우미다.

반드시 아래 데이터만 근거로 답변한다.

답변 규칙

1. 관광지 설명은 제공된 관광지 데이터와 주민 후기를 기반으로 작성한다.

2. 주민 TIP은 제공된 relatedTips 데이터만 사용한다.
새로운 주민 후기를 만들지 않는다.

3. 커뮤니티 게시글은 제공된 커뮤니티 데이터만 사용한다.
절대로 새로운 게시글 제목, 조회수, 작성자를 생성하지 않는다.

4. 추천이나 분석 의견은 AI 판단으로 작성 가능하지만,
실제 후기/게시글처럼 표현하지 않는다.

5. 관련 게시글이 없으면 "관련 게시글 없음"이라고 표시한다.

6. 마지막에는 추가 질문 3개를 생성한다.

JSON만 반환한다.

{
 "answer":"...",
 "relatedPosts":[
   {
    "id":1
   }
 ],
 "suggestions":[
   "...",
   "...",
   "..."
 ]
}


데이터

${contextText}
`,
        },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API 오류: ${res.status}`);
  const data = await res.json();
  const content = data.choices[0].message.content;

  try {
    const clean = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(clean);
     const ids = (parsed.relatedPosts ?? []).map(p => Number(p.id));

    return {
      answer: parsed.answer,

      suggestions: parsed.suggestions ?? [],


relatedPosts: rankedPosts.filter(post =>
    ids.includes(Number(post.id))
),

      relatedTips: rankedTips,

      relatedPlaces: rankedPlaces,

      needCommunityPost: rankedPosts.length === 0 && rankedTips.length === 0,
    };
  } catch {
    return {
      answer: content,

      suggestions: [],

      relatedPosts: rankedPosts,

      relatedTips: rankedTips,

      relatedPlaces: rankedPlaces,

      needCommunityPost: rankedPosts.length === 0 && rankedTips.length === 0,
    };
  }
}
/** 로컬 폴백 — 같은 컨텍스트로 규칙 기반 답변 */
function askLocal(question, source) {
  const { rankedPlaces, rankedPosts, rankedTips } = buildContext(
    question,
    source,
  );
  const q = question.toLowerCase();

  if (/(인기|요즘|트렌드|핫한|뜨는)/.test(q) && rankedPlaces.length === 0) {
    return {
      answer: [
        "요즘 지역 커뮤니티에서 자주 언급되는 곳은 다음과 같아요.",
        "",
        "1. 서울숲 — 산책과 카페가 잘 어울리는 대표 공간",
        "2. 성수동 — 최근 트렌드와 팝업이 많아 방문객이 많아요",
        "3. 효사정 — 조용하고 감성적인 산책 코스로 인기가 높아요",
        "",
        "원하시면 “성수동 분위기”, “서울숲 추천 코스”, “효사정 가볼 만한 곳”처럼 더 구체적으로 물어봐 주세요.",
      ].join("\n"),

      relatedPosts: rankedPosts.slice(0, 3),
      relatedTips: rankedTips.slice(0, 3),
      relatedPlaces: rankedPlaces.slice(0, 3),
      needCommunityPost: false,

      suggestions: ["서울숲 알려줘", "성수동 후기", "인기 장소"],
    };
  }

  if (
    /(추천|어디|가볼|좋은|맛집|카페|산책|후기|분위기)/.test(q) &&
    rankedPlaces.length === 0
  ) {
    return {
      answer: [
        "아직 질문과 정확히 매칭되는 장소가 없지만, 이런 키워드에는 아래처럼 답해드릴 수 있어요.",
        "",
        "• 성수동: 카페와 팝업, 감성 있는 공간 탐방에 잘 어울려요.",
        "• 서울숲: 산책과 여유로운 시간 보내기에 추천돼요.",
        "• 효사정: 조용한 분위기와 역사적인 느낌을 원하시면 좋아요.",
        "",
        "원하시면 “성수동 카페 추천”, “서울숲 산책 코스”, “효사정 후기”처럼 더 구체적으로 질문해 주세요.",
      ].join("\n"),

      relatedPosts: rankedPosts.slice(0, 3),

      relatedTips: rankedTips.slice(0, 3),

      relatedPlaces: rankedPlaces.slice(0, 3),

      needCommunityPost: false,

      suggestions: ["성수동 후기", "서울숲 추천", "주민 추천"],
    };
  }

  if (rankedPlaces.length === 0 && rankedPosts.length === 0) {
    return {
      answer:
        "현재 커뮤니티에는 관련 후기가 없어요.\nAI 기준으로 추천드리면 ...",

      relatedPosts: [],
      relatedTips: [],
      relatedPlaces: [],

      needCommunityPost: true,

      suggestions: ["비슷한 장소", "주민 추천", "다른 후기"],
    };
  }

  const lines = [];
  const place = rankedPlaces[0];

  if (place) {
    lines.push(
      `${place.name} (${place.district} ${place.neighborhood})에 대해 알려드릴게요.`,
    );
    lines.push("");
   if (place.description) {
  lines.push(place.description);
} else {
  lines.push("해당 장소에 대해 검색해봤어요.");
}
  }

  if (rankedTips.length > 0) {
    lines.push("");
    lines.push("[지역 주민 TIP]");
    rankedTips
      .slice(0, 3)
      .forEach((t) => lines.push(`- ${t.author}: "${t.content}"`));
  }

  if (rankedPosts.length > 0) {
    lines.push("");
    lines.push("[관련 커뮤니티 게시글]");
    rankedPosts
      .slice(0, 3)
      .forEach((p) => lines.push(`- ${p.title} (조회 ${p.views || 0})`));
    lines.push("");
    lines.push("원하시면 더 구체적인 추천이나 일정 형태로도 답해드릴게요!");
  }

  return {
    answer: lines.join("\n"),
    relatedPosts: rankedPosts.slice(0, 3),
    relatedTips: rankedTips.slice(0, 3),
    relatedPlaces: rankedPlaces.slice(0, 3),
    needCommunityPost: rankedPosts.length === 0 && rankedTips.length === 0,
    suggestions: ["주변 맛집도 알려줘", "비슷한 장소 추천", "교통편 알려줘"],
  };
}

/** 챗봇 진입점 — API 키 유무에 따라 자동 분기 */
export async function askChatbot(question, history = [], source = {}) {
  const trimmed = (question || "").trim();
  if (!trimmed) {
    return "질의를 입력해주세요.";
  }

  if (!API_KEY) {
    return askLocal(trimmed, source);
  }

  try {
    return await askOpenAI(trimmed, history, source);
  } catch (e) {
    console.error("[chat] OpenAI 호출 실패, 로컬 응답으로 대체합니다.", e);
    return askLocal(trimmed, source);
  }
}
