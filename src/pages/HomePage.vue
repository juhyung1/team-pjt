<script setup>
import { computed, ref } from 'vue'
import seoulData from '../data/seoul_attractions.json'
import HomeTrends from '../components/HomeTrends.vue'

const posts = ref([])

try {
  const raw = localStorage.getItem('posts')
  const parsed = raw ? JSON.parse(raw) : []
  posts.value = Array.isArray(parsed) ? parsed : []
} catch (e) {
  posts.value = []
}

const popularPlaces = computed(() => {
  const items = Array.isArray(seoulData?.items) ? seoulData.items : []
  return items.filter(p => p?.firstimage).slice(0, 8)
})

// favorites
const favorites = ref([])
function loadFav(){ try{ const raw=localStorage.getItem('favorites'); favorites.value = raw? JSON.parse(raw): [] }catch{ favorites.value = [] } }
function isFav(contentid){ return favorites.value.some(id=>String(id)===String(contentid)) }
function toggleFav(contentid){ const id=String(contentid); if(isFav(id)){ favorites.value = favorites.value.filter(x=>String(x)!==id) } else { favorites.value.push(id) } localStorage.setItem('favorites', JSON.stringify(favorites.value)) }
loadFav()

// toast management (resettable timeout)
const toast = ref('')
let toastTimer = null
function showToast(msg){
  toast.value = msg
  if(toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(()=>{ toast.value = ''; toastTimer = null }, 2000)
}
function toggleFavWithToast(contentid){
  toggleFav(contentid)
  showToast(isFav(contentid)? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 삭제되었습니다.')
}

// top mentioned places for image ranking (only places with firstimage will later be filtered when generating topPlaces4)
function tokenize(s){ return String(s||'').toLowerCase() }
const placeCounts = (()=>{
  const counts = {}
  posts.value.forEach(p=>{
    const text = tokenize(p.title+' '+p.content)
    seoulData.items.forEach(it=>{
      const name = String(it.title||'')
      if(name.length<=2) return
      const lower = name.toLowerCase()
      if(text.includes(lower)){
        counts[lower] = (counts[lower]||0)+1
      }
    })
  })
  return counts
})()

const topPlaces4 = (()=>{
  // only include items that have firstimage
  const arr = Object.keys(placeCounts).map(k=>{
    const found = seoulData.items.find(i=>String(i.title||'').toLowerCase()===k) || {}
    return { title:k, count:placeCounts[k], firstimage: found.firstimage, contentid: found.contentid, gu: found.addr1 }
  }).filter(x => x.firstimage)
  if(arr.length===0){
    return popularPlaces.value.slice(0,4).map(p=>({ title:p.title, count:0, firstimage:p.firstimage, contentid:p.contentid, gu:p.addr1 }))
  }
  arr.sort((a,b)=>b.count-a.count)
  return arr.slice(0,4)
})()

const popularPosts5 = computed(()=> posts.value.slice().sort((a,b)=> (b.views + (b.likes||0)*3) - (a.views + (a.likes||0)*3)).slice(0,5))

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div>
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-label">
          지역 정보 공유 커뮤니티
        </div>

        <h1 class="hero-title">
          지역 주민의 경험이<br />
          방문자의 선택이 됩니다
        </h1>

        <p class="hero-desc">
          이 곳에서 지역 주민들이 추천하는 장소와 이야기를 찾아보세요.
        </p>
      </div>
    </section>

    <!-- Now trending places (image ranking) -->
    <section class="container section">
      <h2 class="section-title">지금 뜨는 장소</h2>
      <div class="places-grid">
        <article v-for="(p, idx) in topPlaces4" :key="p.contentid" class="place-rank-card">
          <div class="media-wrap">
            <img v-if="p.firstimage" :src="p.firstimage" :alt="p.title" class="media-img" />
            <div v-else class="media-placeholder">{{ p.title }}</div>
            <span class="badge" :class="{ top: idx===0 }">{{ idx+1 }}</span>
          </div>

          <div class="place-info">
            <div class="place-name-and-star">
              <div class="place-name" title="">{{ p.title }}</div>

              <!-- star on the right, fixed area -->
              <button class="star-right" :class="{ on: isFav(p.contentid) }" @click.stop="toggleFavWithToast(p.contentid)" aria-label="즐겨찾기">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 17.3l-6.16 3.64 1.18-6.88L2 9.9l6.92-1L12 2l3.08 6.9L22 9.9l-4.02 4.16 1.18 6.88L12 17.3z"
                    :fill="isFav(p.contentid)? '#FBBF24':'none'"
                    :stroke="isFav(p.contentid)? '#FBBF24':'#9CA3AF'"
                    stroke-width="1.2"/>
                </svg>
              </button>
            </div>

            <div class="place-meta">언급 {{ p.count }}회 · {{ p.gu }}</div>
          </div>
        </article>
      </div>
    </section>

    <!-- Community popular posts -->
    <section class="container section">
      <div class="section-head">
        <h2 class="section-title">커뮤니티 인기 글</h2>
        <router-link to="/board" class="link-more">게시판 가기 →</router-link>
      </div>

      <div class="card popular-posts">
        <ul class="pop-list">
          <li v-for="p in popularPosts5" :key="p.id" class="pop-item">
            <router-link :to="`/board/${p.id}`" class="pop-link">
              <div class="pop-title">{{ p.title }}</div>
              <div class="pop-excerpt">{{ (p.content||'').slice(0,60) }}</div>
              <div class="pop-meta">조회 {{ p.views }} · 좋아요 {{ p.likes||0 }}</div>
            </router-link>
          </li>
        </ul>
      </div>
    </section>

    <!-- More places (existing) -->
    <section class="container section">
      <h2 class="section-title">더 둘러보기 <router-link to="/explore" class="explore-link">전체 보기 →</router-link></h2>
      <div class="grid">
        <article
          v-for="place in popularPlaces"
          :key="place.contentid"
          class="card place-card"
        >
          <div
            v-if="place.firstimage"
            class="card-media"
          >
            <img
              :src="place.firstimage"
              :alt="place.title"
            />
          </div>

          <div
            v-else
            class="card-media placeholder"
          ></div>

          <div class="card-body">
            <div class="place-title">
              {{ place.title }}
            </div>

            <div class="place-addr">
              {{ place.addr1 }}
            </div>
          </div>
        </article>
      </div>
      </section>

      <!-- community stats (moved to bottom) -->
      <section class="container section">
        <HomeTrends />
      </section>

    <!-- toast -->
    <div v-if="toast" class="toast">{{ toast }}</div>

  </div>
</template>

<style scoped>
.hero {
  background: var(--color-bg);
  padding: 80px 0;
  color: var(--color-text);
}
.hero-inner {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}
.hero-label {
  display: inline-block;
  background: rgba(37,99,235,0.08);
  color: var(--color-primary);
  font-weight: 600;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  font-size: 14px;
  margin-bottom: 18px;
}
.hero-title {
  font-size: 48px;
  line-height: 1.05;
  margin: 12px 0;
  font-weight: 800;
}
.hero-desc {
  color: var(--color-muted);
  margin: 0;
}

/* Sections */
.section {
  margin-top: 64px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Places grid (Now trending) */
.places-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
@media (max-width: 1024px) {
  .places-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .places-grid { grid-template-columns: 1fr; }
}

/* Place rank card */
.place-rank-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 18px rgba(2,6,23,0.03);
  position: relative;
}
.media-wrap {
  position: relative;
  height: 200px;
  overflow: hidden;
}
.media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 200ms ease;
  display: block;
}
.place-rank-card:hover .media-img {
  transform: scale(1.04);
}

/* Badge */
.badge {
  position: absolute;
  left: 8px;
  top: 8px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  font-weight: 700;
  font-size: 13px;
}
.badge.top {
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;
}

/* Place info row */
.place-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
}
.place-name-and-star {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.place-name {
  font-weight: 700;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
  font-size: 16px;
}
.star-right {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: var(--radius-full);
}
.star-right svg { width: 18px; height: 18px; }
.star-right.on svg path { fill: #FBBF24; stroke: #FBBF24; }

/* place meta caption */
.place-meta {
  color: var(--color-muted);
  font-size: 13px;
  margin-top: 8px;
}

/* Popular posts list */
.popular-posts { margin-top: 8px; }
.pop-list { list-style: none; padding: 0; margin: 0; }
.pop-item {
  display: block;
  padding: 12px 0;
  border-top: 1px solid var(--color-border);
}
.pop-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-decoration: none;
  color: inherit;
}
.pop-title {
  font-weight: 700;
  flex: 0 0 auto;
}
.pop-excerpt {
  color: var(--color-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-size: 14px;
}
.pop-meta {
  color: var(--color-muted);
  margin-left: 12px;
  flex: 0 0 auto;
}
.pop-item:hover { background: var(--color-muted-surface); }

/* Existing grid / place-card styles for '더 둘러보기' */
.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px) { .grid { grid-template-columns: 1fr; } }

.place-card {
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.place-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(2,6,23,0.08);
}
.card-media { height: 180px; overflow: hidden; }
.card-media img { width: 100%; height: 100%; object-fit: cover; }
.card-body { padding: 16px; }
.place-title { font-weight: 700; }
.place-addr { color: var(--color-muted); }

/* links */
.link-more, .explore-link { color: var(--color-primary); text-decoration: none }

/* toast */
.toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%) translateY(12px);
  bottom: 32px;
  background: rgba(15,23,36,0.85);
  color: #fff;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  z-index: 2000;
  animation: toastIn 200ms ease forwards;
}
@keyframes toastIn {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 0.95; }
}

/* section spacing */
.section { margin-top: 64px; }
.section-title { margin-bottom: 20px; }

/* responsive hero title */
@media (max-width: 768px) {
  .hero-title { font-size: 32px; }
  .toast { bottom: 96px; } /* avoid floating fab overlap on small screens */
}
</style>