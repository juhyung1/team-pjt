/**
 * LocalStorage 접근을 한 곳에서 관리한다.
 * JSON 직렬화/역직렬화와 예외 처리를 캡슐화하여
 * 스토어에서는 데이터 로직에만 집중할 수 있게 한다.
 */
const PREFIX = 'localhub:'

export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // 저장 실패(용량 초과 등)는 UX를 막지 않는다
      console.warn(`[storage] "${key}" 저장에 실패했습니다.`)
    }
  },
}
