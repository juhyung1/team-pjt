<template>
  <button
    v-if="!isWriteRoute"
    class="write-fab"
    @click="goWrite"
    aria-label="글쓰기"
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const isWriteRoute = computed(() => route.path === '/write')

function goWrite(){ router.push('/write') }
</script>

<style scoped>
.write-fab{
  position: fixed;
  right: 20px;
  bottom: var(--fab-bottom, 88px);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--color-border);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  z-index:1000;
  transition: background 150ms ease, color 150ms ease, bottom 220ms cubic-bezier(.2,.9,.2,1);
}
.write-fab:hover{ background: var(--color-primary); }
.write-fab:hover svg path{ stroke: #fff }
</style>
