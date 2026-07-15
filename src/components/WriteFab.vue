<template>
  <router-link
    v-if="!isWriteRoute"
    to="/write"
    class="write-fab"
    :class="{ 'write-fab--pushed': isChatbotOpen }"
    aria-label="글쓰기"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isChatbotOpen } from '../composables/uiState'

const route = useRoute()
const isWriteRoute = computed(() => route.path === '/write')
</script>

<style scoped>
.write-fab {
  position: fixed;
  right: 24px;
  bottom: 88px; /* 챗봇 FAB(56px) 위 */
  z-index: 2000;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
  transition:
    bottom 260ms cubic-bezier(0.2, 0.9, 0.2, 1),
    background 150ms ease,
    transform 150ms ease;
}

.write-fab:hover {
  background: var(--color-primary);
  transform: scale(1.06);
}

.write-fab:hover svg path {
  stroke: #fff;
}

/* 챗봇 대화창(bottom 96 + height 460)이 열리면 그 위로 자연스럽게 슬라이드 */
.write-fab--pushed {
  bottom: 568px;
}

/* 모바일: 챗봇이 전체 화면이므로 열려 있는 동안 숨김 */
@media (max-width: 640px) {
  .write-fab--pushed {
    display: none;
  }
}
</style>
