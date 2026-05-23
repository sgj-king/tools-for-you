<script setup lang="ts">
import { computed } from 'vue';

const env = import.meta.env;
const digitalLifeUrl = computed(() => (env.VITE_DIGITAL_LIFE_URL as string) || '');
const platformConsoleUrl = computed(() => (env.VITE_PLATFORM_CONSOLE_URL as string) || '');
const platformConsoleHref = computed(() => {
  const base = platformConsoleUrl.value;
  if (!base) return '';
  return base.endsWith('/') ? `${base}console` : `${base}/console`;
});
</script>

<template>
  <div class="cross-app-links">
    <a
      v-if="digitalLifeUrl"
      class="cross-app-pill cross-app-pill--life"
      :href="digitalLifeUrl"
      :aria-label="'数字生命'"
    >
      <span class="cross-app-spark" aria-hidden="true">✦</span>
      <span class="cross-app-text">数字生命</span>
    </a>
    <a
      v-if="platformConsoleHref"
      class="cross-app-pill cross-app-pill--console"
      :href="platformConsoleHref"
      :aria-label="'彗星科技控制台'"
    >
      <span class="cross-app-spark" aria-hidden="true">◎</span>
      <span class="cross-app-text">彗星科技控制台</span>
    </a>
  </div>
</template>

<style lang="less" scoped>
.cross-app-links {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cross-app-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  color: #fff;
  border: 1px solid transparent;
  box-shadow: 0 8px 22px rgba(30, 139, 119, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease;
  white-space: nowrap;
}

.cross-app-pill--life {
  background: linear-gradient(130deg, #6c5ce7 0%, #1e8b77 100%);
}

.cross-app-pill--console {
  background: linear-gradient(130deg, #1f7a8c 0%, #29415f 100%);
}

.cross-app-pill:hover {
  transform: translateY(-1px);
  padding-left: 20px;
  padding-right: 20px;
  box-shadow: 0 14px 28px rgba(30, 139, 119, 0.28);
}

.cross-app-spark {
  font-size: 14px;
  line-height: 1;
}

@media (max-width: 900px) {
  .cross-app-text {
    display: none;
  }
  .cross-app-pill {
    padding: 7px 12px;
  }
}
</style>
