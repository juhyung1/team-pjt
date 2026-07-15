<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { askChatbot } from '../../services/chatService'
import { isChatbotOpen } from '../../composables/uiState'

// 전역 공유 상태 — 글쓰기 FAB이 대화창 위로 밀려나는 연출에 사용
const isOpen = isChatbotOpen
const input = ref('')
const bodyEl = ref(null)
const isLoading = ref(false)

const DEFAULT_SUGGESTIONS = ['경복궁 야간개장 후기 알려줘', '서울숲 주민 추천 있어?', '요즘 인기 장소는?']
const suggestions = ref([...DEFAULT_SUGGESTIONS])

const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content: '안녕하세요! SeoulMate 지역 도우미예요. 😊\n서울 관광지·주민 팁·커뮤니티 글을 기반으로 답해드려요.',
  },
])

function toggle() {
  isOpen.value = !isOpen.value
}

async function submit(text) {
  const message = (text ?? input.value).trim()
  if (!message || isLoading.value) return

  input.value = ''
  suggestions.value = []
  messages.value.push({ id: Date.now(), role: 'user', content: message })
  isLoading.value = true

  try {
    const history = messages.value.slice(-6).map(({ role, content }) => ({ role, content }))
    const result = await askChatbot(message, history)

    // 문자열 또는 { answer, suggestions } 객체 모두 안전하게 처리
    const answer = typeof result === 'string' ? result : String(result?.answer ?? '')
    const next = result && typeof result === 'object' && Array.isArray(result.suggestions)
      ? result.suggestions
      : []

    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: answer || '답변을 가져오지 못했어요. 다시 시도해주세요.',
    })
    suggestions.value = next.slice(0, 3)
  } catch (error) {
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: '답변 생성 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
    })
  } finally {
    isLoading.value = false
  }
}

watch(
  () => [messages.value.length, isLoading.value],
  async () => {
    await nextTick()
    bodyEl.value?.scrollTo({ top: bodyEl.value.scrollHeight, behavior: 'smooth' })
  },
)

onBeforeUnmount(() => {
  bodyEl.value = null
})
</script>

<template>
  <div class="chatbot">
    <section v-if="isOpen" class="chatbot__panel">
      <header class="chatbot__header">
        <div>
          <p class="chatbot__title">지역 도우미</p>
          <p class="chatbot__subtitle">서울 공공데이터 · 커뮤니티 기반 답변</p>
        </div>
        <button class="chatbot__close" type="button" aria-label="챗봇 닫기" @click="toggle">✕</button>
      </header>

      <div ref="bodyEl" class="chatbot__body">
      <div
        v-for="m in messages"
        :key="m.id"
        class="chatbot__msg"
        :class="`chatbot__msg--${m.role}`"
      >
        {{ m.content }}
      </div>

      <div v-if="isLoading" class="chatbot__msg chatbot__msg--assistant">
        <span class="chatbot__typing" aria-label="답변 생성 중">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>

      <div v-if="suggestions.length && !isLoading" class="chatbot__suggestions">
        <button
          v-for="s in suggestions"
          :key="s"
          class="chip"
          @click="submit(s)"
        >
          {{ s }}
        </button>
      </div>

      <form class="chatbot__input-row" @submit.prevent="submit()">
        <input v-model="input" class="chatbot__input" placeholder="메시지를 입력하세요" />
        <button type="submit" class="btn" :disabled="isLoading">전송</button>
      </form>
    </section>

    <button
      class="chatbot__fab"
      :class="{ 'chatbot__fab--open': isOpen }"
      @click="toggle"
      :aria-label="isOpen ? '챗봇 닫기' : '챗봇 열기'"
    >
    <span class="chatbot__fab-icon">
  <!-- 닫혀있을 때: 말풍선 아이콘 -->
  <svg v-if="!isOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="white">
    <path
      d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.42 0-2.76-.33-3.95-.92L3 21l1.48-5.1A8.46 8.46 0 0 1 3.5 12 8.5 8.5 0 0 1 12 3.5 8.5 8.5 0 0 1 21 12Z"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
  </svg>

  <!-- 열려있을 때: 닫기(X) 아이콘 -->
  <svg v-else width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true" stroke="white">
    <path 
      d="M2 2l10 10M12 2L2 12" 
      stroke-width="1.8" 
      stroke-linecap="round" 
    />
  </svg>
</span>
    </button>
  </div>
</template>

<style scoped>
.chatbot__fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.chatbot__fab:hover {
  transform: scale(1.06);

}
.chatbot__fab--open {
  background: #0f172a;
}

.chatbot__fab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.chatbot__fab--open .chatbot__fab-icon {
  transform: rotate(90deg);
}

.chatbot__panel {
  position: fixed;
  right: 24px;
  bottom: 96px;
  z-index: 2001;
  width: 320px;
  max-width: calc(100vw - 32px);
  height: 460px;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
  overflow: hidden;
  animation: panel-up 0.2s ease;
}

/* 모바일: 전체 화면 대화창 (의뢰서 화면 구성 ⑤) */
@media (max-width: 640px) {
  .chatbot__panel {
    inset: 0;
    width: 100%;
    max-width: none;
    height: 100%;
    border-radius: 0;
  }
  .chatbot__fab--open {
    display: none; /* 전체 화면일 땐 헤더의 ✕ 버튼으로 닫기 */
  }
}

.chatbot__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.chatbot__title {
  font-weight: 800;
  margin: 0;
}

.chatbot__subtitle {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin: 2px 0 0;
}

.chatbot__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--color-bg);
}

.chatbot__msg {
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  line-height: 1.5;
  white-space: pre-line;
}

.chatbot__msg--assistant {
  background: #f1f5f9;
}

.chatbot__msg--user {
  background: var(--color-primary);
  color: #fff;
}

.chatbot__input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--color-border);
}

.chatbot__input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.chatbot__close {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
}

.chatbot__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
}

.chip {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.chatbot__typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.chatbot__typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.chatbot__typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.chatbot__typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes panel-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
