import { computed, ref, watch } from 'vue'
import { SEED_POSTS, TRENDING_KEYWORDS } from '../data/seed'
import { storage } from '../services/storage'
import { usePlaceStore } from './placeStore'

const STORAGE_KEY = 'posts'

/**
 * 커뮤니티 게시글 스토어
 * - 첫 실행 시 시드 데이터를 LocalStorage에 주입
 * - 이후 모든 변경은 자동으로 LocalStorage에 반영 (watch)
 */
export const usePostStore = defineStore('post', () => {
  const posts = ref(storage.get(STORAGE_KEY, SEED_POSTS))

  // 변경 시 자동 저장
  watch(posts, (v) => storage.set(STORAGE_KEY, v), { deep: true })

  /* ---------- 조회 ---------- */

  const sortedByLatest = computed(() =>
    [...posts.value].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  )

  const sortedByPopular = computed(() =>
    [...posts.value].sort((a, b) => b.views + b.likes * 5 - (a.views + a.likes * 5)),
  )

  const getPostById = (id) => posts.value.find((p) => p.id === id)

  const getPostsByPlaceId = (placeId) =>
    sortedByLatest.value.filter((p) => p.placeId === placeId)

  /* ---------- 변경 ---------- */

  /**
   * @param {Omit<Post, 'id' | 'createdAt' | 'views' | 'likes'>} input
   * @returns {Post}
   */
  function createPost(input) {
    const post = {
      ...input,
      id: Math.max(0, ...posts.value.map((p) => p.id)) + 1,
      createdAt: new Date().toISOString(),
      views: 0,
      likes: 0,
    }
    posts.value.unshift(post)
    return post
  }

  function updatePost(id, patch) {
    const post = getPostById(id)
    if (post) Object.assign(post, patch)
  }

  function deletePost(id) {
    posts.value = posts.value.filter((p) => p.id !== id)
  }

  /** 비밀번호 검증 (수정/삭제 전 확인) */
  function verifyPassword(id, password) {
    return getPostById(id)?.password === password
  }

  function increaseViews(id) {
    const post = getPostById(id)
    if (post) post.views += 1
  }

  function likePost(id) {
    const post = getPostById(id)
    if (post) post.likes += 1
  }

  /* ---------- 집계 (Home / Dashboard 공용) ---------- */

  /** 장소별 언급 지표: 게시글 수 + 조회수 가중치 */
  const placeMentions = computed(() => {
    const placeStore = usePlaceStore()
    const map = new Map()
    posts.value.forEach((p) => {
      if (p.placeId === null) return
      const cur = map.get(p.placeId) ?? { count: 0, heat: 0 }
      cur.count += 1
      cur.heat += p.views + p.likes * 5
      map.set(p.placeId, cur)
    })
    return [...map.entries()]
      .map(([placeId, v]) => ({
        place: placeStore.getPlaceById(placeId),
        count: v.count,
        heat: v.heat,
      }))
      .filter((x) => x.place)
      .sort((a, b) => b.heat - a.heat)
  })

  /** 이번 주 인기 장소 TOP5 */
  const weeklyTopPlaces = computed(() => placeMentions.value.slice(0, 5))

  /** 자치구별 게시글 수 */
  const postsByDistrict = computed(() => {
    const placeStore = usePlaceStore()
    const map = new Map()
    posts.value.forEach((p) => {
      if (p.placeId === null) return
      const place = placeStore.getPlaceById(p.placeId)
      if (!place) return
      map.set(place.district, (map.get(place.district) ?? 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  })

  /** 태그 사용 빈도 (인기 키워드) */
  const tagFrequency = computed(() => {
    const map = new Map()
    TRENDING_KEYWORDS.forEach((k) => map.set(k, 0))
    posts.value.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) ?? 0) + 1)))
    return [...map.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  })

  /** 최근 7일 일자별 게시글 수 */
  const activityLast7Days = computed(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const count = posts.value.filter((p) => p.createdAt.slice(0, 10) === key).length
      days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count })
    }
    return days
  })

  return {
    posts,
    sortedByLatest,
    sortedByPopular,
    getPostById,
    getPostsByPlaceId,
    createPost,
    updatePost,
    deletePost,
    verifyPassword,
    increaseViews,
    likePost,
    placeMentions,
    weeklyTopPlaces,
    postsByDistrict,
    tagFrequency,
    activityLast7Days,
  }
})
