<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHead } from '@vueuse/head';
import { NInput, NIcon, NButton, NTag } from 'naive-ui';
import { IconSearch, IconTool, IconArrowRight } from '@tabler/icons-vue';
import ToolCard from '../components/ToolCard.vue';
import AIChat from '../components/AIChat.vue';
import { toolsByCategory, tools } from '@/tools';

// 根据侧边栏分类映射到主页分类 - 完整的10个分类
const categoryMapping = computed(() => ({
  'Crypto': { id: 1, name: '🔐 ' + '安全加密', slug: 'crypto', icon: '🔐', color: '#DDA0DD', description: 'Hash生成、加密解密、密码工具' },
  'Converter': { id: 2, name: '🔄 ' + '格式转换', slug: 'converter', icon: '🔄', color: '#4ECDC4', description: 'JSON/YAML/XML转换、编码转换' },
  'Web': { id: 3, name: '🌐 ' + 'Web工具', slug: 'web', icon: '🌐', color: '#45B7D1', description: 'URL编解码、JWT解析、HTTP状态码' },
  'Development': { id: 4, name: '👨‍💻 ' + '开发工具', slug: 'dev', icon: '👨‍💻', color: '#FF6B6B', description: 'JSON查看、正则测试、Git备忘录' },
  'Network': { id: 5, name: '📡 ' + '网络工具', slug: 'network', icon: '📡', color: '#F7DC6F', description: 'IP计算、子网划分、MAC查询' },
  'Text': { id: 6, name: '📝 ' + '文本工具', slug: 'text', icon: '📝', color: '#96CEB4', description: '文本统计、差异对比、表情选择' },
  'Images and videos': { id: 7, name: '🖼️ ' + '图像视频', slug: 'media', icon: '🖼️', color: '#FF9F43', description: '二维码生成、SVG占位图' },
  'Math': { id: 8, name: '🔢 ' + '数学计算', slug: 'math', icon: '🔢', color: '#A29BFE', description: '数学表达式、百分比计算' },
  'Measurement': { id: 9, name: '⏱️ ' + '测量工具', slug: 'measurement', icon: '⏱️', color: '#74B9FF', description: '计时器、温度转换、性能测试' },
  'Data': { id: 10, name: '📊 ' + '数据工具', slug: 'data', icon: '📊', color: '#A29BFE', description: '电话号码解析、IBAN验证' },
}));

// 显示所有分类，每个分类只显示3个工具
const categories = computed(() => {
  return toolsByCategory
    .map(cat => {
      const mapping = categoryMapping.value[cat.name] || {
        id: 0,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        icon: '🔧',
        color: '#666',
        description: `${cat.name}相关工具`
      };
      
      return {
        ...mapping,
        count: cat.components.length,
        tools: cat.components.slice(0, 3) // 每个分类只显示3个工具
      };
    })
    .filter(Boolean);
});

// 热门工具（精简到4个）
const popularTools = computed(() => {
  const popular = [
    'json-viewer',
    'base64-string-converter',
    'hash-text',
    'uuid-generator'
  ];
  return popular.map(slug => tools.find(t => t.path === `/${slug}`)).filter(Boolean);
});

const searchQuery = ref('');
const isLoading = ref(false);

useHead({
  title: computed(() => `Tools For You - ${'为你量身定制'}`)
});

// Search function
function handleSearch() {
  if (!searchQuery.value.trim()) return;
  
  const query = searchQuery.value.toLowerCase();
  const found = tools.find(
    t => t.name.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query)
  );
  
  if (found) {
    window.location.href = found.path;
  }
}

// Navigate to category
function goToCategory(slug: string) {
  // 跳转到分类列表页
  window.location.href = `/category/${slug}`;
}

// Get tool name with i18n
function getToolName(tool: any) {
  return tool.name;
}
</script>

