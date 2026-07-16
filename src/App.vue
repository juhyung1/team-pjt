<template>
  <header class="app-header">
    <div class="container header-inner">
      <router-link to="/" class="logo" aria-label="SeoulMate home">
        <img src="/logo.png" alt="SeoulMate 로고" class="logo-img" />
        <span class="logo-text">SeoulMate</span>
      </router-link>
      <nav class="nav">
        <router-link to="/explore" class="nav-link">서울 장소</router-link>
        <router-link to="/board" class="nav-link">커뮤니티</router-link>
        <router-link to="/dashboard" class="nav-link">지역 통계</router-link>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <router-view />
    </div>
  </main>
  <ChatbotWidget />
  <WriteFab />
  <footer class="app-footer">
    <div class="container">
      © {{ currentYear }} SeoulMate - 서울 지역 정보 공유 커뮤니티
    </div>
  </footer>
</template>

<script setup>
import ChatbotWidget from "./components/chatbot/ChatbotWidget.vue";
import WriteFab from "./components/WriteFab.vue";

const currentYear = new Date().getFullYear();
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  min-height: 64px;
  display: flex;
  align-items: center;
}

/* ensure main content sits below the header */

main {
  padding-top: 16px;
  padding-bottom: 24px;
}

/* inner header layout (uses global .container) */
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  gap: var(--space-2);
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  margin-right: var(--space-3);
  flex: 0 0 auto;
}
.logo-img {
  height: 28px;
  width: auto;
}
.logo-text {
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.125rem;
  line-height: 1;
}

/* Navigation */
.nav {
  display: flex;
  gap: var(--space-2, 16px);
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.nav-link {
  color: var(--color-muted);
  text-decoration: none;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition:
    color 120ms ease,
    background-color 120ms ease;
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
  .header-inner {
    align-items: flex-start;
    flex-direction: column;
    padding-top: 12px;
    padding-bottom: 12px;
  }
  .logo {
    font-size: 1rem;
    margin-right: 0;
  }
  .nav {
    gap: var(--space-1, 8px);
    justify-content: flex-start;
  }
  .nav-link { padding: 6px 8px; }
}

.app-footer {
  padding: 24px 0;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  text-align: center;
  font-size: 0.95rem;
}
</style>
