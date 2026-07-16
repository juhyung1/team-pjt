<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import seoulData from '../data/seoul_attractions.json'

const route = useRoute()
const router = useRouter()

const all = Array.isArray(seoulData?.items) ? seoulData.items : []
const q = ref('')
const selectedGu = ref('전체')
const visibleCount = ref(24)
const favorites = ref([])
const favOnly = ref(route.query.fav === '1')
const toast = ref('')
let toastTimer = null

function loadFav() {
  try {
    const raw = localStorage.getItem('favorites')
    const parsed = raw ? JSON.parse(raw) : []
    favorites.value = Array.isArray(parsed) ? parsed : []
  } catch {
    favorites.value = []
  }
}

function saveFav() {
  localStorage.setItem('favorites', JSON.stringify(favorites.value))
}

function isFav(id) {
  return favorites.value.some((x) => String(x) === String(id))
}

function showToast(msg) {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
    toastTimer = null
  }, 1800)
}

function toggleFav(id) {
  const sid = String(id)
  if (isFav(sid)) {
    favorites.value = favorites.value.filter((x) => String(x) !== sid)
  } else {
    favorites.value.push(sid)
  }
  saveFav()
  showToast(isFav(sid) ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.')
}

function extractGu(addr) {
  if (!addr) return ''
  return String(addr).replace(/^서울특별시\s*/, '').split(' ')[0]
}

const guList = Array.from(new Set(all.map((i) => extractGu(i.addr1)).filter(Boolean))).sort()

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return all.filter((p) => {
    if (favOnly.value && !isFav(p.contentid)) return false
    if (selectedGu.value !== '전체' && extractGu(p.addr1) !== selectedGu.value) return false
    if (!term) return true
    const text = `${p.title || ''} ${p.addr1 || ''}`.toLowerCase()
    return text.includes(term)
  })
})

function toggleFavOnly() {
  favOnly.value = !favOnly.value
  visibleCount.value = 24
  // URL과 동기화해 즐겨찾기 보기 상태를 공유·북마크할 수 있게 한다
  router.replace({ query: { ...route.query, fav: favOnly.value ? '1' : undefined } })
}

watch(() => route.query.fav, (v) => { favOnly.value = v === '1' })

const visiblePlaces = computed(() => filtered.value.slice(0, visibleCount.value))

function loadMore() {
  visibleCount.value += 24
}

function selectGu(g) {
  selectedGu.value = g
  visibleCount.value = 24
}

loadFav()
</script>

