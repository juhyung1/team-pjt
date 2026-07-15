import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import BoardPage from '../pages/BoardPage.vue'
import PostDetailPage from '../pages/PostDetailPage.vue'
import WritePage from '../pages/WritePage.vue'
import DashboardPage from '../pages/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/board', component: BoardPage },
    { path: '/board/:id', component: PostDetailPage },
    { path: '/write', component: WritePage },
    { path: '/community', component: DashboardPage },
  ],
})

export default router