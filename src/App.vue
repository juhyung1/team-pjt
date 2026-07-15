<script setup>
</script>

<template>
  <header>
    <router-link to="/">LocalHub</router-link>
    <nav>
      <router-link to="/board">게시판</router-link>
      <router-link to="/write">글쓰기</router-link>
    </nav>
  </header>

  <main>
    <router-view />
  </main>
</template>