<template>
  <div class="explore-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">공공데이터 기반 서울 관광지</p>
        <h1 class="title">서울 장소 탐색</h1>
        <p class="subtitle">장소를 고르면 상세 정보와 관련 커뮤니티 글로 이어집니다.</p>
      </div>
      <div class="result-count">총 {{ filtered.length }}곳</div>
    </header>

    <section class="controls" aria-label="장소 검색 및 자치구 필터">
      <input v-model="q" class="search" placeholder="장소명 또는 주소로 검색하세요" />
      <div class="chips">
        <button
          type="button"
          :class="['chip', 'chip-fav', { active: favOnly }]"
          :aria-pressed="favOnly"
          @click="toggleFavOnly"
        >
          ★ 즐겨찾기만
        </button>
        <span class="chip-divider" aria-hidden="true"></span>
        <button
          v-for="g in ['전체', ...guList]"
          :key="g"
          type="button"
          :class="['chip', { active: g === selectedGu }]"
          @click="selectGu(g)"
        >
          {{ g }}
        </button>
      </div>
    </section>

    <div v-if="visiblePlaces.length" class="grid">
      <article v-for="place in visiblePlaces" :key="place.contentid" class="card place-card">
        <router-link :to="`/explore/${place.contentid}`" class="place-link" :aria-label="`${place.title} 상세 보기`">
          <div v-if="place.firstimage" class="card-media">
            <img :src="place.firstimage" :alt="place.title" loading="lazy" />
          </div>
          <div v-else class="card-media placeholder">{{ place.title }}</div>

          <div class="card-body">
            <div class="place-title">{{ place.title }}</div>
            <div class="place-addr">{{ place.addr1 }}</div>
          </div>
        </router-link>

        <button
          class="star-right"
          :class="{ on: isFav(place.contentid) }"
          type="button"
          @click.stop="toggleFav(place.contentid)"
          :aria-label="isFav(place.contentid) ? '즐겨찾기 해제' : '즐겨찾기 추가'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 17.3l-6.16 3.64 1.18-6.88L2 9.9l6.92-1L12 2l3.08 6.9L22 9.9l-4.02 4.16 1.18 6.88L12 17.3z"
              :fill="isFav(place.contentid) ? '#FBBF24' : 'none'"
              :stroke="isFav(place.contentid) ? '#FBBF24' : '#9CA3AF'"
              stroke-width="1.2"
            />
          </svg>
        </button>
      </article>
    </div>

    <div v-else class="empty card">
      <template v-if="favOnly && !favorites.length">
        아직 즐겨찾기한 장소가 없어요. 카드의 ★ 버튼으로 마음에 드는 장소를 저장해보세요.
      </template>
      <template v-else>
        조건에 맞는 장소가 없어요. 검색어를 줄이거나 다른 자치구를 선택해보세요.
      </template>
    </div>

    <div class="more-wrap">
      <button v-if="visibleCount < filtered.length" class="btn more" type="button" @click="loadMore">더 보기</button>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.explore-page {
  margin: 0 auto;
  max-width: 1200px;
  padding: 24px 0;
}

.page-head {
  align-items: flex-end;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 20px;
}

.eyebrow {
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.title {
  font-size: 1.75rem;
  margin: 0 0 6px;
}

.subtitle {
  color: var(--color-muted);
  margin: 0;
}

.result-count {
  background: var(--color-muted-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-muted);
  flex: 0 0 auto;
  font-weight: 700;
  padding: 8px 12px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.search {
  min-height: 44px;
  padding: 10px 12px;
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.chip {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-muted);
  cursor: pointer;
  flex: 0 0 auto;
  min-height: 36px;
  padding: 6px 12px;
}

.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.chip-fav.active {
  background: #b45309;
  border-color: #b45309;
}

.chip-divider {
  align-self: center;
  background: var(--color-border);
  flex: 0 0 auto;
  height: 20px;
  width: 1px;
}

.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, 1fr);
}

.place-card {
  overflow: hidden;
  padding: 0;
  position: relative;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.place-card:hover {
  box-shadow: 0 10px 30px rgba(2,6,23,0.08);
  transform: translateY(-4px);
}

.place-link {
  color: inherit;
  display: block;
  height: 100%;
  text-decoration: none;
}

.card-media {
  align-items: center;
  background: var(--color-muted-surface);
  color: var(--color-muted);
  display: flex;
  font-weight: 700;
  height: 180px;
  justify-content: center;
  overflow: hidden;
  text-align: center;
}

.card-media img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.card-body {
  padding: 14px 44px 14px 14px;
}

.place-title {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-addr {
  color: var(--color-muted);
  font-size: 0.9375rem;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.star-right {
  align-items: center;
  background: rgba(255,255,255,0.94);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  position: absolute;
  right: 10px;
  top: 10px;
  width: 36px;
}

.star-right.on {
  background: #fff7db;
}

.more-wrap {
  margin-top: 20px;
  text-align: center;
}

.empty {
  color: var(--color-muted);
  padding: 28px;
  text-align: center;
}

.toast {
  background: rgba(15,23,36,0.9);
  border-radius: var(--radius-full);
  bottom: 96px;
  color: #fff;
  left: 50%;
  padding: 10px 16px;
  position: fixed;
  transform: translateX(-50%);
  z-index: 2000;
}

@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .page-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
