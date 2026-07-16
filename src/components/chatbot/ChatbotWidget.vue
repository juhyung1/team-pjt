<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { askChatbot } from "../../services/chatService";

const isOpen = ref(false);
const input = ref("");
const bodyEl = ref(null);
const isLoading = ref(false);
const router = useRouter();
const suggestions = [
  "성수동 후기 알려줘",
  "서울숲 주민 추천 있어?",
  "지금 뜨는 장소는?",
];
const showSuggestions = ref(true);

const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content: '안녕하세요! SeoulMate 지역 도우미예요. 😊\n서울 관광지·주민 팁·커뮤니티 글을 기반으로 답해드려요.',
  },
]);

function toggle() {
  isOpen.value = !isOpen.value;
}

async function submit(text) {
  console.log("submit");
  const message = (text ?? input.value).trim();
  if (!message) return;
messages.value.push({
  id: Date.now(),
  role: "assistant",
  content: "검색 중이에요..."
});

  input.value = "";
  showSuggestions.value = false;

  messages.value.push({
    id: Date.now(),
    role: "user",
    content: message,
  });
  isLoading.value = true;

  try {
    const history = messages.value.slice(-6).map(({ role, content }) => ({
      role,
      content: typeof content === "object" ? content.answer : content,
    }));

    const answer = await askChatbot(message, history);

    messages.value = messages.value.filter(
  (m) => m.content !== "검색 중이에요..."
);
messages.value.push({
      id: Date.now() + 1,
      role: "assistant",
      content:
        typeof answer === "object"
          ? answer
          : {
              answer,
              relatedPosts: [],
              relatedTips: [],
              relatedPlaces: [],
              needCommunityPost: false,
              suggestions: [],
            },
    });

  } catch (error) {
    console.error(error);

    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: '답변 생성 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
    })
  } finally {
    isLoading.value = false;
  }
}
watch(
  () => [messages.value.length, isLoading.value],
  async () => {
    await nextTick();
    bodyEl.value?.scrollTo({
      top: bodyEl.value.scrollHeight,
      behavior: "smooth",
    });
  },
);

onBeforeUnmount(() => {
  bodyEl.value = null;
});

function openPost(post) {
  isOpen.value = false;

  router.push({
    path: `/board/${post.id}`
  });
}


function goWrite() {
  isOpen.value = false;

  router.push({
    path: "/write"
  });
}


function openPlace(place) {
  isOpen.value = false;

  router.push({
    path: `/explore/${place.id}`
  });
}
</script>

<template>
  <div class="chatbot">
    <section v-if="isOpen" class="chatbot__panel">
      <header class="chatbot__header">
        <div>
          <p class="chatbot__title">SeoulMate 도우미</p>
          <p class="chatbot__subtitle">서울 공공데이터 · 커뮤니티 기반 답변</p>
        </div>
        <button class="chatbot__close" type="button" aria-label="챗봇 닫기" @click="toggle">✕</button>
      </header>

      <div ref="bodyEl" class="chatbot__body">
        <div
          v-for="m in messages"
          :key="m.id"
          class="chatbot__msg"
          :class="`chatbot__msg--${m.role}`"
        >
          <div v-if="typeof m.content === 'string'">
            {{ m.content }}
          </div>

          <div v-else>
            <p class="chat-answer">
              {{ m.content.answer }}
            </p>

           <!-- 주민 후기 -->

            <div v-if="m.content.relatedTips?.length" class="related-section">
              <p class="section-title">지역 주민 TIP</p>

              <div
                v-for="tip in m.content.relatedTips"
                :key="tip.id"
                class="tip-card"
              >
                <strong>
                  {{ tip.author }}
                </strong>

                <p class="tip-content">
                  {{ tip.content }}
                </p>
              </div>
            </div>

            <!-- 관련 게시글 -->

            <div v-if="m.content.relatedPosts?.length" class="related-section">
              <p class="section-title">관련 커뮤니티 게시글</p>

              <button
                <div
   v-for="post in m.content.relatedPosts"
  :key="post.id"
  class="post-link"
  @click="openPost(post)"
>
  <span class="post-title">
    {{ post.title }}
  </span>

  <small class="post-view">
    조회 {{ post.views ?? 0 }}
  </small>
              </button>
            </div>
  <!-- 추천 장소 -->

            <div v-if="m.content.relatedPlaces?.length" class="related-section">
              <p class="section-title">추천 장소</p>

              <button
                v-for="place in m.content.relatedPlaces"
                :key="place.id"
                class="place-chip"
                @click="openPlace(place)"              >
                {{ place.name }}
              </button>
            </div>
           

            <!-- 커뮤니티 작성 유도 -->

            <div v-if="m.content.needCommunityPost" class="write-box">
              <p>
                아직 관련된 주민 후기가 없어요. 직접 첫 번째 후기를
                작성해볼까요?
              </p>

              <button class="write-btn" @click="goWrite">
                후기 작성하러 가기
              </button>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="chatbot__msg chatbot__msg--assistant">
          <span class="chatbot__typing" aria-label="답변 생성 중">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>

