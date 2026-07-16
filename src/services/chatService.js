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
const STOP_WORDS = [
  "추천",
  "알려줘",
  "알려주세요",
  "어디",
  "근처",
  "주변",
  "코스",
  "가볼",
  "좋은",
  "소개",
  "해주세요",
  "하고",
  "싶어",
];


function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(word => !STOP_WORDS.includes(word));
}
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

/** localStorage의 실제 커뮤니티 게시글 — 없으면 시드 게시글로 대체 */
function loadCommunityPosts() {
  try {
    const raw = localStorage.getItem('posts')
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 비밀번호는 챗봇 컨텍스트에 포함하지 않는다
      return parsed.map(({ password, ...rest }) => ({ ...rest }))
    }
  } catch {
    /* ignore */
  }
  return SEED_POSTS.map((post) => ({ ...post }))
}

const DATA_SOURCE = {
  attractions: normalizeAttractions(seoulAttractions?.items || []),
  posts: loadCommunityPosts(),
  tips: LOCAL_TIPS.map((tip) => ({ ...tip })),
};

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
if(text.includes(keyword)) {

  // 의미 없는 일반 키워드 제외
  if(
    ["코스","추천","근처","주변","데이트"].includes(keyword)
  ){
    score +=0;
  }
  else {
    score +=2;
  }

}
if (
 item.name?.includes(keyword)
) {
 score += 5;
}
    if (
      item.name?.toLowerCase().includes(keyword) ||
      item.title?.toLowerCase().includes(keyword)
    ) {
      score += 5;
    }
  });

  return score;
}

function extractPopularPlaces(posts = []) {
  const placeCount = {};

  posts.forEach((post) => {
    const text = `${post.title} ${post.content}`;

    DATA_SOURCE.attractions.forEach((place) => {
      if (text.includes(place.name)) {
        if (!placeCount[place.name]) {
          placeCount[place.name] = {
            name: place.name,
            count: 0,
            views: 0,
            likes: 0,
            place,
          };
        }

        placeCount[place.name].count += 1;
        placeCount[place.name].views += Number(post.views || 0);
        placeCount[place.name].likes += Number(post.likes || 0);
      }
    });
  });


  return Object.values(placeCount)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.views !== a.views) return b.views - a.views;
      return b.likes - a.likes;
    })
    .slice(0, 3)
    .map((item) => ({
      ...item.place,
      mentionCount: item.count,
    }));
}

function buildContext(question, source = {}) {
  const questionText = question.toLowerCase();

const intent = {
  placeKeyword: null,
  nearby: false,
  dateCourse: false,
};


if(questionText.includes("경복궁")){
  intent.placeKeyword="경복궁";
}

if(
 questionText.includes("근처") ||
 questionText.includes("주변")
){
 intent.nearby=true;
}


if(
 questionText.includes("데이트") ||
 questionText.includes("코스")
){
 intent.dateCourse=true;
}
  const keywords = tokenize(question);

  const places = source.attractions?.length
    ? source.attractions
    : DATA_SOURCE.attractions;

  const posts = source.posts?.length ? source.posts : DATA_SOURCE.posts;


  const tips = source.tips?.length ? source.tips : DATA_SOURCE.tips;

  const rankedPlaces = places
.map((place)=>{

  let score = calculateScore(place, keywords);


  // 사용자가 특정 장소를 기준으로 검색한 경우
  if(intent.placeKeyword){

    // 해당 장소
    if(place.name.includes(intent.placeKeyword)){
      score += 30;
    }


    // 같은 지역
    if(
      place.address?.includes("종로") ||
      place.district?.includes("종로")
    ){
      score +=10;
    }

  }


  return {
    ...place,
    score
  }


})
.filter((p)=>p.score>0)
.sort((a,b)=>b.score-a.score)
.slice(0,5);

  const placeIds = new Set(rankedPlaces.map((p) => Number(p.id)));

  const rankedPosts = posts
  .map((post) => ({
    ...post,
    score:
      calculateScore(post, keywords) +
      (placeIds.has(Number(post.placeId)) ? 2 : 0),
  }))
.filter((p)=>p.score >=3).sort((a, b) => b.score - a.score)
  .slice(0, 3);


  const postPlaceIds = new Set(rankedPosts.map((p) => Number(p.placeId)));
const isPopularQuestion =
  questionText.includes("인기") ||
  questionText.includes("요즘") ||
  questionText.includes("핫플") ||
  questionText.includes("뜨는");


const popularPlaces = isPopularQuestion
  ? extractPopularPlaces(posts, places)
  : [];
  const rankedTips = tips
    .filter((tip) => postPlaceIds.has(Number(tip.placeId)))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);
