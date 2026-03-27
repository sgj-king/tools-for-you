<script lang="ts" setup>
import { h, computed } from 'vue';
import { NIcon, NDropdown } from 'naive-ui';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { Home2, User, Logout, ArrowLeft } from '@vicons/tabler';
import NavbarButtons from '../components/NavbarButtons.vue';
import { useStyleStore } from '@/stores/style.store';
import { useAuthStore } from '@/stores/auth.store';
import { config } from '@/config';
import { useTracker } from '@/modules/tracker/tracker.services';
import { tools } from '@/tools';

const styleStore = useStyleStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const version = config.app.version;
const commitSha = config.app.lastCommitSha.slice(0, 7);
const { tracker } = useTracker();
const { t } = useI18n();

// 获取当前工具信息
const currentTool = computed(() => {
  const toolPath = route.path;
  return tools.find(tool => tool.path === toolPath);
});

// 获取工具名称（国际化）
const toolTitle = computed(() => {
  if (!currentTool.value) return '';
  const toolKey = `tools.${currentTool.value.path.substring(1)}.title`;
  return t(toolKey);
});

// 用户下拉菜单
const userMenuOptions = [
  {
    label: '个人中心',
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(User) })
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(Logout) })
  }
];

function handleUserMenuSelect(key: string) {
  if (key === 'logout') {
    authStore.logout();
    router.push('/');
  } else if (key === 'profile') {
    router.push('/');
  }
}

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
          <c-tooltip :tooltip="$t('home.home')" position="bottom">
            <c-button to="/" circle variant="text" :aria-label="$t('home.home')">
              <NIcon size="22" :component="Home2" />
            </c-button>
          </c-tooltip>
          <command-palette />
        </div>
        
        <div class="navbar-right">
          <locale-selector v-if="!styleStore.isSmallScreen" />
          <NavbarButtons v-if="!styleStore.isSmallScreen" />
          
          <RouterLink v-if="!authStore.isLoggedIn" to="/auth" class="auth-button">
            登录 / 注册
          </RouterLink>
          
          <n-dropdown
            v-else
            :options="userMenuOptions"
            @select="handleUserMenuSelect"
            placement="bottom-end"
          >
            <div class="user-avatar">
              <div class="avatar-icon">
                {{ authStore.username.charAt(0).toUpperCase() }}
              </div>
              <span class="username">{{ authStore.username }}</span>
            </div>
          </n-dropdown>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <!-- 工具标题区域 -->
      <div class="tool-header">
        <button class="back-button" @click="goBack" :aria-label="t('common.back') || '返回'">
          <NIcon size="20" :component="ArrowLeft" />
          <span class="back-text">{{ t('common.back') || '返回' }}</span>
        </button>
        <div class="tool-info">
          <h1 class="tool-title">{{ toolTitle }}</h1>
          <p v-if="currentTool?.description" class="tool-description">{{ currentTool.description }}</p>
        </div>
      </div>
      
      <!-- 工具内容 -->
      <div class="tool-content">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <p>
          © {{ new Date().getFullYear() }} Tools For You ·
          <c-link
            target="_blank"
            rel="noopener"
            :href="`https://github.com/sgj-king/tools-for-you/tree/v${version}`"
          >
            v{{ version }}
          </c-link>
          <template v-if="commitSha && commitSha.length > 0">
            -
            <c-link
              target="_blank"
              rel="noopener"
              type="primary"
              :href="`https://github.com/sgj-king/tools-for-you/tree/${commitSha}`"
            >
              {{ commitSha }}
            </c-link>
          </template>
        </p>
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

/* Top Navbar */
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

.auth-button {
  padding: 8px 20px;
  background: linear-gradient(130deg, #1e8b77 0%, #2ca58f 48%, #1a6f60 100%);
  color: #fff !important;
  border-radius: 999px;
  box-shadow: 0 10px 25px rgba(30, 139, 119, 0.28);
  transition: transform ease 0.2s, box-shadow ease 0.2s, padding ease 0.2s;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    color: #fff;
    padding-left: 24px;
    padding-right: 24px;
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(30, 139, 119, 0.32);
  }
}

.user-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 8px;
  background: var(--app-surface-2);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--app-border);

  &:hover {
    background: var(--app-surface);
    border-color: var(--app-accent);
    box-shadow: 0 4px 12px rgba(30, 139, 119, 0.15);
  }
}

.avatar-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(130deg, #1e8b77 0%, #2ca58f 100%);
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text);
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Tool Header */
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
}

.tool-content {
  width: 100%;
}

/* Footer */
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

/* Responsive */
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

/* Dark mode */
.dark .top-navbar {
  background: var(--app-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.dark .app-footer {
  background: var(--app-surface);
}
</style>