<div 
v-if="showSuggestions && suggestions.length && !isLoading" 
class="chatbot__suggestions"
>        <button
          v-for="s in suggestions"
          :key="s"
          class="chip"
          @click="submit(s)"
        >
          {{ s }}
        </button>
      </div>

      <form class="chatbot__input-row" @submit.prevent="submit()">
        <input
          v-model="input"
          class="chatbot__input"
          placeholder="메시지를 입력하세요"
        />
        <button type="submit" class="btn">전송</button>

      </form>
    </section>

    <button
      class="chatbot__fab"
      :class="{ 'chatbot__fab--open': isOpen }"
      @click="toggle"
      :aria-label="isOpen ? '챗봇 닫기' : '챗봇 열기'"
    >
      <span class="chatbot__fab-icon">
        <!-- 닫혀있을 때: 말풍선 아이콘 -->
        <svg
          v-if="!isOpen"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          stroke="white"
        >
          <path
            d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.42 0-2.76-.33-3.95-.92L3 21l1.48-5.1A8.46 8.46 0 0 1 3.5 12 8.5 8.5 0 0 1 12 3.5 8.5 8.5 0 0 1 21 12Z"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
        

        <!-- 열려있을 때: 닫기(X) 아이콘 -->
        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          stroke="white"
        >
          <path
            d="M2 2l10 10M12 2L2 12"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </span>
    </button>
  </div>
</template>

<style scoped>
.chatbot__fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font-size: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  transition:
    transform var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);

}


.chatbot__fab:hover {
  transform: scale(1.06);
}
.chatbot__fab--open {
  background: #0f172a;
}

.chatbot__fab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.chatbot__fab--open .chatbot__fab-icon {
  transform: rotate(90deg);
}

.chatbot__panel {
  position: fixed;
  right: 24px;
  bottom: 96px;
  z-index: 2001;

  width: 320px;
  max-width: calc(100vw - 32px);

  height: 460px;
  min-height: 300px;
  max-height: calc(100vh - 120px);

  display: flex;
  flex-direction: column;

  background: #fff;

  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);

  resize: vertical;
  overflow: hidden;

  animation: panel-up 0.2s ease;
}

.chatbot__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-border);
}

.chatbot__title {
  font-weight: 800;
  margin: 0;
}

.chatbot__subtitle {
  color: var(--color-muted);
  font-size: 0.875rem;
  margin: 2px 0 0;
}

.chatbot__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: var(--color-bg);
}
.chatbot__subtitle {
  font-size: 14px;
  color: #808080;
}

.chatbot__msg {
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  line-height: 1.5;
  white-space: pre-line;
}

.chatbot__msg--assistant {
  background: transparent;
}

.chatbot__msg--user {
  background: var(--color-primary);
  color: #fff;
}

.chatbot__input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--color-border);
}

.chatbot__input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.chatbot__close {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
}

.chatbot__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
}

.chip {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.chatbot__typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.chatbot__typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.chatbot__typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.chatbot__typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes panel-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.chat-answer {
  line-height: 1.6;
  background: #f1f5f9;
  padding: 10px 12px;
  border-radius: 12px;
  margin: 0;
}
.related-section {
  margin-top: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #334155;
}

.place-chip {

width:100%;

padding:11px 16px;

margin-bottom:8px;

border-radius:12px;

border:1px solid #e2e8f0;

background:#ffffff;

color:#334155;

font-weight:600;

font-size:14px;

cursor:pointer;

transition:

transform .2s ease,

box-shadow .2s ease,

border-color .2s ease,

background .2s ease;

}


.place-chip:hover {

background:#f8fafc;

border-color:#cbd5e1;

transform:translateY(-2px);

box-shadow:0 8px 20px rgba(15,23,42,.08);

}


.place-chip:active {

transform:scale(.97);

}

.post-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 8px 4px;

  border: none;
  outline: none;
  background: transparent;

  cursor: pointer;

  color: #334155;
  font-size: 14px;
  font-weight: 600;

  transition: color 0.2s ease, transform 0.2s ease;

  appearance: none;
  -webkit-appearance: none;
}


.post-link:hover {
  background: transparent;
  border: none;
  color: #2563eb;
  transform: translateX(4px);
}
.post-title {

color:#2563eb;

text-decoration:underline;

}


.post-view {

font-size:12px;

color:#94a3b8;

font-weight:400;

}


.post-link small {

color:#64748b;

font-size:12px;

font-weight:400;

}


.tip-card {
  background: white;

  border-radius: 10px;

  padding: 10px;

  margin-bottom: 8px;

  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.tip-content {
  margin-top: 6px;

  font-size: 14px;

  color: #555;
}

.write-box {
  margin-top: 15px;

  padding: 12px;

  border-radius: 12px;

  background: #fff8e7;
}

.write-btn {
  width: 100%;

  margin-top: 10px;

  border: none;

  border-radius: 10px;

  padding: 10px;

  background: var(--color-primary);

  color: white;

  font-weight: 700;

  cursor: pointer;
}

.write-btn:hover {
  opacity: 0.9;
}
</style>
