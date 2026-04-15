<script setup lang="ts">
// 无侧边栏布局，但保留原有的主内容区域样式
</script>

<template>
  <div class="shell">
    <div class="app-content">
      <slot />
    </div>
  </div>
</template>

<style lang="less" scoped>
.shell {
  min-height: 100vh;
  padding: 18px;
  display: flex;
}

.app-content {
  flex: 1;
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

@media (max-width: 700px) {
  .shell {
    padding: 12px;
  }
}
</style>