const hasRelatedData =
  rankedPlaces.length > 0 ||
  rankedPosts.length > 0 ||
  rankedTips.length > 0;
  return {
  rankedPlaces: popularPlaces.length
    ? popularPlaces
    : rankedPlaces,

  rankedPosts: isPopularQuestion
    ? posts
        .filter(post =>
          popularPlaces.some(place =>
            post.title?.includes(place.name) ||
            post.content?.includes(place.name)
          )
        )
        .sort((a,b)=>b.views-a.views)
        .slice(0,3)
    : rankedPosts,

  rankedTips,
  hasRelatedData,
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

  [인기 장소 분석]

${rankedPlaces
.map(
(p)=>`
장소 : ${p.name}
커뮤니티 언급수 : ${p.mentionCount ?? 0}
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
          role: 'system',
         content: `너는 SeoulMate AI 관광 도우미다.

역할:
서울 관광 공공데이터와 실제 커뮤니티 게시글을 기반으로 지역 정보를 제공한다.

가장 중요한 원칙:
절대로 데이터를 만들거나 추측하지 않는다.
제공된 데이터에 없는 내용은 "정보 없음"으로 답한다.


========================
질문 처리 규칙
========================


1. 장소 추천 질문

사용자가 장소 추천을 요청하면:

반드시 관련 커뮤니티 게시글을 우선 확인한다.

추천 우선순위:

1) 해당 장소 관련 게시글 개수
2) 게시글 조회수
3) 게시글 좋아요
4) 관광지 데이터


관광지 정보보다 실제 커뮤니티 언급량을 우선한다.


========================


2. 인기 장소 질문

다음 질문은 인기 분석 요청으로 판단한다.

- 최근 인기 장소
- 요즘 뜨는 곳
- 핫플 알려줘
- 사람들이 많이 가는 곳


이 경우 관광지 데이터를 기준으로 판단하지 않는다.

반드시 커뮤니티 게시글 데이터를 기반으로 한다.


출력 예:

"최근 커뮤니티에서 많이 언급된 장소예요."


장소 선정 기준:

게시글 작성 수
>
조회수
>
좋아요

인기 장소는 반드시 [인기 장소 분석] 데이터를 기준으로 한다.
커뮤니티 게시글 하나만으로 인기 장소라고 판단하지 않는다.
========================


3. 혼잡도 / 사람 많음 질문

다음 유형:

- 사람 많아?
- 붐벼?
- 혼잡해?
- 방문객 많아?


반드시 관련된 커뮤니티 후기 데이터가 있어야 한다.


데이터가 없으면:

"해당 정보는 등록된 커뮤니티 데이터에서 확인되지 않아요."


라고 답한다.


절대:

- 주말에는 많다
- 인기 장소라 많다
- 보통 사람이 많다

같은 일반적인 추측을 하지 않는다.


========================


4. 커뮤니티 게시글 규칙


관련 게시글은 반드시 제공된 데이터만 사용한다.


금지:

- 새로운 제목 생성
- 새로운 작성자 생성
- 새로운 조회수 생성
- 새로운 후기 생성


