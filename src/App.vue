<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';
import { NGlobalStyle, NMessageProvider, NNotificationProvider, darkTheme } from 'naive-ui';
import { darkThemeOverrides, lightThemeOverrides } from './themes';
import { layouts } from './layouts';
import { useStyleStore } from './stores/style.store';

const route = useRoute();
const layout = computed(() => route?.meta?.layout ?? layouts.base);
const styleStore = useStyleStore();
const theme = computed(() => (styleStore.isDarkTheme ? darkTheme : null));
const themeOverrides = computed(() => (styleStore.isDarkTheme ? darkThemeOverrides : lightThemeOverrides));
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <NGlobalStyle />
    <NMessageProvider placement="bottom">
      <NNotificationProvider placement="bottom-right">
        <component :is="layout">
          <RouterView />
        </component>
      </NNotificationProvider>
    </NMessageProvider>
  </n-config-provider>
</template>

<style>
:root {
  --font-sans: "IBM Plex Sans", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  --font-display: "Fraunces", "Noto Serif SC", "Songti SC", serif;
  --font-mono: "IBM Plex Mono", "JetBrains Mono", "Menlo", monospace;
  --app-bg: #f6f2ea;
  --app-bg-alt: #f1ece3;
  --app-surface: #ffffff;
  --app-surface-2: #fbf9f4;
  --app-border: #e5ded4;
  --app-text: #1f2a2d;
  --app-muted: #6b7570;
  --app-accent: #1e8b77;
  --app-accent-strong: #0f6f5c;
  --app-shadow: 0 22px 50px rgba(36, 31, 22, 0.16);
  --app-shadow-soft: 0 10px 24px rgba(36, 31, 22, 0.12);
  --app-bg-pattern: radial-gradient(1200px 600px at 80% -10%, rgba(30, 139, 119, 0.12), transparent 60%),
    radial-gradient(900px 500px at 10% 0%, rgba(255, 211, 130, 0.18), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0));
  --app-grid: linear-gradient(0deg, rgba(31, 42, 45, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 42, 45, 0.04) 1px, transparent 1px);
}

.dark {
  --app-bg: #121514;
  --app-bg-alt: #151b19;
  --app-surface: #1a211f;
  --app-surface-2: #161c1a;
  --app-border: #27312f;
  --app-text: #e7f1ed;
  --app-muted: #a2b3ad;
  --app-accent: #35c9a0;
  --app-accent-strong: #27a982;
  --app-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  --app-shadow-soft: 0 12px 26px rgba(0, 0, 0, 0.35);
  --app-bg-pattern: radial-gradient(1200px 600px at 80% -10%, rgba(53, 201, 160, 0.2), transparent 60%),
    radial-gradient(900px 500px at 0% 0%, rgba(98, 120, 112, 0.25), transparent 55%),
    linear-gradient(180deg, rgba(18, 21, 20, 0.9), rgba(18, 21, 20, 0));
  --app-grid: linear-gradient(0deg, rgba(231, 241, 237, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(231, 241, 237, 0.05) 1px, transparent 1px);
}

html, body, #app {
  min-height: 100%;
}

body {
  margin: 0;
  padding: 0;
  color: var(--app-text);
  font-family: var(--font-sans);
  background-color: var(--app-bg);
  background-image: var(--app-bg-pattern);
  background-attachment: fixed;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: var(--app-grid);
  background-size: 40px 40px;
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
}

#app {
  position: relative;
  z-index: 1;
}

a { color: inherit; }
* { box-sizing: border-box; }
</style>
