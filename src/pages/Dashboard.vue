<script setup lang="ts">
import { ref, computed } from 'vue'
import DashboardCharts from '../components/DashboardCharts.vue'

const posts = ref<any[]>([])
try {
  const raw = localStorage.getItem('posts')
  const parsed = raw ? JSON.parse(raw) : []
  posts.value = Array.isArray(parsed) ? parsed : []
} catch {
  posts.value = []
}

// Removed dev seed of temporary posts to avoid persisting sample data in localStorage

const totalPosts = computed(() => posts.value.length)
const cumulativeViews = computed(() => posts.value.reduce((s, p) => s + (Number(p.views) || 0), 0))
const residentRatio = computed(() => {
  if (!posts.value.length) return 0
  const residents = posts.value.filter((p) => p.isResident).length
  return Math.round((residents / posts.value.length) * 100)
})
const registeredPlacesCount = computed(() => {
  const set = new Set<string>()
  posts.value.forEach((p) => {
    if (Array.isArray(p.places)) p.places.forEach((x: string) => set.add(x))
    if (p.place) set.add(p.place)
  })
  return set.size
})
</script>

<template>
  <div>
    <header class="page-head">
      <h1>지역 통계 대시보드</h1>
      <p class="subtitle">서울 커뮤니티 게시글을 기준으로 활동 현황을 보여줍니다.</p>
    </header>

    <section class="stats-row">
      <div class="stat-card">
        <div class="label">전체 게시글</div>
        <div class="value">{{ totalPosts }}</div>
      </div>

      <div class="stat-card">
        <div class="label">누적 조회수</div>
        <div class="value">{{ cumulativeViews }}</div>
      </div>

      <div class="stat-card">
        <div class="label">주민 글 비율</div>
        <div class="value">{{ residentRatio }}%</div>
      </div>

      <div class="stat-card">
        <div class="label">등록 장소</div>
        <div class="value">{{ registeredPlacesCount }}</div>
      </div>
    </section>

    <DashboardCharts v-if="totalPosts > 0" />
    <div v-else class="no-data" style="margin-top:16px">게시글이 없어 통계가 없습니다.</div>
  </div>
</template>

<style scoped>
.page-head { margin: 24px 0 16px }
h1 { margin: 0 0 6px }
.eyebrow { color: var(--color-primary); font-size: 0.875rem; font-weight: 700; margin: 0 0 6px }
.subtitle { color: var(--color-muted); margin: 0 }
.stats-row { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap }
.stat-card { background:var(--color-surface); border:1px solid var(--color-border); padding:12px 16px; border-radius:var(--radius-sm); min-width:160px }
.label { color:var(--color-muted); font-size:13px }
.value { font-weight:700; margin-top:6px; font-size:18px }
</style>
