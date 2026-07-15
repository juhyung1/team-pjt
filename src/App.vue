<template>
  <header class="app-header">
    <div class="container header-inner">
      <router-link to="/" class="logo" aria-label="LocalHub home">LocalHub</router-link>
      <nav class="nav">
        <router-link to="/board" class="nav-link">게시판</router-link>
        <router-link to="/write" class="nav-link">글쓰기</router-link>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <router-view />
    </div>
  </main>
  <ChatBot />
</template>

<script setup>
/* no script logic required for static header/navigation */
import ChatBot from './components/ChatBot.vue'
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-card-bg, #ffffff);
  border-bottom: 1px solid var(--color-border);
  height: 64px;
  display: flex;
  align-items: center;
}

/* ensure main content sits below the header */
main { padding-top: 16px; }

/* inner header layout (uses global .container) */
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

/* Logo */
.logo {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 1.125rem;
  text-decoration: none;
  display: inline-block;
  line-height: 1;
}

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
  border-radius: 8px;
  font-weight: 500;
  transition: color 120ms ease, background-color 120ms ease;
}

.nav-link:hover {
  color: var(--color-primary-dark, #2563EB);
  background: rgba(59,130,246,0.04);
}

.nav-link.router-link-active {
  color: var(--Color-primary, var(--color-primary));
  font-weight: 700;
  background: rgba(59,130,246,0.06);
}

/* small responsive tweak */
@media (max-width: 640px) {
  .logo { font-size: 1rem; }
  .nav { gap: var(--space-1, 8px); }
}
</style>