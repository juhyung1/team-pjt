import { ref } from 'vue'

/**
 * 전역 UI 상태 (가벼운 공유 상태 — 스토어 라이브러리 불필요)
 * 챗봇 패널 열림 여부: 글쓰기 FAB이 챗봇 대화창 위로 밀려 올라가는 연출에 사용한다.
 */
export const isChatbotOpen = ref(false)
