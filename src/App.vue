<template>
  <header class="app-header">
    <div class="container header-inner">
      <router-link to="/" class="logo" aria-label="SeoulMate home">
        <img src="/logo.png" alt="SeoulMate 로고" class="logo-img" />
        <span class="logo-text">SeoulMate</span>
      </router-link>
      <nav class="nav">
        <router-link to="/explore" class="nav-link">장소</router-link>
        <router-link to="/favorites" class="nav-link">즐겨찾기</router-link>
        <router-link to="/board" class="nav-link">게시판</router-link>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <router-view />
    </div>
  </main>
  <ChatBot />
  <WriteFab />
  <footer class="app-footer">
    <div class="container">© {new Date().getFullYear()} SeoulMate — 서울 지역 정보 공유 커뮤니티</div>
  </footer>
</template>

<script setup>
/* no script logic required for static header/navigation */
import ChatBot from './components/ChatBot.vue'
import WriteFab from './components/WriteFab.vue'
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  height: 64px;
  display: flex;
  align-items: center;
}

/* ensure main content sits below the header */
main { padding-top: 16px; padding-bottom: 120px; }

/* inner header layout (uses global .container) */
.header-inner {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* keep logo and nav together with consistent gap */
  height: 64px;
}

/* Logo */
.logo {
  display:flex;
  align-items:center;
  gap:8px;
  text-decoration: none;
  margin-right: var(--space-3);
}
.logo-img{ height:28px; width:auto }
.logo-text{ color: var(--color-text); font-weight:700; font-size:1.125rem; line-height:1 }

/* Navigation */
.nav {
  display: flex;
  gap: var(--space-2, 16px);
  align-items: center;
}

.nav-link {
  color: var(--color-muted);
  text-decoration: none;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: color 120ms ease, background-color 120ms ease;
}

.nav-link:hover {
  color: var(--color-primary-dark);
  background: var(--color-muted-surface);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  font-weight: 700;
  background: var(--color-muted-surface);
}

/* small responsive tweak */
@media (max-width: 640px) {
  .logo { font-size: 1rem; }
  .nav { gap: var(--space-1, 8px); }
}

.app-footer { padding: 24px 0; border-top: 1px solid var(--color-border); color: var(--color-muted); text-align: center; font-size: 0.95rem }
</style>