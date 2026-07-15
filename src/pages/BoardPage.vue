<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import TrendingAside from '../components/TrendingAside.vue'

const router = useRouter()

const searchTerm = ref('')
const posts = ref([])
const page = ref(1)
const pageSize = 10

function loadPosts() {
  try {
    const raw = localStorage.getItem('posts')
    const parsed = raw ? JSON.parse(raw) : []
    posts.value = Array.isArray(parsed) ? parsed : []
  } catch {
    posts.value = []
  }
}

function handleStorage(e) {
  if (e.key === 'posts') loadPosts()
}

onMounted(() => {
  loadPosts()
  window.addEventListener('storage', handleStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorage)
})

const filtered = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  const list = [...posts.value].sort((a, b) => {
    const diff = new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
    return diff || Number(b.id) - Number(a.id)
  })
  if (!q) return list
  return list.filter((p) => {
    const t = String(p.title ?? '').toLowerCase()
    const c = String(p.content ?? '').toLowerCase()
    return t.includes(q) || c.includes(q)
  })
})

const totalItems = computed(() => filtered.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))

watch([totalItems, page], () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

const paged = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

function formatMMDD(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}.${dd}`
}

function goDetail(id) {
  router.push(`/board/${id}`)
}

function prevPage() {
  if (page.value > 1) page.value--
}
function nextPage() {
  if (page.value < totalPages.value) page.value++
}
function setPage(n) {
  page.value = n
}

const pageNumbers = computed(() => {
  const arr = []
  for (let i = 1; i <= totalPages.value; i++) arr.push(i)
  return arr
})

function overallNumber(indexInPage) {
  // newest has largest number
  return totalItems.value - ((page.value - 1) * pageSize) - indexInPage
}
</script>

<template>
  <div class="board-page">
    <div class="board-header">
      <div>
        <p class="eyebrow">서울 권역</p>
        <h1 class="page-title">커뮤니티 게시판</h1>
        <p class="subtitle">지역 주민과 방문자가 익명으로 장소 경험을 공유하는 공간입니다.</p>
      </div>
      </div>

      <div class="board-layout">
        <div class="board-main">
          <div class="search-row">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="게시글 검색어를 입력하세요"
        class="search-input"
      />
    </div>

      <div class="card table-card">
      <table class="posts-table">
        <thead>
          <tr>
            <th class="col-num">번호</th>
            <th class="col-title">제목</th>
            <th class="col-date">작성일</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="!totalItems" class="no-rows">
            <td colspan="3">아직 게시글이 없어요.</td>
          </tr>

          <tr
            v-for="(post, idx) in paged"
            :key="post.id"
            class="post-row"
            @click="goDetail(post.id)"
          >
            <td class="col-num">{{ overallNumber(idx) }}</td>

            <td class="col-title">
              <router-link :to="`/board/${post.id}`" @click.stop>{{ post.title }}</router-link>
              <span v-if="post.isResident" class="resident-badge">주민 참여</span>
            </td>

            <td class="col-date">{{ formatMMDD(post.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" @click="prevPage" :disabled="page===1">&lt;</button>

      <button
        v-for="n in pageNumbers"
        :key="n"
        class="page-btn"
        :class="{ active: n === page }"
        @click="setPage(n)"
      >
        {{ n }}
      </button>

      <button class="page-btn" @click="nextPage" :disabled="page===totalPages">&gt;</button>
        </div>
      </div>

      <aside class="board-aside">
        <TrendingAside />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.board-page {
  margin: 0 auto;
  padding: 24px;
  max-width: 1200px;
  box-sizing: border-box;
}

.board-layout {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 24px;
  align-items: start;
}

.board-main { min-width:0 }

.board-aside {
  position: sticky;
  top: 88px;
}

@media (max-width: 1024px) {
  .board-layout { grid-template-columns: 1fr }
  .board-aside { position: static }
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
}

.eyebrow {
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0 0 6px;
}

.subtitle {
  color: var(--color-muted);
  margin: 6px 0 0;
}

.search-row {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  box-sizing: border-box;
}

.card.table-card {
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.posts-table {
  width: 100%;
  border-collapse: collapse;
}

.posts-table thead {
  background: var(--color-muted-surface);
}

.posts-table th,
.posts-table td {
  padding: 12px 16px;
  text-align: left;
}

.posts-table tbody tr + tr {
  border-top: 1px solid var(--color-border);
}

.post-row {
  cursor: pointer;
  transition: background 0.12s ease;
}

.post-row:hover {
  background: var(--color-muted-surface);
}

.col-num {
  width: 80px;
  color: var(--color-muted);
}

.col-date {
  width: 110px;
  color: var(--color-muted);
}

.col-title a {
  color: inherit;
  text-decoration: none;
}

.col-title a:hover {
  text-decoration: underline;
}

.resident-badge {
  background: var(--color-muted-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-muted);
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  margin-left: 8px;
  padding: 3px 6px;
  vertical-align: middle;
  white-space: nowrap;
}

/* pagination */
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

.page-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  min-width: 36px;
}

.page-btn.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* small states */
.no-rows td {
  padding: 28px;
  text-align: center;
  color: var(--color-muted);
}
</style>
