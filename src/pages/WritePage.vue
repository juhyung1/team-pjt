<template>
  <div class="write-page">
    <h1 class="title">{{ pageTitle }}</h1>

    <form class="form" @submit.prevent="onSubmit">
      <div class="form-row">
        <label class="label">제목</label>
        <input v-model="title" class="input" type="text" placeholder="제목을 입력하세요" />
      </div>

      <div class="form-row">
        <label class="label">내용</label>
        <textarea v-model="content" class="textarea" rows="10" placeholder="내용을 입력하세요"></textarea>
      </div>

      <div class="form-row">
        <label class="label">비밀번호</label>
        <input v-model="password" class="input" type="password" placeholder="숫자 4자리 이상" />
      </div>

      <div class="actions">
        <button type="submit" class="btn">{{ submitLabel }}</button>
        <button type="button" class="btn cancel" @click="onCancel">취소</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const title = ref('')
const content = ref('')
const password = ref('')
const isResident = ref(false)

const isEdit = computed(() => route.query && route.query.edit != null)

const pageTitle = computed(() => (isEdit.value ? '글 수정' : '글쓰기'))
const submitLabel = computed(() => (isEdit.value ? '수정 완료' : '등록'))

function loadPosts() {
  try {
    const raw = localStorage.getItem('posts')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

function savePosts(posts) {
  localStorage.setItem('posts', JSON.stringify(posts))
}

function findPostById(id) {
  const posts = loadPosts()
  return posts.find(p => String(p.id) === String(id))
}

onMounted(() => {
  if (isEdit.value) {
    const id = route.query.edit
    const post = findPostById(id)
    if (!post) {
      alert('해당 게시글을 찾을 수 없습니다.')
      router.back()
      return
    }
    title.value = post.title
    content.value = post.content
    isResident.value = Boolean(post.isResident)
    // do not prefill password for security
  }
})

function onSubmit() {
  const t = title.value.trim()
  const c = content.value.trim()
  const pw = password.value

  if (!t || !c) {
    alert('제목과 내용을 입력해주세요.')
    return
  }

  if (pw.length < 4) {
    alert('비밀번호는 4자리 이상 입력해주세요.')
    return
  }

  const posts = loadPosts()

  if (isEdit.value) {
    const id = route.query.edit
    const idx = posts.findIndex(p => String(p.id) === String(id))
    if (idx === -1) {
      alert('수정할 게시글을 찾을 수 없습니다.')
      return
    }

    // Verify password matches stored password
    const stored = posts[idx]
    if (stored.password && String(stored.password) !== String(pw)) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }

    posts[idx] = { ...stored, title: t, content: c, isResident: Boolean(isResident.value) }
    savePosts(posts)
    router.push('/board')
    return
  }

  // create new post
  const newPost = {
    id: Date.now(),
    title: t,
    content: c,
    password: pw,
    isResident: Boolean(isResident.value),
    createdAt: new Date().toISOString(),
    views: 0,
  }

  posts.unshift(newPost)
  savePosts(posts)
  router.push('/board')
}

function onCancel() {
  router.back()
}
</script>

<style scoped>
.write-page {
  padding: 24px;
  margin: 0 auto;
  max-width: 720px;
  box-sizing: border-box;
}
.title {
  margin-bottom: 8px;
  font-size: 1.5rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-row {
  display: flex;
  flex-direction: column;
}
.label {
  font-weight: 600;
  margin-bottom: 8px;
}
.input,
.textarea {
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  resize: vertical;
  min-height: 40px;
}

.actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.btn {
  background-color: var(--color-primary);
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
}
.btn.cancel {
  background: transparent;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
}
</style>