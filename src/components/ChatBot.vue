<template>
  <div>
    <button class="fab" @click="open = !open" :aria-expanded="open">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#fff"/>
      </svg>
    </button>

    <div v-if="open" class="panel" role="dialog" aria-label="SeoulMate 챗봇">
      <div class="panel-header">
        <div class="title">SeoulMate 챗봇</div>
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
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import seoulData from '../data/seoul_attractions.json'

const open = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([])
const bodyRef = ref(null)

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const seoulItems = ref(Array.isArray(seoulData?.items) ? seoulData.items : [])

async function ensureSeoulData() {
  if (seoulItems.value && seoulItems.value.length) return
  try {
    // try fetching JSON from the project data folder
    const res = await fetch('/src/data/seoul_attractions.json')
    if (!res.ok) return
    const j = await res.json()
    if (Array.isArray(j?.items)) seoulItems.value = j.items
  } catch (e) {
    // ignore
  }
}

// ensure data on mount
onMounted(() => {
  ensureSeoulData()
})

function updateFabBottom() {
  const panelEl = document.querySelector('.panel')
  if (panelEl && open.value) {
    const rect = panelEl.getBoundingClientRect()
    // distance from bottom of viewport to top of panel
    const distance = Math.max(0, window.innerHeight - rect.top)
    // place fab above panel with extra margin
    const margin = 24
    const value = distance + margin
    document.documentElement.style.setProperty('--fab-bottom', value + 'px')
  } else {
    document.documentElement.style.setProperty('--fab-bottom', '88px')
  }
}

watch(open, async (v) => {
  await nextTick()
  updateFabBottom()
})

function onResize() { updateFabBottom() }
window.addEventListener('resize', onResize)
onUnmounted(()=>{ window.removeEventListener('resize', onResize); document.documentElement.style.setProperty('--fab-bottom','88px') })

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

function tokenizeQuery(query) {
  if (!query) return []
  const words = String(query)
    .split(/\s+/)
    .map(w => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .filter(w => w.length >= 2)
  return words
}

function findPlaces(query) {
  if (!query) return []
  const tokens = tokenizeQuery(query).map(t => t.toLowerCase())
  if (!tokens.length) return []
  const items = Array.isArray(seoulItems.value) ? seoulItems.value : []
  const matched = items.filter(i => {
    const title = String(i.title || '').toLowerCase()
    return tokens.some(tok => title.includes(tok))
  })
  return matched.slice(0,5)
}

function findPosts(query) {
  try {
    const raw = localStorage.getItem('posts')
    const parsed = raw ? JSON.parse(raw) : []
    const tokens = tokenizeQuery(query).map(t => t.toLowerCase())
    if (!tokens.length) return []
    return (Array.isArray(parsed) ? parsed : []).filter(p => {
      const text = (String(p.title||'') + ' ' + String(p.content||'')).toLowerCase()
      return tokens.some(tok => text.includes(tok))
    }).slice(0,3)
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
  const places = findPlaces(q)
  const postsRef = findPosts(q)
  const refDataParts = []
  if (places.length) {
    refDataParts.push('관광지 참고:')
    places.forEach(p => refDataParts.push(`- ${p.title} (${p.addr1||''})`))
  }
  if (postsRef.length) {
    refDataParts.push('게시글 참고:')
    postsRef.forEach(p => refDataParts.push(`- ${p.title}: ${String(p.content||'').slice(0,120)}`))
  }
  const refData = refDataParts.join('\n')

  let systemContent = ''
  if (refData) {
    systemContent = `너는 서울 지역 관광 정보 챗봇입니다. 아래 참고 데이터를 근거로 한국어로 친절하고 간결하게 답변하세요.\n\n참고 데이터:\n${refData}`
  } else {
    systemContent = '참고 데이터 없음. 서울 관련 일반 정보로 답하되 추측은 피하라.'
  }

  if (!OPENAI_KEY) {
    pushBot('API 키가 설정되지 않았어요')
    return
  }

  // show typing indicator
  pushBot('...')
  loading.value = true

  const msgs = []
  msgs.push({ role: 'system', content: systemContent })
  messages.value.forEach(m => msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
     body: JSON.stringify({
      model: 'gpt-5-mini',
      messages: msgs,
      max_completion_tokens: 2000,
      reasoning_effort: 'low'
})
    })

    if (!res.ok) {
     const err = await res.json().catch(() => null)
     console.error('OpenAI 에러:', res.status, err)
     throw new Error('api error')
}
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    // replace the last typing indicator assistant message
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i].role === 'assistant' && messages.value[i].content === '...') {
        messages.value.splice(i, 1)
        break
      }
    }
    if (text) pushBot(text)
    else pushBot('잠시 후 다시 시도해주세요')
  } catch (e) {
    // replace typing indicator
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i].role === 'assistant' && messages.value[i].content === '...') {
        messages.value.splice(i, 1)
        break
      }
    }
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
  border-radius: var(--radius-md);
  box-shadow: 0 12px 40px rgba(2,6,23,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
}

@media (max-width: 640px) {
  .panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
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
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.send {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
}
.msg { margin-bottom: 10px; display:flex }
.msg.user { justify-content: flex-end }
.msg.bot { justify-content: flex-start }
.bubble { max-width: 76%; padding: 8px 12px; border-radius: var(--radius-md); line-height:1.4 }
.msg.user .bubble { background: var(--color-primary); color: #fff; border-bottom-right-radius: 4px }
.msg.bot .bubble { background: var(--color-muted-surface); color: var(--color-text) }
</style>
