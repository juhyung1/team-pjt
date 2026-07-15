<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import seoulData from '../data/seoul_attractions.json'
import Chart from 'chart.js/auto'

const posts = ref<any[]>([])

try {
  const raw = localStorage.getItem('posts')
  const parsed = raw ? JSON.parse(raw) : []
  posts.value = Array.isArray(parsed) ? parsed : []
} catch {
  posts.value = []
}

const topPlaces = ref<{ name: string; count: number }[]>([])
const regionCounts = ref<Record<string, number>>({})
const keywords = ref<{ word: string; count: number }[]>([])

const barChartRef = ref<HTMLCanvasElement | null>(null)
const donutChartRef = ref<HTMLCanvasElement | null>(null)
const keywordChartRef = ref<HTMLCanvasElement | null>(null)
let barChart: any = null
let donutChart: any = null
let keywordChart: any = null

function computeTopPlaces() {
  // Only count mentions of places that exist in seoul_attractions.json (by title)
  const items = Array.isArray((seoulData as any)?.items) ? (seoulData as any).items : []
  const titles = items
    .map((it: any) => String(it.title || '').trim())
    .filter(Boolean)
  const lowerTitles = titles.map((t: string) => t.toLowerCase())

  const counts = new Map<string, number>()

  posts.value.forEach((p) => {
    const text = `${p.title || ''} ${p.content || ''} ${p.place || ''} ${(Array.isArray(p.places) ? p.places.join(' ') : '')}`.toLowerCase()

    // check each known attraction title; if present in post text, increment that title
    lowerTitles.forEach((lt, idx) => {
      if (!lt) return
      if (text.includes(lt)) {
        const title = titles[idx]
        counts.set(title, (counts.get(title) || 0) + 1)
      }
    })
  })

  const arr = Array.from(counts.entries()).map(([name, count]) => ({ name, count }))
  arr.sort((a, b) => b.count - a.count)

  // Ensure we always show 8 items: if fewer matches, pad with known attraction titles with count 0
  const result = arr.slice(0, 8)
  if (result.length < 8) {
    // iterate titles (original order) and add missing ones
    for (const t of titles) {
      if (result.find((r) => r.name === t)) continue
      result.push({ name: t, count: 0 })
      if (result.length >= 8) break
    }
  }

  topPlaces.value = result
  // debug: show computed topPlaces
  // eslint-disable-next-line no-console
  console.log('computeTopPlaces -> topPlaces', topPlaces.value)
}

function extractDistrictFromText(text: string) {
  if (!text) return ''
  // match common district forms like '강서구', '종로구' etc.
  const m = text.match(/([가-힣]{2,}구)/)
  if (m) return m[1]
  // sometimes address contains like '서울특별시 강서구' or '강서구 xx동'
  const m2 = text.match(/([가-힣]{2,}구)/)
  return m2 ? m2[1] : ''
}

function computeRegionCounts() {
  const counts: Record<string, number> = {}

  // helper: try find district by looking up seoulData items for a place name
  function findDistrictFromPlace(placeName: string) {
    if (!placeName) return ''
    const items = Array.isArray((seoulData as any)?.items) ? (seoulData as any).items : []
    const lower = placeName.toLowerCase()
    for (const it of items) {
      const title = String(it.title || '').toLowerCase()
      if (!title) continue
      if (title.includes(lower) || lower.includes(title)) {
        const addr = String(it.addr1 || '')
        const d = extractDistrictFromText(addr)
        if (d) return d
      }
    }
    return ''
  }

  posts.value.forEach((p) => {
    let district = ''

    // prefer explicit district field
    if (p.region && String(p.region).includes('구')) district = p.region

    // try address
    if (!district && p.address) district = extractDistrictFromText(p.address)

    // try place or first places entry
    if (!district && p.place) district = extractDistrictFromText(p.place)
    if (!district && Array.isArray(p.places) && p.places[0]) district = extractDistrictFromText(p.places[0])

    // if still not found, try to lookup from seoul data by place name
    if (!district && p.place) district = findDistrictFromPlace(p.place)
    if (!district && Array.isArray(p.places) && p.places[0]) district = findDistrictFromPlace(p.places[0])

    if (!district) return
    counts[district] = (counts[district] || 0) + 1
  })

  // Keep only districts (구) and sort by count
  const filtered: Record<string, number> = {}
  Object.entries(counts)
    .filter(([k]) => k && String(k).includes('구'))
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => { filtered[k] = v })

  regionCounts.value = filtered
  // debug: show computed region counts
  // eslint-disable-next-line no-console
  console.log('computeRegionCounts -> regionCounts', regionCounts.value)
}

const stopwords = ['의','가','이','은','는','에','다','도','을','를','으로','하고','에서','하다','있다','좋아요','좋다','많다']
function computeKeywords() {
  const texts = posts.value.map(p => `${p.title || ''} ${p.content || ''}`).join(' ')
  const cleaned = texts.replace(/[^a-zA-Z가-힣\s]/g, ' ').toLowerCase()
  const tokens = cleaned.split(/\s+/).filter(Boolean)
  const counts = new Map<string, number>()
  for (const t of tokens) {
    if (t.length < 2) continue
    if (stopwords.includes(t)) continue
    counts.set(t, (counts.get(t) || 0) + 1)
  }
  const arr = Array.from(counts.entries()).map(([word, count]) => ({ word, count }))
  arr.sort((a, b) => b.count - a.count)
  keywords.value = arr.slice(0, 5)
}

