<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { useHead } from '@vueuse/head';
import type { HeadObject } from '@vueuse/head';

import BaseLayout from './base.layout.vue';
import FavoriteButton from '@/components/FavoriteButton.vue';
import type { Tool } from '@/tools/tools.types';

const route = useRoute();

const head = computed<HeadObject>(() => ({
  title: `${route.meta.name} - IT Tools`,
  meta: [
    {
      name: 'description',
      content: route.meta?.description as string,
    },
    {
      name: 'keywords',
      content: ((route.meta.keywords ?? []) as string[]).join(','),
    },
  ],
}));
useHead(head);
const { t } = useI18n();

const i18nKey = computed<string>(() => route.path.trim().replace('/', ''));
const toolTitle = computed<string>(() => t(`tools.${i18nKey.value}.title`, String(route.meta.name)));
const toolDescription = computed<string>(() => t(`tools.${i18nKey.value}.description`, String(route.meta.description)));
</script>

<template>
  <BaseLayout>
    <div class="tool-layout">
      <div class="tool-header">
        <div flex flex-nowrap items-center justify-between>
          <n-h1>
            {{ toolTitle }}
          </n-h1>

          <div>
            <FavoriteButton :tool="{ name: route.meta.name, path: route.path } as Tool" />
          </div>
        </div>

        <div class="separator" />

        <div class="description">
          {{ toolDescription }}
        </div>
      </div>
    </div>

    <div class="tool-content">
      <slot />
    </div>
  </BaseLayout>
</template>

<style lang="less" scoped>
.tool-content {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;

  ::v-deep(& > *) {
    flex: 0 1 620px;
  }
}

.tool-layout {
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;

  .tool-header {
    padding: 34px 0 26px;
    width: 100%;

    .n-h1 {
      opacity: 0.95;
      font-size: 42px;
      font-weight: 600;
      margin: 0;
      line-height: 1.05;
      font-family: var(--font-display);
      letter-spacing: 0.02em;
    }

    .separator {
      width: 140px;
      height: 3px;
      border-radius: 4px;
      background: linear-gradient(90deg, var(--app-accent), rgba(30, 139, 119, 0));
      margin: 12px 0 10px;
      opacity: 0.7;
    }

    .description {
      margin: 0;
      opacity: 0.85;
      color: var(--app-muted);
      font-size: 15px;
    }
  }
}
</style>

