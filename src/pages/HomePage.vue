<script setup lang="ts">
import { computed, ref } from 'vue'
import seoulData from '../data/seoul_attractions.json'

const posts = ref<any[]>([])

try {
  const raw = localStorage.getItem('posts')
  const parsed = raw ? JSON.parse(raw) : []
  posts.value = Array.isArray(parsed) ? parsed : []
} catch {
  posts.value = []
}

const popularPlaces = computed(() => {
  const items = Array.isArray((seoulData as any)?.items)
    ? (seoulData as any).items
    : []

  return items.filter((p: any) => p?.firstimage).slice(0, 8)
})

const recentPosts = computed(() => {
  return [...posts.value].reverse().slice(0, 5)
})

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div>
    <h1>홈</h1>

    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-label">
          지역 정보 공유 커뮤니티
        </div>

        <h1 class="hero-title">
          지역 주민의 경험이<br />
          방문자의 선택이 됩니다
        </h1>

        <p class="hero-desc">
          이 곳에서 지역 주민들이 추천하는 장소와 이야기를 찾아보세요.
        </p>
      </div>
    </section>

    <section class="container section">
      <h2 class="section-title">
        서울의 장소들
      </h2>

      <div class="grid">
        <article
          v-for="place in popularPlaces"
          :key="place.contentid"
          class="card place-card"
        >
          <div
            v-if="place.firstimage"
            class="card-media"
          >
            <img
              :src="place.firstimage"
              :alt="place.title"
            />
          </div>

          <div
            v-else
            class="card-media placeholder"
          ></div>

          <div class="card-body">
            <div class="place-title">
              {{ place.title }}
            </div>

            <div class="place-addr">
              {{ place.addr1 }}
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="container section">
      <h2 class="section-title">
        최근 게시글
      </h2>

      <div class="card">
        <ul
          v-if="recentPosts.length"
          class="posts-list"
        >
          <li
            v-for="post in recentPosts"
            :key="post.id"
            class="post-row"
          >
            <router-link :to="`/board/${post.id}`" class="post-title">{{ post.title }}</router-link>

            <div class="post-date">
              {{ formatDate(post.createdAt) }}
            </div>
          </li>
        </ul>

        <div
          v-else
          class="no-posts"
        >
          <p>아직 게시글이 없어요. 첫 글을 남겨보세요.</p>

          <router-link
            to="/write"
            class="btn"
          >
            글쓰기
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  background: var(--color-bg);
  padding: 80px 0;
  color: var(--color-text);
}

.hero-inner {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.hero-label {
  display: inline-block;
  background: rgba(59, 130, 246, 0.08);
  color: var(--color-primary);
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 14px;
  margin-bottom: 18px;
}

.hero-title {
  font-size: 48px;
  line-height: 1.1;
  margin-bottom: 16px;
}

.hero-desc {
  color: var(--color-muted);
}

.section {
  margin-top: 64px;
}

.section-title {
  margin-bottom: 20px;
}

.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(4, 1fr);
}

.card-media {
  height: 180px;
  overflow: hidden;
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  background: #e5e7eb;
}

.card-body {
  padding: 16px;
}

.posts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.post-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
}

.no-posts {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>