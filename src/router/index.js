import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import BoardPage from '../pages/BoardPage.vue'
import PostDetailPage from '../pages/PostDetailPage.vue'
import WritePage from '../pages/WritePage.vue'
import ExplorePage from '../pages/ExplorePage.vue'
import ExploreDetailPage from '../pages/ExploreDetailPage.vue'
import FavoritesPage from '../pages/FavoritesPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/explore', component: ExplorePage },
    { path: '/explore/:id', component: ExploreDetailPage },
    { path: '/favorites', component: FavoritesPage },
    { path: '/board', component: BoardPage },
    { path: '/board/:id', component: PostDetailPage },
    { path: '/write', component: WritePage },
  ],
})

export default router