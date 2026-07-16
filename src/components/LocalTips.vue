<template>
	<section class="local-tips-section">
		<div class="section-head">
			<div class="label-row">
				<span class="pulse" aria-hidden></span>
				<h2 class="strip-title">지역 주민이 알려주는 진짜 TIP</h2>
			</div>
			<p class="strip-desc">광고가 아닌, 서울에 실제 거주하는 주민들의 경험담이에요.</p>
		</div>

		<div class="tips-grid">
			<article v-for="tip in topTips" :key="tip.id" class="tip-card card">
				<p class="tip-content">“{{ tip.content }}”</p>
				<div class="tip-meta">
					<span class="tip-author">{{ tip.author }}</span>
					<span class="tip-years">거주 {{ tip.residentYears }}년차</span>
					<span class="tip-likes" aria-label="도움돼요">👍 {{ tip.likes }}</span>
				</div>
			</article>
		</div>

		<div class="more-row">
			<button type="button" class="btn btn-ghost" @click="shuffle">다른 팁 보기</button>
		</div>
	</section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { LOCAL_TIPS } from '../data/seed'

// 도움돼요(likes) 순으로 정렬해 4개씩 순환 노출
const sorted = [...LOCAL_TIPS].sort((a, b) => (b.likes || 0) - (a.likes || 0))
const page = ref(0)
const PAGE_SIZE = 4

const topTips = computed(() => {
	const start = (page.value * PAGE_SIZE) % sorted.length
	const slice = sorted.slice(start, start + PAGE_SIZE)
	// 배열 끝에 걸치면 앞에서 이어 붙인다
	return slice.length < PAGE_SIZE ? [...slice, ...sorted.slice(0, PAGE_SIZE - slice.length)] : slice
})

function shuffle() {
	page.value += 1
}
</script>

<style scoped>
.local-tips-section { margin-top: 0 } /* 상위 .section이 간격을 담당 */
.section-head { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px }
.label-row { display: flex; align-items: center; gap: 12px }
.pulse { width: 8px; height: 8px; border-radius: var(--radius-full); background: var(--color-primary); animation: pulse 1600ms infinite }
.strip-title { font-size: 1.25rem; margin: 0 }
.strip-desc { color: var(--color-muted); margin: 0 }

.tips-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16px;
}

.tip-card {
	display: flex;
	flex-direction: column;
	gap: 12px;
	justify-content: space-between;
	padding: 20px;
}

.tip-content {
	line-height: 1.6;
	margin: 0;
}

.tip-meta {
	align-items: center;
	color: var(--color-muted);
	display: flex;
	flex-wrap: wrap;
	font-size: 0.875rem;
	gap: 10px;
}

.tip-author { color: var(--color-text); font-weight: 700 }
.tip-likes { margin-left: auto }

.more-row { margin-top: 16px; text-align: center }
.btn-ghost {
	background: transparent;
	border: 1px solid var(--color-border);
	color: var(--color-text);
}
.btn-ghost:hover { background: var(--color-muted-surface) }

@keyframes pulse { 0%{ transform:scale(1); opacity:1 } 70%{ transform:scale(1.6); opacity:0.4 } 100%{ transform:scale(1); opacity:1 } }

@media (max-width: 768px) {
	.tips-grid { grid-template-columns: 1fr }
}
</style>
