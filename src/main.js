import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import seedPosts from './data/seedPosts'

// seed localStorage posts: 기존 글은 유지하고 아직 없는 시드 글만 병합
try{
	const raw = localStorage.getItem('posts')
	const parsed = raw ? JSON.parse(raw) : []
	const existing = Array.isArray(parsed) ? parsed : []
	const ids = new Set(existing.map(p => String(p.id)))
	const missing = seedPosts.filter(p => !ids.has(String(p.id)))
	if(missing.length > 0){
		localStorage.setItem('posts', JSON.stringify([...existing, ...missing]))
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

createApp(App).use(router).mount('#app')