<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import MenuIconItem from './MenuIconItem.vue';
import type { Tool, ToolCategory } from '@/tools/tools.types';

const props = withDefaults(
  defineProps<{
    toolsByCategory?: ToolCategory[];
  }>(),
  { toolsByCategory: () => [] }
);

const { toolsByCategory } = toRefs(props);
const route = useRoute();
const router = useRouter();

const makeLabel = (tool: Tool) => () => h(RouterLink, { to: tool.path }, { default: () => tool.name });
const makeIcon = (tool: Tool) => () => h(MenuIconItem, { tool });

// 默认所有分类都展开（false = 不折叠）
const collapsedCategories = useStorage<Record<string, boolean>>(
  'menu-tool-option:collapsed-categories',
  {},
  undefined,
  {
    deep: true,
    serializer: {
      read: (v: string) => (v ? JSON.parse(v) : {}),
      write: (v: Record<string, boolean>) => JSON.stringify(v),
    },
  }
);

// 初始化：首次访问时默认展开所有分类
onMounted(() => {
  if (Object.keys(collapsedCategories.value).length === 0) {
    toolsByCategory.value.forEach(({ name }) => {
      collapsedCategories.value[name] = false;
    });
  }
});

function toggleCategoryCollapse({ name }: { name: string }) {
  collapsedCategories.value[name] = !collapsedCategories.value[name];
}

// 分类名称到slug的映射
const categorySlugMap: Record<string, string> = {
  'Crypto': 'crypto',
  'Converter': 'converter',
  'Web': 'web',
  'Development': 'dev',
  'Network': 'network',
  'Text': 'text',
  'Images and videos': 'media',
  'Math': 'math',
  'Measurement': 'measurement',
  'Data': 'data',
};

// 点击分类名称跳转到分类列表页
function goToCategory(name: string) {
  const slug = categorySlugMap[name] || name.toLowerCase().replace(/\s+/g, '-');
  router.push(`/category/${slug}`);
}

const menuOptions = computed(() =>
  toolsByCategory.value.map(({ name, components }) => ({
    name,
    isCollapsed: collapsedCategories.value[name] === true, // 明确判断
    tools: components.map((tool) => ({
      label: makeLabel(tool),
      icon: makeIcon(tool),
      key: tool.path,
    })),
  }))
);
</script>

<template>
  <div v-for="{ name, tools, isCollapsed } of menuOptions" :key="name">
    <div class="menu-category-header">
      <span
        :class="{ 'rotate-0': isCollapsed, 'rotate-90': !isCollapsed }"
        class="menu-chevron"
        @click="toggleCategoryCollapse({ name })"
      >
        <icon-mdi-chevron-right />
      </span>
      <span class="menu-category-label" @click="goToCategory(name)">
        {{ name }}
      </span>
    </div>
    <n-collapse-transition :show="!isCollapsed">
      <div class="menu-wrapper">
        <div class="toggle-bar" @click="toggleCategoryCollapse({ name })" />
        <n-menu
          class="menu"
          :value="route.path"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="tools"
          :indent="8"
          :default-expand-all="true"
        />
      </div>
    </n-collapse-transition>
  </div>
</template>

<style scoped lang="less">
.menu-category-header {
  margin: 12px 8px 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--app-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 14px;
  font-weight: 600;
}

.menu-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  background: var(--app-surface-2);
  box-shadow: inset 0 0 0 1px rgba(31, 42, 45, 0.08);
  color: var(--app-muted);
  transition: transform 0.2s ease, color 0.2s ease;
  cursor: pointer;
}

.menu-category-header:hover .menu-chevron {
  color: var(--app-accent);
}

.menu-category-label {
  cursor: pointer;
  transition: color 0.2s ease;
}

.menu-category-label:hover {
  color: var(--app-accent);
}

.menu-wrapper {
  display: flex;
  flex-direction: row;
  padding: 6px 4px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 0 0 1px rgba(31, 42, 45, 0.06);

  .menu {
    flex: 1;
    margin-bottom: 5px;

    ::v-deep(.n-menu-item-content::before) {
      left: 6px;
      right: 8px;
      border-radius: 10px;
    }

    ::v-deep(.n-menu-item-content) {
      border-radius: 10px;
      margin: 2px 6px;
    }
  }

  .toggle-bar {
    width: 18px;
    opacity: 0.16;
    transition: opacity ease 0.2s;
    position: relative;
    cursor: pointer;

    &::before {
      width: 2px;
      height: 100%;
      content: ' ';
      background-color: var(--app-accent);
      border-radius: 2px;
      position: absolute;
      top: 0;
      left: 10px;
    }

    &:hover {
      opacity: 0.45;
    }
  }
}

/* 深色模式样式 */
:global(.dark) .menu-wrapper {
  background: var(--app-surface) !important;
  border: 1px solid var(--app-border) !important;
  box-shadow: inset 0 0 0 1px var(--app-border) !important;
}

:global(.dark) .toggle-bar::before {
  background-color: var(--app-accent) !important;
}

:global(.dark) .menu ::v-deep(.n-menu-item-content::before) {
  background-color: rgba(53, 201, 160, 0.1) !important;
}

:global(.dark) .menu-chevron {
  background: var(--app-surface-2) !important;
  box-shadow: inset 0 0 0 1px var(--app-border) !important;
}
</style>
