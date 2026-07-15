import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import seedPosts from './data/seedPosts'

// seed localStorage posts if empty
try{
	const raw = localStorage.getItem('posts')
	const parsed = raw ? JSON.parse(raw) : []
	if(!Array.isArray(parsed) || parsed.length === 0){
		localStorage.setItem('posts', JSON.stringify(seedPosts))
	}
	// ensure posts are sorted by createdAt desc by default
	const afterRaw = localStorage.getItem('posts')
	const afterParsed = afterRaw ? JSON.parse(afterRaw) : []
	if (Array.isArray(afterParsed) && afterParsed.length > 0) {
		const sorted = afterParsed.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
		// only rewrite if order differs
		const sameOrder = JSON.stringify(sorted.map(p=>p.id)) === JSON.stringify(afterParsed.map(p=>p.id))
		if(!sameOrder){
			localStorage.setItem('posts', JSON.stringify(sorted))
		}
	}
}catch(e){
	// ignore
}

// In development, seed persisted sample posts when requested or when none exist
if (import.meta.env.DEV && typeof window !== 'undefined') {
	try {
		const forceSeed = window.location && window.location.search && window.location.search.includes('seed=1')
		const existing = localStorage.getItem('posts')
		if (!existing || forceSeed) {
			const sample = [
				{ id: 1, title: '서울숲 산책', content: '서울숲 서울숲 서울숲', place: '서울숲', address: '성동구 왕십리로', views: 120, isResident: true, places: ['서울숲'], createdAt: new Date().toISOString(), region: '성동구' },
				{ id: 2, title: '경복궁 야경', content: '경복궁 경복궁', place: '경복궁', address: '종로구 사직로', views: 95, isResident: true, places: ['경복궁'], createdAt: new Date().toISOString(), region: '종로구' },
				{ id: 3, title: '명동 쇼핑', content: '명동 명동', place: '명동', address: '중구 충무로', views: 55, isResident: false, places: ['명동'], createdAt: new Date().toISOString(), region: '중구' },
				{ id: 4, title: '쌈지길 방문', content: '쌈지길 구경', place: '쌈지길', address: '종로구 인사동길', views: 40, isResident: false, places: ['쌈지길'], createdAt: new Date().toISOString(), region: '종로구' },
				{ id: 5, title: '백인제가옥', content: '백인제가옥 관람', place: '백인제가옥', address: '종로구', views: 30, isResident: true, places: ['백인제가옥'], createdAt: new Date().toISOString(), region: '종로구' },
				{ id: 6, title: '미타사(성동) 방문기', content: '미타사(성동) 좋은 사찰', place: '미타사(성동)', address: '성동구', views: 25, isResident: true, places: ['미타사(성동)'], createdAt: new Date().toISOString(), region: '성동구' },
				{ id: 7, title: '롯데월드타워 서울스카이', content: '롯데월드타워 서울스카이 전망대', place: '롯데월드타워 서울스카이', address: '송파구', views: 60, isResident: false, places: ['롯데월드타워 서울스카이'], createdAt: new Date().toISOString(), region: '송파구' },
				{ id: 8, title: '노을공원(서울)', content: '노을공원(서울) 산책', place: '노을공원(서울)', address: '마포구', views: 20, isResident: false, places: ['노을공원(서울)'], createdAt: new Date().toISOString(), region: '마포구' }
			]

			localStorage.setItem('posts', JSON.stringify(sample))
			// eslint-disable-next-line no-console
			console.log('DEV: seeded localStorage.posts')
		} else {
			// eslint-disable-next-line no-console
			console.log('DEV: localStorage.posts already exists; skipping seed')
		}
	} catch (e) {
		// ignore
	}
}

createApp(App).use(router).mount('#app')