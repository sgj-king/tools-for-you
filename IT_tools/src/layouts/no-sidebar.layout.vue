<script setup lang="ts">
import { RouterLink } from 'vue-router';
import CrossAppLinks from '../components/CrossAppLinks.vue';
</script>

<template>
  <div class="shell">
    <header class="no-sidebar-header">
      <RouterLink to="/" class="logo-link">
        <span class="logo-text">TOOLS FOR YOU</span>
      </RouterLink>
      <div class="header-spacer" />
      <CrossAppLinks />
    </header>
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
  flex-direction: column;
  gap: 14px;
}

.no-sidebar-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 18px;
  background: var(--app-surface);
  border-radius: 16px;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
}

.logo-link {
  text-decoration: none;
  color: inherit;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-family: var(--font-display);
  color: var(--app-accent);
}

.header-spacer {
  flex: 1;
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
  .no-sidebar-header {
    padding: 8px 14px;
  }
  .logo-text {
    font-size: 13px;
  }
}
</style>
