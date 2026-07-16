import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import BoardPage from '../pages/BoardPage.vue'
import PostDetailPage from '../pages/PostDetailPage.vue'
import WritePage from '../pages/WritePage.vue'
import ExplorePage from '../pages/ExplorePage.vue'
import ExploreDetailPage from '../pages/ExploreDetailPage.vue'
import DashboardPage from '../pages/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/explore', component: ExplorePage },
    { path: '/explore/:id', component: ExploreDetailPage },
    // 즐겨찾기는 서울 장소 페이지의 '즐겨찾기만 보기'로 통합
    { path: '/favorites', redirect: { path: '/explore', query: { fav: '1' } } },
    { path: '/board', component: BoardPage },
    { path: '/board/:id', component: PostDetailPage },
    { path: '/write', component: WritePage },
    { path: '/dashboard', component: DashboardPage },
    { path: '/community', redirect: '/dashboard' },
    // 존재하지 않는 경로는 홈으로 안내
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  // 페이지 이동 시 항상 상단에서 시작 (뒤로가기는 이전 위치 복원)
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

export default router
