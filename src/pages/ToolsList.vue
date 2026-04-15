<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHead } from '@vueuse/head';
import { NIcon, NInput } from 'naive-ui';
import { IconSearch, IconTool } from '@tabler/icons-vue';
import ToolCard from '../components/ToolCard.vue';
import { toolsByCategory, tools } from '@/tools';

useHead({ title: `所有工具 - Tools For You` });

const searchQuery = ref('');

// 所有工具按分类分组
const categories = computed(() => {
  return toolsByCategory.map(cat => ({
    name: cat.name,
    tools: cat.components
  }));
});

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
  <div class="tools-list-page">
    <!-- Tool Header (like tool-detail layout) -->
    <div class="tool-header">
      <div class="tool-info">
        <h1 class="tool-title">🛠️ 所有工具</h1>
        <p class="tool-description">共 {{ tools.length }} 个实用工具，按分类分组显示</p>
      </div>
    </div>

    <!-- Search Box -->
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

    <!-- Search Results -->
    <div v-if="filteredTools" class="search-results">
      <h2 class="section-title">搜索结果 ({{ filteredTools.length }})</h2>
      <div class="tools-grid">
        <ToolCard
          v-for="tool in filteredTools"
          :key="tool.path"
          :tool="tool"
        />
      </div>
    </div>

    <!-- Categories -->
    <div v-else class="categories-container">
      <div
        v-for="category in categories"
        :key="category.name"
        class="category-section"
      >
        <h2 class="section-title">{{ category.name }} <span class="count">({{ category.tools.length }})</span></h2>
        <div class="tools-grid">
          <ToolCard
            v-for="tool in category.tools"
            :key="tool.path"
            :tool="tool"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.tools-list-page {
  min-height: 100vh;
  background: var(--app-bg);
  padding: 32px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Tool Header - same style as tool-detail layout */
.tool-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--app-border);
}

.tool-info {
  flex: 1;
}

.tool-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0;
}

.tool-description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--app-muted);
  line-height: 1.5;
}

/* Search Section */
.search-section {
  margin-bottom: 32px;
}

.search-input {
  max-width: 500px;
}

/* Section Title */
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--app-accent);
  display: inline-block;
}

.count {
  color: var(--app-muted);
  font-size: 14px;
  font-weight: 400;
}

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
}

.category-section {
  margin-bottom: 48px;
}

/* Responsive */
@media (max-width: 768px) {
  .tools-list-page {
    padding: 16px;
  }
  
  .tool-header {
    margin-bottom: 16px;
    padding-bottom: 16px;
  }
  
  .tool-title {
    font-size: 22px;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
