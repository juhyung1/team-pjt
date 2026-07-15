<template>
  <div class="favorites-page">
    <h1>즐겨찾기한 장소</h1>
    <div v-if="!favPlaces.length" class="empty">아직 즐겨찾기한 장소가 없습니다.</div>
    <div v-else class="places-grid">
      <router-link v-for="p in favPlaces" :key="p.contentid" :to="`/explore/${p.contentid}`" class="fav-card">
        <div class="media-wrap">
          <img v-if="p.firstimage" :src="p.firstimage" alt="" />
          <div v-else class="placeholder"></div>
        </div>
        <div class="info">{{ p.title }}</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import seoulData from '../data/seoul_attractions.json'

const favIds = ref([])
const favPlaces = ref([])

function loadFav(){
  try{ const raw = localStorage.getItem('favorites'); favIds.value = raw? JSON.parse(raw): [] }catch{ favIds.value = [] }
  const items = Array.isArray(seoulData?.items)? seoulData.items: []
  favPlaces.value = favIds.value.map(id=> items.find(i=>String(i.contentid)===String(id))).filter(Boolean)
}

onMounted(()=>{ loadFav() })
</script>

<style scoped>
.favorites-page{ padding:24px }
.places-grid{ display:grid; grid-template-columns: repeat(4,1fr); gap:12px }
.fav-card{ display:block; border:1px solid var(--color-border); border-radius:var(--radius-md); overflow:hidden }
.media-wrap img{ width:100%; height:160px; object-fit:cover }
.info{ padding:8px }
@media (max-width:1024px){ .places-grid{ grid-template-columns: repeat(2,1fr) } }
@media (max-width:640px){ .places-grid{ grid-template-columns: 1fr } }
</style>