<template>
  <div class="home-page">
    <!-- Hero Section - 压缩版 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">为你量身定制</span>
          <span class="subtitle">收录 {{ tools.length }} 个实用工具</span>
        </h1>
        
        <!-- Search Bar -->
        <div class="search-container">
          <n-input
            v-model:value="searchQuery"
            size="large"
            :placeholder="'搜索'"
            @keyup.enter="handleSearch"
            clearable
          >
            <template #prefix>
              <n-icon :component="IconSearch" />
            </template>
          </n-input>
          <n-button type="primary" size="large" @click="handleSearch">
            {{ '搜索' }}
          </n-button>
        </div>

        <!-- Quick Tags - 精简到4个 -->
        <div class="quick-tags">
          <n-tag
            v-for="tag in ['JSON', 'Base64', 'QR Code', 'Regex']"
            :key="tag"
            :bordered="false"
            round
            class="quick-tag"
            @click="searchQuery = tag; handleSearch()"
          >
            {{ tag }}
          </n-tag>
        </div>
      </div>
    </section>

    <!-- Categories Section - 紧凑网格 -->
    <section class="section categories-section">
      <div class="section-header">
        <h2>
          <n-icon :component="IconTool" />
          {{ '全部工具' }}
        </h2>
      </div>
      
      <div class="categories-grid-compact">
        <router-link
          v-for="cat in categories"
          :key="cat.slug"
          :to="`/category/${cat.slug}`"
          class="category-card-compact"
          :style="{ '--cat-color': cat.color }"
        >
          <div class="cat-header">
            <span class="cat-icon">{{ cat.icon }}</span>
            <div class="cat-info">
              <h3>{{ cat.name }}</h3>
              <span class="cat-count">{{ cat.count }} 个工具</span>
            </div>
          </div>
          
          <!-- 工具列表 - 紧凑样式 -->
          <div class="cat-tools" v-if="cat.tools && cat.tools.length">
            <span
              v-for="tool in cat.tools"
              :key="tool.path"
              class="cat-tool-item"
              @click.prevent.stop
            >
            {{ getToolName(tool) }}
            </span>
          </div>
          
          <div class="cat-link">
            {{ '全部工具' }} →
          </div>
        </router-link>
      </div>
    </section>

    <!-- Popular Tools - 精简版 -->
    <section class="section popular-section">
      <div class="section-header">
        <h2>🔥 {{ '最新工具' }}</h2>
      </div>
      
      <div class="tools-grid">
        <ToolCard
          v-for="tool in popularTools"
          :key="tool.path"
          :tool="tool"
        />
      </div>
    </section>

    <!-- AI CTA Section - 精简版 -->
    <section class="section ai-cta-compact">
      <div class="ai-cta-content">
        <div class="ai-icon">🤖</div>
        <h3>{{ '找不到合适的工具？' }}</h3>
        <p>{{ '告诉 AI 你需要什么，它会帮你找到最合适的工具' }}</p>
        <p class="ai-hint">{{ '点击右下角的 💬 按钮开始对话' }}</p>
      </div>
    </section>

    <!-- Footer - 精简版 -->
    <footer class="home-footer-compact">
      <p>{{ '© 2026 Tools For You' }} · <router-link to="/about">{{ '关于 Tools For You' }}</router-link> · <router-link to="/contact">{{ '联系我们' }}</router-link></p>
    </footer>
    <!-- AI Chat Component -->
    <AIChat api-base-url="http://localhost:8000/api" />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* Hero - 压缩版 */
.hero {
  position: relative;
  padding: 40px 24px 50px;
  text-align: center;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-2) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto;
}

.hero-title {
  margin-bottom: 20px;
}

.gradient-text {
  display: block;
  font-size: 40px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--app-accent) 0%, #35c9a0 50%, #FFD700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  display: block;
  font-size: 16px;
  color: var(--app-muted);
  margin-top: 8px;
  font-weight: 400;
}

.search-container {
  display: flex;
  gap: 12px;
  max-width: 550px;
  margin: 0 auto;
}

.search-container .n-input {
  flex: 1;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 14px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.quick-tag:hover {
  background: var(--app-accent);
  color: white;
}

/* Sections */
.section {
  padding: 32px 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text);
}

/* Categories Grid - 紧凑版 */
.categories-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.category-card-compact {
  padding: 16px;
  background: var(--app-surface);
  border-radius: 12px;
  border: 1px solid var(--app-border);
  transition: all 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  display: block;
}

.category-card-compact:hover {
  border-color: var(--cat-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.cat-icon {
  font-size: 32px;
}

.cat-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--app-text);
}

.cat-count {
  font-size: 11px;
  color: var(--app-muted);
}

.cat-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 10px 0;
}

.cat-tool-item {
  font-size: 11px;
  padding: 3px 6px;
  background: var(--app-surface-2);
  border-radius: 4px;
  color: var(--app-text);
  text-decoration: none;
  transition: all 0.2s;
}

.cat-tool-item:hover {
  background: var(--app-accent);
  color: white;
}

.cat-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--app-accent);
  text-decoration: none;
  margin-top: 6px;
}

.cat-link:hover {
  text-decoration: underline;
}

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

/* AI CTA - 精简版 */
.ai-cta-compact {
  background: var(--app-surface-2);
  border-radius: 16px;
  margin: 24px auto;
  padding: 32px 24px;
  text-align: center;
}

.ai-cta-content .ai-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.ai-cta-content h3 {
  font-size: 20px;
  margin: 0 0 8px;
  color: var(--app-text);
}

.ai-cta-content p {
  color: var(--app-muted);
  margin: 0;
  font-size: 14px;
}

.ai-hint {
  font-size: 12px !important;
  color: var(--app-accent) !important;
  font-weight: 500;
  margin-top: 12px !important;
}

/* Footer - 精简版 */
.home-footer-compact {
  text-align: center;
  padding: 20px;
  color: var(--app-muted);
  font-size: 13px;
}

.home-footer-compact a {
  color: var(--app-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.home-footer-compact a:hover {
  color: var(--app-accent);
}

/* Responsive */
@media (max-width: 768px) {
  .gradient-text {
    font-size: 32px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  .search-container {
    flex-direction: column;
  }
  
  .categories-grid-compact {
    grid-template-columns: 1fr;
  }
  
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Dark mode */
.dark .hero {
  background: linear-gradient(180deg, var(--app-bg) 0%, var(--app-bg-alt) 100%);
}

.dark .category-card-compact:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}
</style>
