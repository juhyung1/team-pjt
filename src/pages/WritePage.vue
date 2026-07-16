<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import seoulData from '../data/seoul_attractions.json'

const router = useRouter()
const route = useRoute()

const title = ref('')
const content = ref('')
const password = ref('')
const placeName = ref('')
const isResident = ref(false)

const places = Array.isArray(seoulData?.items) ? seoulData.items : []
const isEdit = computed(() => route.query?.edit != null)
const editingId = computed(() => String(route.query.edit || ''))
const pageTitle = computed(() => (isEdit.value ? '글 수정' : '글쓰기'))
const submitLabel = computed(() => (isEdit.value ? '수정 완료' : '등록'))

function queryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function loadPosts() {
  try {
    const raw = localStorage.getItem('posts')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePosts(posts) {
  localStorage.setItem('posts', JSON.stringify(posts))
}

function findPostById(id) {
  return loadPosts().find((p) => String(p.id) === String(id))
}

function findPlaceByName(name) {
  const normalized = String(name || '').trim().toLowerCase()
  if (!normalized) return null
  return places.find((p) => String(p.title || '').trim().toLowerCase() === normalized) || null
}

function findPlaceById(id) {
  return places.find((p) => String(p.contentid) === String(id)) || null
}

function extractDistrict(addr) {
  const matched = String(addr || '').match(/서울특별시\s+([^\s]+)/)
  return matched?.[1] || ''
}

function hasEditSession(id) {
  try {
    const raw = sessionStorage.getItem(`seoulmate:edit-verified:${id}`)
    if (!raw) return false
    return Date.now() - Number(raw) < 10 * 60 * 1000
  } catch {
    return false
  }
}

function clearEditSession(id) {
  try {
    sessionStorage.removeItem(`seoulmate:edit-verified:${id}`)
  } catch {
    // ignore
  }
}

onMounted(() => {
  if (isEdit.value) {
    const post = findPostById(editingId.value)
    if (!post) {
      alert('해당 게시글을 찾을 수 없습니다.')
      router.push('/board')
      return
    }
    title.value = post.title || ''
    content.value = post.content || ''
    placeName.value = post.place || ''
    isResident.value = Boolean(post.isResident)
    return
  }

  const placeId = queryValue(route.query.placeId)
  const place = placeId ? findPlaceById(placeId) : null
  placeName.value = place?.title || queryValue(route.query.place) || ''
})

function buildPlacePayload() {
  const selected = findPlaceByName(placeName.value)
  return {
    place: selected?.title || placeName.value.trim(),
    placeId: selected?.contentid || null,
    address: selected?.addr1 || '',
    region: extractDistrict(selected?.addr1),
  }
}

function onSubmit() {
  const t = title.value.trim()
  const c = content.value.trim()
  const pw = password.value

  if (!t || !c) {
    alert('제목과 내용을 입력해주세요.')
    return
  }

  const posts = loadPosts()

  if (isEdit.value) {
    const id = editingId.value
    const idx = posts.findIndex((p) => String(p.id) === String(id))
    if (idx === -1) {
      alert('수정할 게시글을 찾을 수 없습니다.')
      return
    }

    const verified = hasEditSession(id)
    const stored = posts[idx]
    if (!verified) {
      if (pw.length < 4) {
        alert('수정하려면 기존 비밀번호를 입력해주세요.')
        return
      }
      if (stored.password && String(stored.password) !== String(pw)) {
        alert('비밀번호가 일치하지 않습니다.')
        return
      }
    }

    posts[idx] = {
      ...stored,
      ...buildPlacePayload(),
      title: t,
      content: c,
      isResident: Boolean(isResident.value),
      updatedAt: new Date().toISOString(),
    }
    savePosts(posts)
    clearEditSession(id)
    router.push(`/board/${id}`)
    return
  }

  if (pw.length < 4) {
    alert('수정용 비밀번호는 4자리 이상 입력해주세요.')
    return
  }

  const newPost = {
    id: Date.now(),
    ...buildPlacePayload(),
    title: t,
    content: c,
    password: pw,
    isResident: Boolean(isResident.value),
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
  }

  posts.unshift(newPost)
  savePosts(posts)
  router.push(`/board/${newPost.id}`)
}

function onCancel() {
  router.back()
}
</script>

<template>
  <div class="write-page">
    <header class="page-head">
      <p class="eyebrow">익명 커뮤니티</p>
      <h1 class="title">{{ pageTitle }}</h1>
      <p class="subtitle">서울 장소 경험과 질문을 남겨보세요. 수정과 삭제에는 작성 시 입력한 비밀번호가 필요합니다.</p>
    </header>

    <form class="form card" @submit.prevent="onSubmit">
      <div class="form-row">
        <label class="label" for="post-title">제목</label>
        <input id="post-title" v-model="title" class="input" type="text" placeholder="제목을 입력하세요" />
      </div>

      <div class="form-row">
        <label class="label" for="post-place">연결 장소</label>
        <input
          id="post-place"
          v-model="placeName"
          class="input"
          type="text"
          list="place-options"
          placeholder="예: 경복궁, 서울숲"
        />
        <datalist id="place-options">
          <option v-for="place in places" :key="place.contentid" :value="place.title" />
        </datalist>
      </div>

      <div class="form-row">
        <label class="label" for="post-content">내용</label>
        <textarea id="post-content" v-model="content" class="textarea" rows="10" placeholder="내용을 입력하세요"></textarea>
      </div>

      <label class="check-row">
        <input v-model="isResident" type="checkbox" />
        <span>지역 주민 경험으로 표시</span>
      </label>

      <div class="form-row">
        <label class="label" for="post-password">수정용 비밀번호</label>
        <input
          id="post-password"
          v-model="password"
          class="input"
          type="password"
          :placeholder="isEdit && hasEditSession(editingId) ? '비밀번호 확인 완료' : '숫자 4자리 이상'"
        />
        <p v-if="isEdit && hasEditSession(editingId)" class="help">상세 화면에서 비밀번호를 확인했기 때문에 다시 입력하지 않아도 됩니다.</p>
      </div>

      <div class="actions">
        <button type="submit" class="btn">{{ submitLabel }}</button>
        <button type="button" class="btn cancel" @click="onCancel">취소</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.write-page {
  box-sizing: border-box;
  margin: 0 auto;
  max-width: 760px;
  padding: 24px 0;
}

.page-head {
  margin-bottom: 16px;
}

.eyebrow {
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.title {
  font-size: 1.75rem;
  margin: 0 0 6px;
}

.subtitle {
  color: var(--color-muted);
  margin: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: 700;
  margin-bottom: 8px;
}

.input,
.textarea {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  min-height: 44px;
  padding: 10px 12px;
}

.textarea {
  line-height: 1.6;
  resize: vertical;
}

.check-row {
  align-items: center;
  color: var(--color-text);
  display: flex;
  gap: 10px;
  font-weight: 600;
}

.check-row input {
  height: 18px;
  width: 18px;
}

.help {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin: 8px 0 0;
}

.actions {
  align-items: center;
  display: flex;
  gap: 12px;
}

.btn.cancel {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-muted);
}
</style>
