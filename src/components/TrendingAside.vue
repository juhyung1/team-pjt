<template>
  <aside class="trending-aside">
    <div class="col-card left-card card">
      <h4 class="section-title">인기 게시글 TOP 5</h4>
      <ul v-if="popular.length" class="list">
        <li v-for="(p, idx) in popular" :key="p.id" class="item">
          <router-link :to="`/board/${p.id}`" class="link">
            <span class="rank" :class="{ top: idx===0 }">{{ idx+1 }}</span>
            <span class="title">{{ p.title }}</span>
          </router-link>
        </li>
      </ul>
      <div v-else class="empty">아직 게시글이 없어요.</div>
    </div>

    <div class="col-card right-card card">
      <h4 class="section-title">지금 뜨는 장소</h4>
      <ul v-if="hotPlaces.length" class="places">
        <li v-for="place in hotPlaces" :key="place.title" class="place-item">
          <img v-if="place.firstimage" :src="place.firstimage" alt="" class="thumb" />
          <div class="place-body">
            <div class="place-name">{{ place.title }}</div>
            <div class="place-count">언급 {{ place.count }}회</div>
          </div>
        </li>
      </ul>
      <div v-else class="places">
        <h5 class="section-sub">추천 장소</h5>
        <ul class="places">
          <li v-for="place in recommended" :key="place.title" class="place-item">
            <img v-if="place.firstimage" :src="place.firstimage" alt="" class="thumb" />
            <div class="place-body">
              <div class="place-name">{{ place.title }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import seoulData from '../data/seoul_attractions.json'

const router = useRouter()

const posts = ref([])
function loadPosts(){
  try{ const raw = localStorage.getItem('posts'); const p = raw? JSON.parse(raw): []; posts.value = Array.isArray(p)? p: [] }catch{ posts.value = [] }
}

onMounted(()=>{ loadPosts(); window.addEventListener('storage', e=> { if(e.key==='posts') loadPosts() }) })

const popular = computed(()=>{
  const list = [...posts.value]
  list.forEach(p=>{ p.views = Number(p.views||0); p.likes = Number(p.likes||0) })
  list.sort((a,b)=> (b.views + (b.likes||0)*3) - (a.views + (a.likes||0)*3))
  return list.slice(0,5)
})

// prepare seoul items
const items = Array.isArray(seoulData?.items) ? seoulData.items : []

function tokenize(str){
  if(!str) return []
  return String(str).split(/\s+/).map(s=>s.replace(/[^\p{L}\p{N}]/gu,'')).filter(Boolean)
}

const hotPlaces = computed(()=>{
  const counts = {}
  const tokens = []
  posts.value.forEach(post=>{
    const text = `${post.title||''} ${post.content||''}`.toLowerCase()
    items.forEach(it=>{
      const name = String(it.title||'')
      if(name.length <= 2) return
      const lower = name.toLowerCase()
      if(text.includes(lower)) counts[lower] = (counts[lower]||0) + 1
    })
  })
  const arr = Object.keys(counts).map(k=>({ title: k, count: counts[k], firstimage: (items.find(i=>String(i.title||'').toLowerCase()===k)||{}).firstimage }))
  arr.sort((a,b)=>b.count - a.count)
  return arr.slice(0,3)
})

const recommended = computed(()=>{
  const withImg = items.filter(i=>i.firstimage).slice(0,3)
  return withImg
})
</script>

<style scoped>
.trending-aside { width:100%; display:grid; grid-template-columns: 1fr 1fr; gap: 12px; box-sizing:border-box }
.card { background: var(--color-surface); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:12px }
.col-card { padding:16px }
.left-card { margin-bottom: var(--space-2) }
.right-card { margin-bottom: var(--space-2) }
.section { margin-bottom:8px }
.section-title { font-size:14px; font-weight:700; margin-bottom:12px }
.list, .places { list-style:none; padding:0; margin:0 }
.item { padding:8px 0; display:flex; align-items:center }
.link { display:flex; align-items:center; gap:8px; color:inherit; text-decoration:none }
.rank { width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:var(--color-muted-surface); color:var(--color-muted); font-weight:700 }
.rank.top { background:var(--color-primary); color:#fff }
.title { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.place-item { display:flex; gap:8px; align-items:center; padding:6px 0 }
.thumb { width:40px; height:40px; border-radius:50%; object-fit:cover }
.place-name { font-weight:600 }
.place-count { color:var(--color-muted); font-size:0.9rem }
.section-sub { font-size:13px; color:var(--color-muted); margin:6px 0 }

.trending-grid { display:none }
@media (max-width: 1024px) {
  .trending-aside { grid-template-columns: 1fr }
}
</style>
