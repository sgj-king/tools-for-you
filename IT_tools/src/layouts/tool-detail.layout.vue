<script lang="ts" setup>
import { computed } from 'vue';
import { NIcon } from 'naive-ui';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { Home2, ArrowLeft } from '@vicons/tabler';
import NavbarButtons from '../components/NavbarButtons.vue';
import CrossAppLinks from '../components/CrossAppLinks.vue';
import { useStyleStore } from '@/stores/style.store';
import { tools } from '@/tools';

const styleStore = useStyleStore();
const router = useRouter();
const route = useRoute();

const currentTool = computed(() => {
  const toolPath = route.path;
  return tools.find(tool => tool.path === toolPath);
});

const toolTitle = computed(() => {
  if (!currentTool.value) return '';
  return '';
});

function goBack() {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
}
</script>

<template>
  <div class="tool-detail-layout">
    <!-- Top Navbar -->
    <nav class="top-navbar">
      <div class="navbar-content">
        <div class="navbar-left">
          <RouterLink to="/" class="logo-link">
            <div class="logo-text">TOOLS FOR YOU</div>
          </RouterLink>
        </div>

        <div class="navbar-center">
          <c-tooltip :tooltip="'主页'" position="bottom">
            <c-button to="/" circle variant="text" :aria-label="'主页'">
              <NIcon size="22" :component="Home2" />
            </c-button>
          </c-tooltip>
          <command-palette />
        </div>

        <div class="navbar-right">
          <CrossAppLinks />
          <NavbarButtons v-if="!styleStore.isSmallScreen" />
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <div class="tool-header">
        <button class="back-button" :aria-label="'返回'" @click="goBack">
          <NIcon size="20" :component="ArrowLeft" />
          <span class="back-text">{{ '返回' }}</span>
        </button>
        <div class="tool-info">
          <h1 class="tool-title">{{ toolTitle }}</h1>
          <p v-if="currentTool?.description" class="tool-description">{{ currentTool.description }}</p>
        </div>
      </div>

      <div class="tool-content">
        <slot />
      </div>
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        <p>© {{ new Date().getFullYear() }} Tools For You · 集成于 NewAPI 平台</p>
      </div>
    </footer>
  </div>
</template>

<style lang="less" scoped>
.tool-detail-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg);
}

.top-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-link {
  text-decoration: none;
  color: inherit;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-family: var(--font-display);
  color: var(--app-accent);
}

.navbar-center {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
  max-width: 400px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main-content {
  flex: 1;
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--app-border);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--app-surface-2);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    background: var(--app-accent);
    border-color: var(--app-accent);
    color: #fff;
    transform: translateX(-2px);
  }

  .back-text {
    @media (max-width: 600px) {
      display: none;
    }
  }
}

.tool-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0;

  @media (max-width: 768px) {
    font-size: 22px;
  }
}

.tool-info {
  flex: 1;
}

.tool-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--app-muted);
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 13px;
  }
}

.tool-content {
  width: 100%;
}

.app-footer {
  background: var(--app-surface);
  border-top: 1px solid var(--app-border);
  padding: 24px;
  text-align: center;
  margin-top: auto;
}

.footer-content {
  color: var(--app-muted);
  font-size: 13px;
}

.footer-content p {
  margin: 0;
}

@media (max-width: 768px) {
  .navbar-content {
    padding: 12px 16px;
  }

  .logo-text {
    font-size: 14px;
  }

  .navbar-center {
    max-width: 200px;
  }

  .main-content {
    padding: 16px;
  }

  .tool-header {
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
  }
}

.dark .top-navbar {
  background: var(--app-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark .app-footer {
  background: var(--app-surface);
}
</style>