게시글이 없으면:

"관련 게시글 없음"


으로 처리한다.


========================


5. 주민 TIP 규칙


주민 TIP은 제공된 relatedTips 데이터만 표시한다.


AI가 주민 경험처럼 작성하지 않는다.


========================


6. 답변 형식


answer:

설명 문장만 작성한다.


answer 안에는:

- 게시글 목록
- 주민 TIP
- 추천 장소 목록

을 직접 작성하지 않는다.


관련 데이터는 JSON 필드로 반환한다.


========================


7. 데이터 부족 처리


관련 데이터가 없으면:

"현재 등록된 데이터에서는 확인하기 어려워요."


라고 답한다.


AI의 일반 지식으로 보충하지 않는다.


========================


JSON 형식으로만 반환한다.


${contextText}
`,
        },
        ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: 'json_object' },
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
  const cleanQ = cleanQuestion(question);

  if (/(인기|요즘|트렌드|핫한|뜨는)/.test(q) && rankedPlaces.length === 0) {
    return {
      answer: [
        "요즘 지역 커뮤니티에서 자주 언급되는 곳은 다음과 같아요.",      
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

if (
  rankedPlaces.length === 0 &&
  rankedPosts.length === 0 &&
  rankedTips.length === 0
) {    return {
      answer:
`${question}와 관련된 등록 데이터가 아직 없어요.`,

      relatedPosts: [],
      relatedTips: [],
      relatedPlaces: [],

      needCommunityPost: true,

      suggestions: ["비슷한 장소", "주민 추천", "다른 후기"],
    };
  }

  const lines = [];
  const place = rankedPlaces[0];
const isOnlyPlaceQuestion =
 question.replace(/추천|알려줘|근처|주변|코스|데이트/g,"")
 === place.name;

  function cleanQuestion(question){

 return question
 .replace(
 /추천해줘|알려줘|알려주세요|해주세요|추천|알려/g,
 ""
 )
 .trim();

}

  if (place) {
   const keywordText = question.trim();


if (isOnlyPlaceQuestion) {

  lines.push(
    `${place.name}에 대해 찾아봤어요.`
  );

  if(place.description){
    lines.push(place.description);
  } else {
    lines.push(
      `${place.name} 관련 정보를 확인해봤어요.`
    );
  }

} else {

  lines.push(
    `${cleanQ}에 대해 찾아봤어요.`
    
  );

  lines.push("");

  lines.push(
`${place.name} 주변에서 방문하기 좋은 장소를 중심으로 추천해드릴게요.`
);

}
  }

  if (rankedTips.length > 0) {
    lines.push("");
    lines.push("[지역 주민 TIP]");
    rankedTips
      .slice(0, 3)
      .forEach((t) => lines.push(`- ${t.author}: "${t.content}"`));
  }

  // if (rankedPosts.length > 0) {
  //   lines.push("");
  //   lines.push("[관련 커뮤니티 게시글]");
  //   rankedPosts
  //     .slice(0, 3)
  //     .forEach((p) => lines.push(`- ${p.title} (조회 ${p.views || 0})`));
  //   lines.push("");
  //   lines.push("원하시면 더 구체적인 추천이나 일정 형태로도 답해드릴게요!");
  // }

  return {
    answer: lines.join("\n"),
    relatedPosts: rankedPosts.slice(0, 3),
    relatedTips: rankedTips.slice(0, 3),
    relatedPlaces: rankedPlaces.slice(0, 3),
    needCommunityPost: rankedPosts.length === 0 && rankedTips.length === 0,
    suggestions: ["주변 맛집도 알려줘", "비슷한 장소 추천", "교통편 알려줘"],
  };
}

/**
 * 챗봇 진입점 — API 키 유무에 따라 자동 분기
 * 반환 타입은 화면 출력이 안전하도록 항상 문자열로 통일한다.
 */
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
