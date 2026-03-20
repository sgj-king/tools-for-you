<script setup lang="ts">
import { useStyleStore } from '@/stores/style.store';

const styleStore = useStyleStore();
const { isMenuCollapsed, isSmallScreen } = toRefs(styleStore);
const siderPosition = computed(() => (isSmallScreen.value ? 'absolute' : 'static'));
</script>

<template>
  <div class="shell">
    <n-layout class="shell-layout" has-sider>
      <n-layout-sider
        collapse-mode="width"
        :collapsed-width="0"
        :width="260"
        :collapsed="isMenuCollapsed"
        :show-trigger="false"
        :native-scrollbar="false"
        :position="siderPosition"
        class="app-sider"
      >
        <slot name="sider" />
      </n-layout-sider>
      <n-layout class="content app-content">
        <slot name="content" />
        <div v-show="isSmallScreen && !isMenuCollapsed" class="overlay" @click="isMenuCollapsed = true" />
      </n-layout>
    </n-layout>
  </div>
</template>

<style lang="less" scoped>
.shell {
  min-height: 100vh;
  padding: 18px;
  display: flex;
}

.shell-layout {
  flex: 1;
  background: transparent;
}

.app-sider {
  border-radius: 20px;
  overflow: hidden;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
  position: relative;
}

:global(.dark) .app-sider {
  background: #16221e;
  border-color: #1b6e55;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.55);
}

:global(.dark) .app-sider ::v-deep(.n-layout-sider-scroll-container) {
  background: #16221e;
}
::v-deep(.n-layout-sider-scroll-container) {
  padding: 16px 14px 26px;
}

.app-content {
  margin-left: 18px;
  border-radius: 22px;
  background: var(--app-surface-2);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(600px 300px at 85% 0%, rgba(30, 139, 119, 0.08), transparent 60%);
    opacity: 0.9;
    pointer-events: none;
  }

  ::v-deep(.n-layout-scroll-container) {
    padding: 32px;
    position: relative;
    z-index: 1;
  }
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(5, 8, 7, 0.45);
  backdrop-filter: blur(2px);
  cursor: pointer;
  z-index: 2;
}

@media (max-width: 700px) {
  .shell {
    padding: 12px;
  }

  .app-content {
    margin-left: 0;
  }
}
</style>





