<script setup lang="ts">
import { useThemeVars } from 'naive-ui';
import FavoriteButton from './FavoriteButton.vue';
import type { Tool } from '@/tools/tools.types';

const props = defineProps<{ tool: Tool & { category: string } }>();
const { tool } = toRefs(props);
const theme = useThemeVars();
</script>

<template>
  <router-link :to="tool.path" class="decoration-none">
    <c-card class="tool-card h-full transition transition-duration-0.5s !border-2px !hover:border-primary">
      <div flex items-center justify-between>
        <n-icon class="tool-card-icon" size="40" :component="tool.icon" />

        <div flex items-center gap-8px>
          <div
            v-if="tool.isNew"
            class="rounded-full px-8px py-3px text-xs text-white dark:text-neutral-800"
            :style="{
              'background-color': theme.primaryColor,
            }"
          >
            {{ $t('toolCard.new') }}
          </div>

          <FavoriteButton :tool="tool" />
        </div>
      </div>

      <div class="tool-card-title truncat my-5px text-lg">
        {{ tool.name }}
      </div>

      <div class="tool-card-description line-clamp-2">
        {{ tool.description }}
      </div>
    </c-card>
  </router-link>
</template>

<style scoped lang="less">
.tool-card-icon {
  color: var(--app-accent);
  opacity: 0.9;
}

.tool-card-title {
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.01em;
  color: var(--app-text) !important;
}

.tool-card-description {
  color: var(--app-muted) !important;
}
</style>
