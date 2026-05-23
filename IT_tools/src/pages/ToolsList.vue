<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHead } from '@vueuse/head';
import { NIcon } from 'naive-ui';
import { IconSearch } from '@tabler/icons-vue';
import ToolCard from '../components/ToolCard.vue';
import { toolsByCategory, tools } from '@/tools';

useHead({ title: `所有工具 - Tools For You` });

const searchQuery = ref('');

// 搜索过滤
const filteredTools = computed(() => {
  if (!searchQuery.value.trim()) return null;
  const query = searchQuery.value.toLowerCase();
  return tools.filter(t => 
    t.name.toLowerCase().includes(query) || 
    t.description?.toLowerCase().includes(query)
  );
});
</script>

<template>
  <div class="pt-50px">
    <div class="grid-wrapper">
      <!-- 搜索框 -->
      <div class="search-section">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索工具..."
          size="large"
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon :component="IconSearch" />
          </template>
        </n-input>
      </div>

      <!-- 搜索结果 -->
      <div v-if="filteredTools">
        <h3 class="mb-5px mt-25px text-neutral-400 font-500">
          搜索结果 ({{ filteredTools.length }})
        </h3>
        <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
          <ToolCard
            v-for="tool in filteredTools"
            :key="tool.path"
            :tool="tool"
          />
        </div>
      </div>

      <!-- 分类显示 -->
      <div v-else>
        <div
          v-for="category in toolsByCategory"
          :key="category.name"
        >
          <h3 class="mb-5px mt-25px text-neutral-400 font-500">
            {{ category.name }} ({{ category.components.length }})
          </h3>
          <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
            <ToolCard
              v-for="tool in category.components"
              :key="tool.path"
              :tool="tool"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.search-section {
  margin-bottom: 24px;
}

.search-input {
  max-width: 400px;
}

.grid-wrapper {
  position: relative;
  padding: 24px;
  border-radius: 24px;
  background: var(--app-surface-2);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
}

.grid-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(420px 200px at 90% 0%, rgba(30, 139, 119, 0.12), transparent 60%);
  opacity: 0.8;
  pointer-events: none;
}

.grid-wrapper > * {
  position: relative;
  z-index: 1;
}

.grid-wrapper h3 {
  color: var(--app-muted) !important;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 700px) {
  .grid-wrapper {
    padding: 16px;
    border-radius: 18px;
  }
}
</style>
