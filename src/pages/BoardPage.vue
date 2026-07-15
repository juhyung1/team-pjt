<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import seoulData from '../data/seoul_attractions.json'

const posts = ref<any[]>([])
try {
  const raw = localStorage.getItem('posts')
  const parsed = raw ? JSON.parse(raw) : []
  posts.value = Array.isArray(parsed) ? parsed : []
} catch {
  posts.value = []
}

const topThree = ref<{ name: string; count: number }[]>([])
const isFloating = ref(false)
let lastScrollY = 0

function onScroll() {
  const y = window.scrollY || window.pageYOffset
  // enable floating after user scrolled past header area
  isFloating.value = y > 120
  lastScrollY = y
}

function computeTopThree() {
  const items = Array.isArray((seoulData as any)?.items) ? (seoulData as any).items : []
  const titles = items.map((it: any) => String(it.title || '').trim()).filter(Boolean)
  const lowerTitles = titles.map((t: string) => t.toLowerCase())

  const counts = new Map<string, number>()

  posts.value.forEach((p) => {
    const text = `${p.title || ''} ${p.content || ''} ${p.place || ''} ${(Array.isArray(p.places) ? p.places.join(' ') : '')}`.toLowerCase()
    lowerTitles.forEach((lt, idx) => {
      if (!lt) return
      if (text.includes(lt)) {
        const title = titles[idx]
        counts.set(title, (counts.get(title) || 0) + 1)
      }
    })
    // also count explicit place field if it's not a known title
    if (p.place && !lowerTitles.includes(String(p.place).toLowerCase())) {
      const name = String(p.place)
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    if (Array.isArray(p.places)) {
      p.places.forEach((pp: string) => {
        if (!pp) return
        const name = String(pp)
        counts.set(name, (counts.get(name) || 0) + 1)
      })
    }
  })

  const arr = Array.from(counts.entries()).map(([name, count]) => ({ name, count }))
  arr.sort((a, b) => b.count - a.count)
  topThree.value = arr.slice(0, 3)
}

// Keep posts and TOP3 in sync with localStorage (polling + reactive watch)
let pollId: number | null = null
let lastRaw = ''

function readPostsFromStorage() {
  try {
    const raw = localStorage.getItem('posts') || ''
    if (raw !== lastRaw) {
      lastRaw = raw
      const parsed = raw ? JSON.parse(raw) : []
      posts.value = Array.isArray(parsed) ? parsed : []
    }
  } catch {
    posts.value = []
  }
}

onMounted(() => {
  readPostsFromStorage()
  computeTopThree()
  // poll for changes from other parts of the app
  pollId = window.setInterval(() => {
    const prev = JSON.stringify(posts.value)
    readPostsFromStorage()
    // if posts changed, recompute
    if (JSON.stringify(posts.value) !== prev) computeTopThree()
  }, 1000)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  if (pollId) window.clearInterval(pollId)
  window.removeEventListener('scroll', onScroll)
})

// recompute when posts array changes within this component
watch(posts, () => computeTopThree(), { deep: true })
</script>

<template>
  <div class="board-layout container">
    <main class="board-main">
      <h1>게시판</h1>

      <div class="posts-list">
        <p v-if="!posts.length">아직 게시글이 없습니다.</p>
        <ul v-else>
          <li v-for="post in posts" :key="post.id" class="post-row">
            <div class="post-title">{{ post.title }}</div>
            <div class="post-meta">{{ post.region || post.address || post.place }}</div>
          </li>
        </ul>
      </div>
    </main>

    <aside class="top3-widget" v-if="topThree.length">
      <div class="widget-inner">
        <h3>가장 많이 언급된 장소 TOP3</h3>
        <ol class="top3-list">
          <li v-for="(p, i) in topThree" :key="p.name" class="top3-item">
            <span class="rank">#{{ i + 1 }}</span>
            <div class="meta">
              <div class="name">{{ p.name }}</div>
              <div class="count">{{ p.count }}회</div>
            </div>
          </li>
        </ol>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.board-layout { display: flex; gap: 24px; align-items: flex-start }
.board-main { flex: 1 }
.posts-list { margin-top: 16px }
.post-row { padding: 12px 0; border-bottom: 1px solid var(--color-border) }
.post-title { font-weight: 600 }
.post-meta { color: var(--color-muted); font-size: 0.95rem }

.top3-widget { width: 300px }

.top3-widget .widget-inner { background: var(--color-card-bg); border: 1px solid rgba(14,23,42,0.04); border-radius: 10px; padding: 10px; box-shadow: 0 6px 16px rgba(17,24,39,0.04); transition: transform 260ms cubic-bezier(.2,.9,.3,1), box-shadow 260ms }
.top3-widget h3 { margin: 0 0 10px 0; font-size: 1rem }
.top3-list { list-style: none; padding: 0; margin: 0 }
.top3-item { display: flex; gap: 12px; align-items: center; padding: 8px 6px; border-radius: 8px; transition: background 160ms }
.top3-item:hover { background: rgba(59,130,246,0.04) }
.top3-item .rank { font-weight: 700; color: #fff; background: var(--color-primary); width: 34px; height: 34px; display:flex; align-items:center; justify-content:center; border-radius: 6px; font-size:0.95rem }
.top3-item .meta { display:flex; justify-content: space-between; width: 100%; gap: 8px; align-items:center }
.top3-item .name { font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.top3-item .count { color: var(--color-muted); font-size: 0.9rem }

/* floating state: subtle translate and stronger shadow to create "following" impression */
.top3-widget.floating .widget-inner { transform: translateY(8px); box-shadow: 0 10px 30px rgba(17,24,39,0.08) }

/* sticky behavior but within flow so it won't overlap content */
@media (min-width: 900px) {
  .top3-widget { position: -webkit-sticky; position: sticky; top: 96px; align-self: start }
}

@media (max-width: 899px) {
  .top3-widget { display: none }
}

</style>