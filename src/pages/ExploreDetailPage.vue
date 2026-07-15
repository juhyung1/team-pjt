<template>
  <div class="explore-detail">
    <div v-if="!place" class="not-found card">
      <p>존재하지 않는 장소예요.</p>
      <router-link to="/explore" class="btn btn-muted">목록으로</router-link>
    </div>

    <div v-else class="detail-wrap">
      <div class="hero-media">
        <img v-if="place.firstimage" :src="place.firstimage" :alt="place.title" />
        <div v-else class="hero-placeholder">{{ place.title }}</div>

        <button
          class="star-right"
          :class="{ on: isFavorited }"
          type="button"
          :aria-pressed="isFavorited"
          :aria-label="isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'"
          @click="toggleFavoriteWithToast"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 17.3l-6.16 3.64 1.18-6.88L2 9.9l6.92-1L12 2l3.08 6.9L22 9.9l-4.02 4.16 1.18 6.88L12 17.3z"
              :fill="isFavorited ? '#FBBF24' : 'none'"
              :stroke="isFavorited ? '#FBBF24' : '#9CA3AF'"
              stroke-width="1.2"
            />
          </svg>
        </button>
      </div>

      <div class="detail-body">
        <div class="info">
          <h1 class="place-title">{{ place.title }}</h1>
          <div class="caption">{{ place.addr1 }} · {{ place.zipcode || '' }}</div>
          <div class="badge">공공데이터 기반 정보</div>
        </div>

        <section class="section related">
          <h3>이 장소가 언급된 게시글</h3>
          <div class="sort-row">
            <label>정렬:</label>
            <select v-model="sortBy">
              <option value="recent">최신</option>
              <option value="popular">인기</option>
            </select>
          </div>
          <div v-if="sortedRelated.length">
            <ul class="related-list">
              <li v-for="p in sortedRelated" :key="p.id" class="related-item">
                <router-link :to="`/board/${p.id}`" class="related-link">
                  <div>
                    <div class="r-title">{{ p.title }}</div>
                    <div class="r-excerpt">{{ (p.content||'').slice(0,50) }}{{ (p.content||'').length>50? '…':'' }}</div>
                  </div>
                  <div class="r-meta">조회 {{ p.views }} · 좋아요 {{ p.likes||0 }}</div>
                </router-link>
              </li>
            </ul>
          </div>
          <div v-else class="no-related">
            <p>아직 이 장소의 이야기가 없어요. 첫 후기를 남겨보세요!</p>
          </div>
        </section>

        <div class="actions">
          <router-link :to="writeLink" class="btn">이 장소 후기 쓰기</router-link>
          <router-link to="/explore" class="btn btn-muted">목록으로</router-link>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import seoulData from '../data/seoul_attractions.json'

const route = useRoute()
const place = ref(null)
const posts = ref([])

function loadPosts(){
  try{ const raw = localStorage.getItem('posts'); const parsed = raw? JSON.parse(raw): []; posts.value = Array.isArray(parsed)? parsed: [] }catch{ posts.value = [] }
}

onMounted(()=>{
  loadPosts()
  const id = route.params.id
  const items = Array.isArray(seoulData?.items)? seoulData.items: []
  // find by contentid (keep original title/contentid)
  const found = items.find(i=> String(i.contentid) === String(id)) || null
  place.value = found
  // load favorites
  try{ const raw = localStorage.getItem('favorites'); favorites.value = raw? JSON.parse(raw): [] }catch{ favorites.value = [] }
})

const relatedPosts = computed(()=>{
  if(!place.value) return []
  const name = String(place.value.title || '')
  const contentid = String(place.value.contentid || '')
  if(!name) return []
  const lower = name.toLowerCase()
  return posts.value.filter((p) => {
    const text = `${p.title || ''} ${p.content || ''} ${p.place || ''}`.toLowerCase()
    return String(p.placeId || '') === contentid || String(p.place || '') === name || text.includes(lower)
  })
})

const sortBy = ref('recent')
const sortedRelated = computed(()=>{
  const arr = relatedPosts.value.slice()
  if(sortBy.value === 'recent') return arr.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
  return arr.sort((a,b)=> (b.views + (b.likes||0)*3) - (a.views + (a.likes||0)*3))
})

const favorites = ref([])
const isFavorited = computed(()=> place.value && favorites.value.some(id=> String(id)===String(place.value.contentid)))
function toggleFavorite(){ if(!place.value) return; const id = place.value.contentid; if(isFavorited.value){ favorites.value = favorites.value.filter(x=>String(x)!==String(id)) } else { favorites.value.push(id) } localStorage.setItem('favorites', JSON.stringify(favorites.value)) }

const toast = ref('')
let toastTimer = null
function toggleFavoriteWithToast(){
  toggleFavorite()
  toast.value = isFavorited.value ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.'
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(()=>{ toast.value = ''; toastTimer = null }, 1800)
}

const writeLink = computed(() => {
  if (!place.value) return '/write'
  const params = new URLSearchParams({
    placeId: String(place.value.contentid || ''),
    place: String(place.value.title || ''),
  })
  return `/write?${params.toString()}`
})
</script>

<style scoped>
.explore-detail { max-width:800px; margin:0 auto; padding:24px }
.hero-media { position:relative; height:320px; overflow:hidden; border-radius:var(--radius-lg); background:var(--color-muted-surface); display:flex; align-items:center; justify-content:center }

/* 목록 카드와 동일한 우측 상단 별 버튼 */
.star-right {
  align-items: center;
  background: rgba(255,255,255,0.94);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  display: inline-flex;
  height: 40px;
  justify-content: center;
  position: absolute;
  right: 12px;
  top: 12px;
  width: 40px;
}
.star-right.on { background: #fff7db }

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
.hero-media img{ width:100%; height:100%; object-fit:cover }
.hero-placeholder{ color:var(--color-muted); font-weight:700 }
.detail-body{ margin-top:16px }
.place-title{ font-size:28px; font-weight:800; margin:0 }
.caption{ color:var(--color-muted); margin-top:8px }
.badge{ display:inline-block; background:var(--color-muted-surface); color:var(--color-muted); padding:6px 10px; border-radius:var(--radius-full); font-size:12px; margin-top:8px }
.related{ margin-top:18px }
.related-list{ list-style:none; padding:0; margin:0 }
.related-item{ border-top:1px solid var(--color-border); padding:12px 0 }
.related-link{ display:flex; gap:12px; align-items:center; width:100%; text-decoration:none; color:inherit }
.r-title{ font-weight:700 }
.r-excerpt{ color:var(--color-muted); margin-left:12px; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.r-meta{ color:var(--color-muted) }
.no-related{ padding:12px 0 }
.actions{ display:flex; flex-wrap:wrap; gap:12px; margin-top:16px }
.btn{ border-radius:var(--radius-sm); padding:8px 12px }
.btn-muted{ background:transparent; border:1px solid var(--color-border); color:var(--color-text); border-radius:var(--radius-sm); padding:8px 12px }

@media (max-width:640px){ .hero-media{ height:200px } }
</style>