function renderBarChart() {
  if (barChart) { barChart.destroy(); barChart = null }
  if (!barChartRef.value) return
  const labels = topPlaces.value.map((p) => p.name)
  const data = topPlaces.value.map((p) => p.count)

  barChart = new Chart(barChartRef.value, {
    type: 'bar',
    data: { labels, datasets: [{ label: '언급 횟수', data, backgroundColor: labels.map((_, i) => i === 0 ? '#2563eb' : '#e6edf3'), borderRadius: 8, barThickness: 18 }] },
    options: {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed.x}` } }
      },
      scales: {
        x: { 
          beginAtZero: true, 
          grid: { display: false }, 
          ticks: { display: false, precision: 0, stepSize: 1 }
        },
        y: { grid: { display: false }, ticks: { autoSkip: false } },
      },
    }
  })
}

function renderDonutChart() {
  if (donutChart) { donutChart.destroy(); donutChart = null }
  if (!donutChartRef.value) return
  // use sorted top entries (limit to 5 for readability)
  const entries = Object.entries(regionCounts.value).slice(0, 5)
  const labels = entries.map(e => e[0])
  const data = entries.map(e => e[1])
  const colors = ['#2563eb','#60a5fa','#93c5fd','#bfdbfe','#e2e8f0','#f1f5f9']
  donutChart = new Chart(donutChartRef.value, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), hoverOffset: 8 }] },
    options: {
      maintainAspectRatio: false,
      // moderate internal spacing between doughnut and its legend
      layout: { padding: { bottom: 20 } },
      plugins: {
        legend: { 
          display: true, 
          position: 'bottom', 
          labels: { color: '#6b7280', padding: 10, boxWidth: 12 }
        },
        tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed}` } }
      }
    }
  })
}

function renderKeywordChart() {
  if (keywordChart) { keywordChart.destroy(); keywordChart = null }
  if (!keywordChartRef.value) return
  const labels = keywords.value.map(k => k.word)
  const data = keywords.value.map(k => k.count)

  const ctx = (keywordChartRef.value.getContext('2d') as CanvasRenderingContext2D)
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, '#60a5fa')
  gradient.addColorStop(1, '#2563eb')

  keywordChart = new Chart(keywordChartRef.value, {
    type: 'bar',
    data: { labels, datasets: [{ label: '빈도', data, backgroundColor: gradient, borderRadius: 6, barThickness: 40 }] },
    options: {
      indexAxis: 'x',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed.y ?? ctx.parsed}` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#374151' } },
        y: { beginAtZero: true, ticks: { display: false, precision: 0, stepSize: 1, color: '#374151' }, grid: { color: 'rgba(15,23,42,0.05)' } }
      },
    }
  })
}

onMounted(() => {
  computeTopPlaces()
  computeRegionCounts()
  computeKeywords()
  renderBarChart()
  renderDonutChart()
  renderKeywordChart()
})

watch([topPlaces, posts], () => renderBarChart())
watch(regionCounts, () => renderDonutChart())
watch(keywords, () => renderKeywordChart())

watch(posts, () => {
  computeTopPlaces()
  computeRegionCounts()
  computeKeywords()
}, { deep: true })
</script>

<template>
  <div class="dashboard-charts-wrap">
    <div class="header-row">
      <h3>가장 많이 언급된 장소 TOP 8</h3>
      <p class="muted">게시글 수와 조회수를 합산한 언급 지수예요.</p>
    </div>

    <div class="grid-two">
      <section class="card large-card">
        <div class="chart-area"><canvas ref="barChartRef"></canvas></div>
      </section>

      <aside class="card small-card">
        <h4>게시글 많은 지역</h4>
        <p class="muted">자치구별 게시글 비중</p>
        <div class="donut-wrap"><canvas ref="donutChartRef"></canvas></div>
      </aside>
    </div>

    <section class="card keywords-card" style="margin-top:16px;">
      <h4>인기 키워드 TOP10</h4>
      <p class="muted">게시글 제목/본문에서 많이 언급된 키워드입니다.</p>
      <div style="height:260px; margin-top:12px;"><canvas ref="keywordChartRef"></canvas></div>
    </section>
  </div>
</template>

<style scoped>
.header-row { margin-bottom:12px }
.muted { color:#6b7280; font-size:13px }
.grid-two { display:grid; grid-template-columns:2fr 1fr; gap:18px }
.card { background:#fff; border:1px solid #e6edf3; border-radius:12px; padding:16px }
.chart-area { height:420px }
.donut-wrap { height:220px; display:flex; align-items:center; justify-content:center }
.card.small-card { display:flex; flex-direction:column; align-items:stretch; padding-bottom: 16px }
.donut-wrap { margin-bottom: 8px; height: 220px }
.donut-wrap canvas { width: 220px; height: 220px }
.keyword-cloud .kw { color:#111827; text-decoration:none }
@media (max-width:900px) { .grid-two { grid-template-columns:1fr } }
</style>
