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

createApp(App).use(router).mount('#app')