<template>
  <div class="post-page">
    <div v-if="!post" class="no-post">
      <p>존재하지 않는 게시글이에요.</p>
      <router-link to="/board" class="btn">목록으로</router-link>
    </div>

    <div v-else class="card post-card">
      <div class="top-actions">
        <div class="top-links">
          <button class="top-link" @click="openModal('edit')">수정</button>
          <button class="top-link delete-link" @click="openModal('delete')">삭제</button>
        </div>
      </div>

      <h1 class="post-title">{{ post.title }}</h1>
      <div class="meta">
        <span class="date">{{ formatDate(post.createdAt) }}</span>
        <span class="views">조회수 {{ post.views }}</span>
      </div>

      <hr />

      <div class="post-content">{{ post.content }}</div>

      <div class="like-row">
        <button class="like-icon" :class="{ liked: isLiked }" @click="toggleLike" :aria-pressed="isLiked" aria-label="좋아요">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 21s-7.5-4.7-10-8.2C-0.5 8 4 3 8.5 5.5 11 7 12 9 12 9s1-2 3.5-3.5C20 3 24.5 8 22 12.8 19.5 16.3 12 21 12 21z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path v-if="isLiked" d="M12 21s-7.5-4.7-10-8.2C-0.5 8 4 3 8.5 5.5 11 7 12 9 12 9s1-2 3.5-3.5C20 3 24.5 8 22 12.8 19.5 16.3 12 21 12 21z" fill="var(--color-danger)" />
          </svg>
        </button>
        <div class="like-count">{{ post.likes || 0 }}</div>
      </div>

      <div class="post-actions">
        <div class="left">
          <router-link to="/board" class="btn btn-muted">목록으로</router-link>
        </div>

        <div class="right">
          <!-- top edit/delete handled above; keep empty to align -->
        </div>
      </div>
    </div>

    <div v-if="modalVisible" class="overlay" @click.self="closeModal">
      <div class="modal">
        <h3>비밀번호 확인</h3>
        <input
          v-model="passwordInput"
          type="password"
          placeholder="비밀번호"
          class="pw-input"
        />
        <div class="modal-error" v-if="errorMsg">{{ errorMsg }}</div>

        <div class="modal-actions">
          <button class="btn" @click="confirmModal">확인</button>
          <button class="btn cancel" @click="closeModal">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const postsKey = 'posts'

const post = ref(null)
const likedIds = ref([])
const modalVisible = ref(false)
const modalAction = ref('') // 'edit' | 'delete'
const passwordInput = ref('')
const errorMsg = ref('')

function loadPosts() {
  try {
    const raw = localStorage.getItem(postsKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadLiked() {
  try {
    const raw = localStorage.getItem('liked')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLiked(list) {
  localStorage.setItem('liked', JSON.stringify(list))
}

function savePosts(list) {
  localStorage.setItem(postsKey, JSON.stringify(list))
}



function loadPost(){

  const id = route.params.id
  const list = loadPosts()

  const idx = list.findIndex(
    (x) => String(x.id) === String(id)
  )

  if(idx === -1){
    post.value = null
    return
  }


  list[idx].views = Number(list[idx].views || 0) + 1
  list[idx].likes = Number(list[idx].likes || 0)


  savePosts(list)

  post.value = list[idx]

  likedIds.value = loadLiked()
}


onMounted(()=>{
  loadPost()
})


watch(
  () => route.params.id,
  ()=>{
    loadPost()
  }
)




function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}.${dd}`
}

function openModal(action) {
  modalAction.value = action
  passwordInput.value = ''
  errorMsg.value = ''
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  passwordInput.value = ''
  errorMsg.value = ''
}

function confirmModal() {
  if (!post.value) return closeModal()
  const input = String(passwordInput.value)
  const correct = String(post.value.password ?? '')
  if (input !== correct) {
    errorMsg.value = '비밀번호가 일치하지 않습니다'
    return
  }

  const id = route.params.id
  if (modalAction.value === 'edit') {
    try {
      sessionStorage.setItem(`seoulmate:edit-verified:${id}`, String(Date.now()))
    } catch {
      // 세션 확인값 저장 실패 시에도 기존 비밀번호 재입력 흐름으로 수정 가능
    }
    closeModal()
    router.push(`/write?edit=${id}`)
    return
  }

  if (modalAction.value === 'delete') {
    const list = loadPosts()
    const idx = list.findIndex((x) => String(x.id) === String(id))
    if (idx !== -1) {
      list.splice(idx, 1)
      savePosts(list)
    }
    closeModal()
    router.push('/board')
    return
  }
}

function isPostLiked(id) {
  return likedIds.value.some(x => String(x) === String(id))
}

const isLiked = computed(() => {
  if (!post.value) return false
  return isPostLiked(post.value.id)
})

function toggleLike() {
  if (!post.value) return
  const id = post.value.id
  const list = loadPosts()
  const idx = list.findIndex(x => String(x.id) === String(id))

  if (isPostLiked(id)) {
    // unlike: decrement and remove id
    if (idx !== -1) {
      list[idx].likes = Math.max(0, Number(list[idx].likes || 0) - 1)
      savePosts(list)
      post.value.likes = list[idx].likes
    } else {
      post.value.likes = Math.max(0, Number(post.value.likes || 0) - 1)
    }
    likedIds.value = likedIds.value.filter(x => String(x) !== String(id))
    saveLiked(likedIds.value)
  } else {
    // like
    if (idx !== -1) {
      list[idx].likes = Number(list[idx].likes || 0) + 1
      savePosts(list)
      post.value.likes = list[idx].likes
    } else {
      post.value.likes = Number(post.value.likes || 0) + 1
    }
    likedIds.value.push(id)
    saveLiked(likedIds.value)
  }
}
</script>

<style scoped>
.post-page {
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
  max-width: 800px;
}
.post-card {
  padding: 20px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
  border: 1px solid var(--color-border);
}
.post-title {
  margin: 0 0 8px 0;
  font-size: 1.6rem;
}
.meta {
  color: var(--color-muted);
  font-size: 0.9rem;
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.post-content {
  white-space: pre-line;
  margin-top: 12px;
  line-height: 1.6;
}
.post-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.top-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}
.top-links { display:flex; gap:12px }
.top-link {
  background: transparent;
  border: none;
  color: var(--color-muted);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
}
.top-link.delete-link { color: var(--color-danger) }
.btn {
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.btn.delete {
  background: var(--color-danger);
}
.btn-muted {
  background: var(--color-muted-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.btn.cancel {
  background: transparent;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
}
.no-post {
  text-align: center;
  padding: 40px 0;
}

.like-row { display:flex; align-items:center; gap:8px; margin-top:18px }
.like-icon {
  background: transparent;
  border: none;
  color: var(--color-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: var(--radius-full);
  cursor: pointer;
}
.like-icon.liked { color: var(--color-danger) }
.like-count { color: var(--color-muted); font-size: 0.95rem }

/* modal */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}
.modal {
  background: var(--color-surface);
  padding: 20px;
  border-radius: var(--radius-sm);
  width: 320px;
  box-shadow: 0 8px 30px rgba(2,6,23,0.2);
}
.modal h3 {
  margin: 0 0 12px 0;
}
.pw-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.modal-error {
  color: var(--color-danger);
  font-size: 0.9rem;
  margin-bottom: 8px;
}
</style>
