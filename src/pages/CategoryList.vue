<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@vueuse/head';
import { NIcon, NButton } from 'naive-ui';
import { IconArrowLeft, IconTool } from '@tabler/icons-vue';
import { toolsByCategory } from '@/tools';

const route = useRoute();
const router = useRouter();

// 从URL参数获取分类名称
const categorySlug = computed(() => route.params.slug as string);

// 分类映射
const categoryMapping: Record<string, { name: string; icon: string; color: string; description: string }> = {
  'crypto': { name: 'Crypto', icon: '🔐', color: '#DDA0DD', description: 'Hash生成、加密解密、密码工具' },
  'converter': { name: 'Converter', icon: '🔄', color: '#4ECDC4', description: 'JSON/YAML/XML转换、编码转换' },
  'web': { name: 'Web', icon: '🌐', color: '#45B7D1', description: 'URL编解码、JWT解析、HTTP状态码' },
  'dev': { name: 'Development', icon: '👨‍💻', color: '#FF6B6B', description: 'JSON查看、正则测试、Git备忘录' },
  'network': { name: 'Network', icon: '📡', color: '#F7DC6F', description: 'IP计算、子网划分、MAC查询' },
  'text': { name: 'Text', icon: '📝', color: '#96CEB4', description: '文本统计、差异对比、表情选择' },
  'media': { name: 'Images and videos', icon: '🖼️', color: '#FF9F43', description: '二维码生成、SVG占位图' },
  'math': { name: 'Math', icon: '🔢', color: '#A29BFE', description: '数学表达式、百分比计算' },
  'measurement': { name: 'Measurement', icon: '⏱️', color: '#74B9FF', description: '计时器、温度转换' },
  'data': { name: 'Data', icon: '📊', color: '#A29BFE', description: '电话号码解析、IBAN验证' },
};

// 获取当前分类信息
const currentCategory = computed(() => {
  const mapping = Object.entries(categoryMapping).find(([slug]) => slug === categorySlug.value);
  if (!mapping) return null;
  
  const [slug, info] = mapping;
  const category = toolsByCategory.find(c => c.name === info.name);
  
  return {
    slug,
    ...info,
    tools: category?.components || []
  };
});

// 设置页面标题
useHead({
  title: currentCategory.value ? `${currentCategory.value.icon} ${currentCategory.value.name} - Tools For You` : '分类 - Tools For You'
});

// 返回首页
function goBack() {
  router.push('/');
}
</script>

<template>
  <div class="category-list-page">
    <!-- Header -->
    <div class="category-header">
      <n-button text @click="goBack" class="back-button">
        <template #icon>
          <n-icon :component="IconArrowLeft" />
        </template>
        返回首页
      </n-button>
      
      <div class="category-title-section" v-if="currentCategory">
        <div class="category-icon" :style="{ backgroundColor: currentCategory.color + '20' }">
          {{ currentCategory.icon }}
        </div>
        <div class="category-info">
          <h1>{{ currentCategory.name }}</h1>
          <p class="category-description">{{ currentCategory.description }}</p>
          <p class="tool-count">共 {{ currentCategory.tools.length }} 个工具</p>
        </div>
      </div>
    </div>

    <!-- Tools Grid -->
    <div class="tools-section" v-if="currentCategory && currentCategory.tools.length">
      <div class="tools-grid">
        <router-link
          v-for="tool in currentCategory.tools"
          :key="tool.path"
          :to="tool.path"
          class="tool-card"
        >
          <div class="tool-icon">
            <n-icon :component="IconTool" size="32" />
          </div>
          <div class="tool-info">
            <h3>{{ tool.name }}</h3>
            <p class="tool-description">{{ tool.description || '实用工具' }}</p>
          </div>
          <div class="tool-arrow">→</div>
        </router-link>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-else>
      <div class="empty-icon">🔍</div>
      <h2>未找到该分类</h2>
      <p>该分类可能已被移除或URL错误</p>
      <n-button type="primary" @click="goBack">返回首页</n-button>
    </div>
  </div>
</template>

<style scoped>
.category-list-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.category-header {
  margin-bottom: 32px;
}

.back-button {
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--app-muted);
  transition: color 0.2s;
}

.back-button:hover {
  color: var(--app-accent);
}

.category-title-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--app-surface);
  border-radius: 16px;
  border: 1px solid var(--app-border);
}

.category-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  border-radius: 16px;
}

.category-info h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--app-text);
}

.category-description {
  color: var(--app-muted);
  font-size: 15px;
  margin: 0 0 8px;
}

.tool-count {
  color: var(--app-accent);
  font-size: 13px;
  font-weight: 500;
  margin: 0;
}

/* Tools Grid */
.tools-section {
  margin-top: 24px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--app-surface);
  border-radius: 12px;
  border: 1px solid var(--app-border);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tool-card:hover {
  border-color: var(--app-accent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.tool-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-surface-2);
  border-radius: 12px;
  color: var(--app-accent);
}

.tool-info {
  flex: 1;
  min-width: 0; /* 关键：允许 flex 子元素收缩 */
  overflow: hidden; /* 防止内容溢出 */
}

.tool-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-description {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block; /* 确保作为块级元素 */
}

.tool-arrow {
  font-size: 20px;
  color: var(--app-muted);
  transition: transform 0.2s;
}

.tool-card:hover .tool-arrow {
  transform: translateX(4px);
  color: var(--app-accent);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 24px;
  margin: 0 0 8px;
  color: var(--app-text);
}

.empty-state p {
  color: var(--app-muted);
  margin: 0 0 24px;
}

/* Responsive */
@media (max-width: 768px) {
  .category-title-section {
    flex-direction: column;
    text-align: center;
  }
  
  .category-info h1 {
    font-size: 24px;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .tool-card {
    padding: 16px;
  }
}

/* Dark mode */
.dark .tool-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
</style>
