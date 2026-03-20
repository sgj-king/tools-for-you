<script setup lang="ts">
import type { Component } from 'vue';

const props = defineProps<{ icon: Component; title: string }>();
const { icon, title } = toRefs(props);
</script>

<template>
  <c-card class="colored-card">
    <n-icon class="icon" size="40" :component="icon" />
    <n-h3 class="title">
      <n-ellipsis>{{ title }}</n-ellipsis>
    </n-h3>

    <div class="description">
      <n-ellipsis :line-clamp="2" :tooltip="false">
        <slot />
      </n-ellipsis>
    </div>
  </c-card>
</template>

<style lang="less" scoped>
.colored-card {
  background: linear-gradient(140deg, rgba(30, 139, 119, 0.98), rgba(46, 172, 141, 0.98));
  color: #f7fffb;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 18px 32px rgba(22, 94, 78, 0.35);

  .icon {
    opacity: 0.85;
  }

  .title {
    color: #f7fffb;
    margin: 5px 0;
    font-family: var(--font-display);
    letter-spacing: 0.02em;
  }

  .description {
    opacity: 0.9;
    margin: 5px 0;

    ::v-deep(a) {
      color: #f7f1d1;
      text-decoration: underline;
      font-weight: 600;
      transition: color ease 0.2s;

      &:hover {
        color: #0b2a24;
      }
    }
  }
}
</style>
