import { computed, ref } from 'vue'
import { PLACES } from '../data/places'
import { LOCAL_TIPS } from '../data/seed'
import  { PlaceCategory } from '../services/types'

/**
 * 공공데이터(관광지) 스토어
 * 실제 서비스에서는 fetchPlaces()에서 공공 API를 호출하도록 교체한다.
 */
export const usePlaceStore = defineStore('place', () => {
  const places = ref(PLACES)
  const tips = ref(LOCAL_TIPS)

  const searchQuery = ref('')
  const activeCategory = ref<'전체' | PlaceCategory>('전체')

  /** 검색어 + 카테고리 필터가 적용된 목록 */
  const filteredPlaces = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    return places.value.filter((p) => {
      const matchCategory =
        activeCategory.value === '전체' || p.category === activeCategory.value
      const matchQuery =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      return matchCategory && matchQuery
    })
  })

  const getPlaceById = (id) => places.value.find((p) => p.id === id)

  const getTipsByPlaceId = (placeId) =>
    tips.value
      .filter((t) => t.placeId === placeId)
      .sort((a, b) => b.likes - a.likes)

  return {
    places,
    tips,
    searchQuery,
    activeCategory,
    filteredPlaces,
    getPlaceById,
    getTipsByPlaceId,
  }
})
