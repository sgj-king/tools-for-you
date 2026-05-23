<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useClipboard } from '@vueuse/core';
import { NButton, NButtonGroup, NInput, NSplit, NTooltip, NTag, NScrollbar, NSpace, NSelect, NIcon } from 'naive-ui';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const { copy, copied } = useClipboard();

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// 编辑器状态
const markdownContent = ref(`# Welcome to Markdown Editor

这是一个**实时预览**的 Markdown 编辑器。

## 功能特点

- 📝 实时预览
- 🎨 语法高亮
- 📋 一键复制
- 💾 本地保存
- 🌙 暗色主题

## 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

## 表格支持

| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 粗体 | ✅ |
| 斜体 | ✅ |
| 代码 | ✅ |

> 💡 提示：支持 GitHub Flavored Markdown (GFM)

[了解更多](https://github.com)
`);

const splitSize = ref(0.5);
const previewHtml = ref('');

// 统计信息
const stats = computed(() => {
  const text = markdownContent.value;
  return {
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text.split('\n').length,
  };
});

// 渲染 Markdown
function renderMarkdown() {
  try {
    previewHtml.value = marked.parse(markdownContent.value) as string;
    // 代码高亮
    setTimeout(() => {
      document.querySelectorAll('.preview-content pre code').forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }, 0);
  } catch (e) {
    previewHtml.value = '<p style="color: red;">渲染错误</p>';
  }
}

// 复制 HTML
function copyHtml() {
  copy(previewHtml.value);
}

// 复制 Markdown
function copyMarkdown() {
  copy(markdownContent.value);
}

// 清空
function clearContent() {
  markdownContent.value = '';
}

// 插入模板
function insertTemplate(type: string) {
  const templates: Record<string, string> = {
    heading: '\n## 标题\n',
    bold: '**粗体文本**',
    italic: '*斜体文本*',
    code: '`代码`',
    codeblock: '\n```\n代码块\n```\n',
    link: '[链接文本](https://example.com)',
    image: '![图片描述](https://example.com/image.png)',
    list: '\n- 列表项\n',
    quote: '\n> 引用文本\n',
    table: '\n| 列1 | 列2 |\n|-----|-----|\n| 内容 | 内容 |\n',
    hr: '\n---\n',
  };
  markdownContent.value += templates[type] || '';
}

// 保存到本地存储
function saveToLocal() {
  localStorage.setItem('markdownEditorContent', markdownContent.value);
}

// 从本地存储加载
function loadFromLocal() {
  const saved = localStorage.getItem('markdownEditorContent');
  if (saved) {
    markdownContent.value = saved;
  }
}

// 监听内容变化，自动保存和渲染
watch(markdownContent, () => {
  renderMarkdown();
  saveToLocal();
}, { immediate: true });

onMounted(() => {
  loadFromLocal();
  renderMarkdown();
});
</script>

<template>
  <div class="markdown-editor-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-button-group size="small">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('heading')">
                H
              </n-button>
            </template>
            标题
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('bold')">
                <strong>B</strong>
              </n-button>
            </template>
            粗体
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('italic')">
                <em>I</em>
              </n-button>
            </template>
            斜体
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('code')">
                &lt;/&gt;
              </n-button>
            </template>
            行内代码
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('codeblock')">
                {  }
              </n-button>
            </template>
            代码块
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('link')">
                🔗
              </n-button>
            </template>
            链接
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('image')">
                🖼️
              </n-button>
            </template>
            图片
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('list')">
                📋
              </n-button>
            </template>
            列表
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('quote')">
                💬
              </n-button>
            </template>
            引用
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="insertTemplate('table')">
                📊
              </n-button>
            </template>
            表格
          </n-tooltip>
        </n-button-group>
      </div>
      <div class="toolbar-right">
        <n-button-group size="small">
          <n-button @click="copyMarkdown">
            {{ copied ? '已复制' : '复制 Markdown' }}
          </n-button>
          <n-button @click="copyHtml">
            复制 HTML
          </n-button>
          <n-button @click="clearContent" type="warning">
            清空
          </n-button>
        </n-button-group>
      </div>
    </div>

    <!-- 统计栏 -->
    <div class="stats-bar">
      <n-space>
        <n-tag size="small" type="info">
          字符: {{ stats.chars }}
        </n-tag>
        <n-tag size="small" type="info">
          词数: {{ stats.words }}
        </n-tag>
        <n-tag size="small" type="info">
          行数: {{ stats.lines }}
        </n-tag>
      </n-space>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-main">
      <n-split
        v-model:size="splitSize"
        :min="0.2"
        :max="0.8"
        direction="horizontal"
        class="editor-split"
      >
        <!-- 左侧编辑区 -->
        <template #1>
          <div class="editor-pane">
            <div class="pane-header">
              <span>📝 Markdown</span>
            </div>
            <n-input
              v-model:value="markdownContent"
              type="textarea"
              placeholder="在此输入 Markdown 内容..."
              class="editor-textarea"
              :autosize="false"
            />
          </div>
        </template>
        <!-- 右侧预览区 -->
        <template #2>
          <div class="preview-pane">
            <div class="pane-header">
              <span>👁️ Preview</span>
            </div>
            <n-scrollbar class="preview-scrollbar">
              <div class="preview-content" v-html="previewHtml"></div>
            </n-scrollbar>
          </div>
        </template>
      </n-split>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--n-color);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.stats-bar {
  display: flex;
  padding: 4px 12px;
}

.editor-main {
  flex: 1;
  min-height: 400px;
  display: flex;
  overflow: hidden;
}

.editor-split {
  width: 100%;
  height: 100%;
}

.editor-pane,
.preview-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background: var(--n-color);
}

.pane-header {
  padding: 10px 16px;
  background: var(--n-color-hover);
  border-bottom: 1px solid var(--n-border-color);
  font-weight: 500;
  font-size: 14px;
}

.editor-textarea {
  flex: 1;
  height: 100%;
}

.editor-textarea :deep(textarea) {
  height: 100% !important;
  resize: none;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 16px;
}

.preview-scrollbar {
  flex: 1;
  height: 100%;
}

.preview-content {
  padding: 20px;
  line-height: 1.8;
  color: var(--n-text-color);
}

.preview-content :deep(h1) {
  font-size: 2em;
  font-weight: 600;
  margin: 0.67em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--n-border-color);
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.83em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--n-border-color);
}

.preview-content :deep(h3) {
  font-size: 1.17em;
  font-weight: 600;
  margin: 1em 0;
}

.preview-content :deep(h4) {
  font-size: 1em;
  font-weight: 600;
  margin: 1.33em 0;
}

.preview-content :deep(p) {
  margin: 1em 0;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.preview-content :deep(li) {
  margin: 0.5em 0;
}

.preview-content :deep(code) {
  background: var(--n-color-hover);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
}

.preview-content :deep(pre) {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
}

.preview-content :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid var(--n-border-color);
  padding-left: 1em;
  margin: 1em 0;
  color: var(--n-text-color-3);
}

.preview-content :deep(a) {
  color: #18a058;
  text-decoration: none;
}

.preview-content :deep(a:hover) {
  text-decoration: underline;
}

.preview-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid var(--n-border-color);
  padding: 10px 14px;
  text-align: left;
}

.preview-content :deep(th) {
  background: var(--n-color-hover);
  font-weight: 600;
}

.preview-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--n-border-color);
  margin: 2em 0;
}

.preview-content :deep(strong) {
  font-weight: 600;
}

.preview-content :deep(em) {
  font-style: italic;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
  }
  
  .editor-main {
    min-height: 300px;
  }
}
</style>
