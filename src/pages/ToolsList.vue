<script setup lang="ts">
import { ref, computed } from 'vue';
import { useHead } from '@vueuse/head';
import { NInput, NIcon, NTag } from 'naive-ui';
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
    <!-- Header -->
    <div class="tools-header">
      <h1>🛠️ 所有工具</h1>
      <p>共 {{ tools.length }} 个实用工具</p>
      
      <!-- Search -->
      <div class="search-box">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索工具..."
          size="large"
          clearable
        >
          <template #prefix>
            <n-icon :component="IconSearch" />
          </template>
        </n-input>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="filteredTools" class="search-results">
      <h2>搜索结果 ({{ filteredTools.length }})</h2>
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
        <h2>{{ category.name }} <span class="count">({{ category.tools.length }})</span></h2>
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

<style scoped>
.tools-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.tools-header {
  text-align: center;
  margin-bottom: 32px;
}

.tools-header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.tools-header p {
  color: #888;
  margin-bottom: 24px;
}

.search-box {
  max-width: 500px;
  margin: 0 auto;
}

.search-results h2,
.category-section h2 {
  font-size: 1.25rem;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
}

.count {
  color: #888;
  font-size: 0.9rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.category-section {
  margin-bottom: 40px;
}
</style>
