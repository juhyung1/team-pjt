import { ref } from 'vue'
import { askChatbot } from '../services/chatService'
import { usePlaceStore } from './placeStore'
import { usePostStore } from './postStore'
import { ChatMessage } from '../services/types'

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const isLoading = ref(false)
  const messages = ref([
    {
      id: 1,
      role: 'assistant',
      content:
        '안녕하세요! LocalHub 지역 도우미예요. 🏙️\n공공데이터와 주민 후기를 바탕으로 답해드릴게요.\n\n예시: "성수동 후기 알려줘" · "서울숲 주민 추천 있어?" · "요즘 인기 장소는?"',
    },
  ])

  function toggle() {
    isOpen.value = !isOpen.value
  }

  async function send() {
    const trimmed = text.trim()
    if (!trimmed || isLoading.value) return

    messages.value.push({ id: Date.now(), role: 'user', content: trimmed })
    isLoading.value = true

    try {
      const placeStore = usePlaceStore()
      const postStore = usePostStore()
      const answer = await askChatbot(trimmed, messages.value, {
        places: placeStore.places,
        posts: postStore.posts,
        tips: placeStore.tips,
      })
      messages.value.push({ id: Date.now() + 1, role: 'assistant', content: answer })
    } catch {
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: '답변 생성 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
      })
    } finally {
      isLoading.value = false
    }
  }

  return { isOpen, isLoading, messages, toggle, send }
})
