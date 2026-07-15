<template>
	<section class="home-trends-section">
		<div class="section-head">
			<div class="label-row">
				<span class="pulse" aria-hidden></span>
				<div class="strip-title">지금 서울은</div>
			</div>
			<div class="strip-stats">게시글 {{ totalPosts }} · 누적 조회 {{ totalViews }} · 등록 장소 {{ totalPlaces }}곳</div>
		</div>

		<div class="mini-chart card">
			<div class="chart-header">일별 새 게시글 수</div>
			<canvas ref="lineRef" height="160"></canvas>
		</div>
	</section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import seoulData from '../data/seoul_attractions.json'

const postsRaw = (()=>{ try{ const r=localStorage.getItem('posts'); return r? JSON.parse(r): [] }catch{ return [] } })()
const posts = ref(Array.isArray(postsRaw)? postsRaw: [])
const items = Array.isArray(seoulData?.items)? seoulData.items: []

const totalPosts = computed(()=> posts.value.length)
const totalViews = computed(()=> posts.value.reduce((s,p)=>s+Number(p.views||0),0))
const totalPlaces = computed(()=> items.length || 783)

const last7 = (()=>{
	const res=[]
	for(let i=6;i>=0;i--){ const day=new Date(); day.setDate(day.getDate()-i); const start=new Date(day.getFullYear(),day.getMonth(),day.getDate()).toISOString(); res.push(start) }
	return res
})()
const counts7 = last7.map(dayStart=> posts.value.filter(p=> new Date(p.createdAt) >= new Date(dayStart)).length)

const lineRef = ref(null)
let lineChart = null

onMounted(()=>{
	const ctx = lineRef.value.getContext('2d')
	lineChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: last7.map(d=>{ const dt=new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}` }),
			datasets: [{ data: counts7, borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:'#2563eb', pointBorderColor:'#fff' }]
		},
		options: { responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ ticks:{ stepSize:1 } } } }
	})
})

onBeforeUnmount(()=>{ if(lineChart) lineChart.destroy() })
</script>

<style scoped>
.home-trends-section { margin-top:64px }
.section-head { display:flex; flex-direction:column; gap:8px }
.label-row{ display:flex; align-items:center; gap:12px }
.pulse{ width:8px; height:8px; border-radius:var(--radius-full); background:var(--color-primary); animation:pulse 1600ms infinite }
.strip-title{ font-weight:700 }
.strip-stats{ color:var(--color-muted) }
.mini-chart{ margin-top:12px; border-radius:var(--radius-md); padding:12px; border:1px solid var(--color-border); background:var(--color-surface) }
.chart-header{ font-weight:700; margin-bottom:8px }
@keyframes pulse { 0%{ transform:scale(1); opacity:1 } 70%{ transform:scale(1.6); opacity:0.4 } 100%{ transform:scale(1); opacity:1 } }
@media (max-width:768px){ .mini-chart{ padding:8px } }
</style>

*** End Patch
