<script lang="ts" setup>
import { useTheme } from './c-card.theme';

const props = defineProps<{
  title?: string
}>();

const { title } = toRefs(props);

const theme = useTheme();
</script>

<template>
  <div class="c-card">
    <div v-if="title" class="c-card-title">
      {{ title }}
    </div>
    <slot />
  </div>
</template>

<style lang="less" scoped>
.c-card {
  background-color: v-bind('theme.backgroundColor');
  border: 1px solid v-bind('theme.borderColor');
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: var(--app-shadow-soft);
  position: relative;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(120deg, rgba(30, 139, 119, 0.12), transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &.tool-card {
    cursor: pointer;
  }

  &.tool-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--app-shadow);
    border-color: rgba(30, 139, 119, 0.35);
  }

  &.tool-card:hover::after {
    opacity: 1;
  }

  &-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 20px;
  }
}
</style>
