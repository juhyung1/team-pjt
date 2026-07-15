<template>
  <div class="explore-page">
    <h1 class="title">서울의 장소들</h1>
    <p class="subtitle">공공데이터로 만나는 서울 관광지 783곳</p>

    <div class="controls">
      <input v-model="q" class="search" placeholder="장소명 또는 주소로 검색하세요" />
      <div class="chips" ref="chipsRef">
        <button v-for="g in ['전체', ...guList]" :key="g" :class="['chip', { active: g===selectedGu }]" @click="selectGu(g)">{{ g }}</button>
      </div>
    </div>

      <div class="grid">
      <div v-for="place in visiblePlaces" :key="place.contentid" class="card place-card">
        <div v-if="place.firstimage" class="card-media"><img :src="place.firstimage" :alt="place.title" loading="lazy" /></div>
        <div v-else class="card-media placeholder"></div>
        <div class="card-body">
          <div class="place-title">{{ place.title }}</div>
          <div class="place-addr">{{ place.addr1 }}</div>
        </div>
        <button class="star-right" :class="{ on: isFav(place.contentid) }" @click.stop="toggleFav(place.contentid)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 17.3l-6.16 3.64 1.18-6.88L2 9.9l6.92-1L12 2l3.08 6.9L22 9.9l-4.02 4.16 1.18 6.88L12 17.3z" :fill="isFav(place.contentid)? '#FBBF24':'none'" :stroke="isFav(place.contentid)? '#FBBF24':'#9CA3AF'" stroke-width="1.2"/></svg>
        </button>
      </div>
    </div>

    <div v-if="modalVisible" class="overlay" @click.self="closeModal">
      <div class="modal card">
        <button class="close" @click="closeModal" aria-label="닫기">✕</button>
        <h2 class="detail-title">{{ selectedPlace.title }}</h2>
        <div class="meta">{{ selectedPlace.addr1 }}</div>
        <div class="detail-media" v-if="selectedPlace.firstimage"><img :src="selectedPlace.firstimage" :alt="selectedPlace.title" /></div>
        <div class="detail-body">콘텐츠 ID: {{ selectedPlace.contentid }}</div>
        <div class="detail-actions"></div>
      </div>
    </div>

    <div class="more-wrap">
      <div v-if="!filtered.length" class="empty">조건에 맞는 장소가 없어요</div>
      <button v-else-if="visibleCount < filtered.length" class="btn more" @click="loadMore">더 보기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import seoulData from '../data/seoul_attractions.json'

const all = Array.isArray(seoulData?.items) ? seoulData.items : []
const q = ref('')
const selectedGu = ref('전체')
const visibleCount = ref(24)
const favorites = ref([])
function loadFav(){ try{ const raw=localStorage.getItem('favorites'); favorites.value = raw? JSON.parse(raw): [] }catch{ favorites.value = [] } }
function isFav(id){ return favorites.value.some(x=>String(x)===String(id)) }
function toggleFav(id){ const sid=String(id); if(isFav(sid)){ favorites.value = favorites.value.filter(x=>String(x)!==sid) } else { favorites.value.push(sid) } localStorage.setItem('favorites', JSON.stringify(favorites.value)) }

const toast = ref('')
function showToast(msg){ toast.value = msg; setTimeout(()=>{ toast.value = '' }, 2000) }
function toggleFavWithToast(id){ toggleFav(id); showToast(isFav(id)? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.') }

function extractGu(addr){
  if(!addr) return ''
  return String(addr).replace(/^서울특별시\s*/,'').split(' ')[0]
}

const guList = Array.from(new Set(all.map(i=>extractGu(i.addr1)).filter(Boolean))).sort()

const filtered = computed(()=>{
  const term = q.value.trim().toLowerCase()
  return all.filter(p=>{
    if(selectedGu.value !== '전체' && extractGu(p.addr1) !== selectedGu.value) return false
    if(!term) return true
    const text = (p.title + ' ' + (p.addr1||'')).toLowerCase()
    return text.includes(term)
  })
})

const visiblePlaces = computed(()=> filtered.value.slice(0, visibleCount.value))

function loadMore(){ visibleCount.value +=24 }
function selectGu(g){ selectedGu.value = g; visibleCount.value = 24 }

const modalVisible = ref(false)
const selectedPlace = ref({})
function openPlace(p){ selectedPlace.value = p; modalVisible.value = true }
function closeModal(){ modalVisible.value = false; selectedPlace.value = {} }

onMounted(()=>{})
loadFav()
</script>

<style scoped>
.explore-page { padding:24px; max-width:1200px; margin:0 auto }
.title{ font-size:1.5rem; margin:0 0 6px }
.subtitle{ color:var(--color-muted); margin:0 0 16px }
.controls{ display:flex; flex-direction:column; gap:12px; margin-bottom:18px }
.search{ padding:10px; border:1px solid var(--color-border); border-radius: var(--radius-sm) }
.chips{ display:flex; gap:8px; overflow-x:auto }
.chip{ padding:6px 10px; border-radius: var(--radius-full); border:none; background:transparent; color:var(--color-muted); cursor:pointer }
.chip.active{ background:var(--color-primary); color:#fff }
.grid{ display:grid; gap:20px; grid-template-columns: repeat(4, 1fr) }
.place-card{ transition: transform 180ms ease, box-shadow 180ms ease }
.place-card:hover{ transform: translateY(-4px); box-shadow:0 10px 30px rgba(2,6,23,0.08) }
.card-media{ height:180px; overflow:hidden }
.card-media img{ width:100%; height:100%; object-fit:cover }
.placeholder{ background:var(--color-border) }
.card-body{ padding:12px }
.place-title{ font-weight:600 }
.star{ background:transparent; border:none; padding:4px; margin-left:8px; cursor:pointer }
.star.on svg path{ fill:#FBBF24; stroke:#FBBF24 }
.star-right{ background:transparent; border:none; padding:6px; margin-left:auto; margin-right:8px; align-self:center }
.star-right.on svg path{ fill:#FBBF24; stroke:#FBBF24 }
.toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: 140px; background: #111827; color:#fff; padding:8px 12px; border-radius:var(--radius-sm); opacity:0.95 }
.place-addr{ color:var(--color-muted); font-size:0.95rem }
.more-wrap{ text-align:center; margin-top:18px }
.empty{ color:var(--color-muted); padding:18px 0 }
/* modal */
.overlay{ position: fixed; inset:0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:60 }
.modal{ width: min(880px, 96%); padding:16px; border-radius: var(--radius-md) }
.close{ background:var(--color-muted-surface); border:none; font-size:18px; position:absolute; right:16px; top:12px; cursor:pointer; padding:6px 8px; border-radius: var(--radius-sm); color:var(--color-text) }
.detail-media img{ width:100%; height:360px; object-fit:cover; border-radius: var(--radius-sm); margin-top:12px }
.detail-title{ margin:0 0 6px }
.detail-actions{ margin-top:12px }
@media (max-width:1024px){ .grid{ grid-template-columns: repeat(3,1fr) } }
@media (max-width:768px){ .grid{ grid-template-columns: repeat(2,1fr) } .hero-title{ font-size:32px } }
@media (max-width:480px){ .grid{ grid-template-columns: 1fr } }
</style>
