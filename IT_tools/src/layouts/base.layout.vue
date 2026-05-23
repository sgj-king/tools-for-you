<script lang="ts" setup>
import { NIcon } from 'naive-ui';
import { RouterLink } from 'vue-router';
import { Home2 } from '@vicons/tabler';
import NavbarButtons from '../components/NavbarButtons.vue';
import CrossAppLinks from '../components/CrossAppLinks.vue';
import { useStyleStore } from '@/stores/style.store';

const styleStore = useStyleStore();
</script>

<template>
  <div class="base-layout">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <RouterLink to="/" class="logo-link">
        <div class="logo-text">TOOLS FOR YOU</div>
      </RouterLink>

      <div class="navbar-center">
        <c-tooltip :tooltip="'主页'" position="bottom">
          <c-button to="/" circle variant="text" :aria-label="'主页'">
            <NIcon size="25" :component="Home2" />
          </c-button>
        </c-tooltip>
        <command-palette />
      </div>

      <div class="navbar-right">
        <CrossAppLinks />
        <NavbarButtons v-if="!styleStore.isSmallScreen" />
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div>© {{ new Date().getFullYear() }} Tools For You · 集成于 NewAPI 平台</div>
    </footer>
  </div>
</template>

<style lang="less" scoped>
.base-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg);
}

.top-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.logo-link {
  text-decoration: none;
  color: inherit;
}

.logo-text {
  font-size: 20px;
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

.support-button {
  background: linear-gradient(130deg, #1e8b77 0%, #2ca58f 48%, #1a6f60 100%);
  color: #fff !important;
  border-radius: 999px;
  box-shadow: 0 10px 25px rgba(30, 139, 119, 0.28);
  transition: transform ease 0.2s, box-shadow ease 0.2s, padding ease 0.2s;
  
  &:hover {
    color: #fff;
    padding-left: 30px;
    padding-right: 30px;
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(30, 139, 119, 0.32);
  }
}

.main-content {
  flex: 1;
  padding: 18px;
}

.app-footer {
  text-align: center;
  color: var(--app-muted);
  padding: 16px 24px;
  background: var(--app-surface);
  border-top: 1px solid var(--app-border);
  font-size: 12px;
  
  div {
    margin: 4px 0;
  }
}

@media (max-width: 700px) {
  .top-header {
    padding: 12px 16px;
  }
  
  .logo-text {
    font-size: 14px;
  }
  
  .navbar-center {
    max-width: 200px;
  }
  
  .main-content {
    padding: 12px;
  }
}
</style>
