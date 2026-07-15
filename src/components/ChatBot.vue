<template>
  <div>
    <button class="fab" @click="open = !open" :aria-expanded="open">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#fff"/>
      </svg>
    </button>

    <div v-if="open" class="panel" role="dialog" aria-label="LocalHub 챗봇">
      <div class="panel-header">
        <div class="title">LocalHub 챗봇</div>
        <button class="close" @click="open = false">✕</button>
      </div>

      <div class="panel-body" ref="bodyRef">
        <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role==='user'? 'user':'bot']">
          <div class="bubble">{{ m.content }}</div>
        </div>
      </div>

      <div class="panel-footer">
        <input
          v-model="input"
          :disabled="loading"
          @keydown.enter.prevent="send"
          placeholder="메시지를 입력하세요"
          class="input"
        />
        <button class="send" @click="send" :disabled="loading">{{ loading? '답변 작성 중...':'전송' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import seoulData from '../data/seoul_attractions.json'

const open = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([])
const bodyRef = ref(null)

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

function pushBot(text) {
  messages.value.push({ role: 'assistant', content: text })
}

function pushUser(text) {
  messages.value.push({ role: 'user', content: text })
}

onMounted(() => {
  // 초기 환영 메시지
  messages.value.push({ role: 'assistant', content: '안녕하세요! 서울 관광지에 대해 물어보세요' })
})

watch(messages, async () => {
  await nextTick()
  // 자동 스크롤
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight
  }
})

function findPlaces(query) {
  if (!query) return []
  const q = String(query).toLowerCase()
  const items = Array.isArray(seoulData?.items) ? seoulData.items : []
  return items.filter(i => String(i.title || '').toLowerCase().includes(q)).slice(0,5)
}

function findPosts(query) {
  try {
    const raw = localStorage.getItem('posts')
    const parsed = raw ? JSON.parse(raw) : []
    const q = String(query).toLowerCase()
    return (Array.isArray(parsed) ? parsed : [])
      .filter(p => (String(p.title||'')+ ' ' + String(p.content||'')).toLowerCase().includes(q))
      .slice(0,3)
  } catch {
    return []
  }
}

function buildSystemMessage(query) {
  const places = findPlaces(query)
  const posts = findPosts(query)
  const parts = []
  if (places.length) {
    parts.push('관광지 참고:')
    places.forEach(p => parts.push(`- ${p.title} (${p.addr1||''})`))
  }
  if (posts.length) {
    parts.push('게시글 참고:')
    posts.forEach(p => parts.push(`- ${p.title}: ${String(p.content||'').slice(0,120)}`))
  }
  return parts.join('\n')
}

async function send() {
  const q = input.value && input.value.trim()
  if (!q) return
  pushUser(q)
  input.value = ''

  // prepare system message with reference data
  const refData = buildSystemMessage(q)

  if (!OPENAI_KEY) {
    pushBot('API 키가 설정되지 않았어요')
    return
  }

  loading.value = true

  const msgs = []
  // system message: instruct model and include reference data
  msgs.push({ role: 'system', content: `너는 서울 지역 정보 챗봇입니다. 아래 참고 데이터를 근거로 한국어로 친절하고 간결하게 답변하세요.\n\n참고 데이터:\n${refData}` })
  // include conversation history
  messages.value.forEach(m => msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: msgs, max_tokens: 600 })
    })

    if (!res.ok) throw new Error('api error')
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (text) pushBot(text)
    else pushBot('잠시 후 다시 시도해주세요')
  } catch (e) {
    pushBot('잠시 후 다시 시도해주세요')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(2,6,23,0.08);
  z-index: 1000;
  cursor: pointer;
}
.panel {
  position: fixed;
  right: 20px;
  bottom: 88px;
  width: 360px;
  height: 480px;
  background: var(--color-surface);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(2,6,23,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  font-weight: 700;
}
.panel-body {
  padding: 12px;
  flex: 1 1 auto;
  overflow-y: auto;
  background: var(--color-muted-surface);
}
.panel-footer {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--color-border);
}
.input {
  flex: 1 1 auto;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}
.send {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
}
.msg { margin-bottom: 10px; display:flex }
.msg.user { justify-content: flex-end }
.msg.bot { justify-content: flex-start }
.bubble { max-width: 76%; padding: 8px 12px; border-radius: 12px; line-height:1.4 }
.msg.user .bubble { background: var(--color-primary); color: #fff; border-bottom-right-radius: 4px }
.msg.bot .bubble { background: var(--color-muted-surface); color: var(--color-text) }
</style>
