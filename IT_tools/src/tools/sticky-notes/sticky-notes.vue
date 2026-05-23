<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useStorage } from '@vueuse/core';
import { NButton, NInput, NModal, NSelect, NIcon, NTag, NPopconfirm, NTabs, NTabPane, NScrollbar } from 'naive-ui';
import { Plus, Search, Trash, Edit, Copy, Download, SortAscending, GridOutline, Close, Checkmark, Pin, Archive, ArchiveOutline } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '便签墙',
    subtitle: '快捷记录灵感与待办，多彩便签随心贴',
    addNote: '新建便签',
    editNote: '编辑便签',
    search: '搜索便签...',
    content: '内容',
    contentPlaceholder: '写点什么...',
    title_: '标题',
    titlePlaceholder: '便签标题（可选）',
    color: '颜色',
    category: '分类',
    categoryPlaceholder: '输入分类...',
    pin: '置顶',
    unpin: '取消置顶',
    archive: '归档',
    unarchive: '取消归档',
    delete: '删除',
    deleteConfirm: '确定删除这条便签吗？',
    copy: '复制内容',
    copied: '已复制！',
    save: '保存',
    cancel: '取消',
    all: '全部',
    pinned: '已置顶',
    archived: '已归档',
    noNotes: '还没有便签，点击「新建便签」开始记录吧 ✨',
    noArchived: '没有已归档的便签',
    noSearchResult: '没有找到匹配的便签',
    exportAll: '导出全部',
    clearAll: '清除全部',
    clearAllConfirm: '确定清除所有便签吗？此操作不可恢复！',
    totalNotes: '便签总数',
    todayNew: '今日新增',
    categories: '分类',
    work: '工作',
    study: '学习',
    life: '生活',
    idea: '灵感',
    todo: '待办',
    uncategorized: '未分类',
    createdAt: '创建于',
    editedAt: '编辑于',
    sortBy: '排序',
    sortNewest: '最新优先',
    sortOldest: '最早优先',
    sortAlpha: '按标题',
    emptyTitle: '无标题',
  },
  en: {
    title: 'Sticky Notes',
    subtitle: 'Quick notes & ideas, colorful sticky board for your thoughts',
    addNote: 'New Note',
    editNote: 'Edit Note',
    search: 'Search notes...',
    content: 'Content',
    contentPlaceholder: 'Write something...',
    title_: 'Title',
    titlePlaceholder: 'Note title (optional)',
    color: 'Color',
    category: 'Category',
    categoryPlaceholder: 'Enter category...',
    pin: 'Pin',
    unpin: 'Unpin',
    archive: 'Archive',
    unarchive: 'Unarchive',
    delete: 'Delete',
    deleteConfirm: 'Delete this note?',
    copy: 'Copy Content',
    copied: 'Copied!',
    save: 'Save',
    cancel: 'Cancel',
    all: 'All',
    pinned: 'Pinned',
    archived: 'Archived',
    noNotes: 'No notes yet. Click "New Note" to start! ✨',
    noArchived: 'No archived notes',
    noSearchResult: 'No matching notes found',
    exportAll: 'Export All',
    clearAll: 'Clear All',
    clearAllConfirm: 'Clear all notes? This cannot be undone!',
    totalNotes: 'Total Notes',
    todayNew: 'New Today',
    categories: 'Categories',
    work: 'Work',
    study: 'Study',
    life: 'Life',
    idea: 'Idea',
    todo: 'Todo',
    uncategorized: 'Uncategorized',
    createdAt: 'Created',
    editedAt: 'Edited',
    sortBy: 'Sort',
    sortNewest: 'Newest First',
    sortOldest: 'Oldest First',
    sortAlpha: 'By Title',
    emptyTitle: 'Untitled',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Types =====================
interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string;
  category: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===================== State =====================
const notes = useStorage<StickyNote[]>('sticky-notes-items', []);
const searchQuery = ref('');
const activeTab = ref('all');
const sortBy = ref<'newest' | 'oldest' | 'alpha'>('newest');
const showModal = ref(false);
const editingId = ref<string | null>(null);
const expandedNoteId = ref<string | null>(null);

// Form
const formTitle = ref('');
const formContent = ref('');
const formColor = ref('#FBBF24');
const formCategory = ref('');

// ===================== Color palette =====================
const noteColors = [
  { value: '#FBBF24', label: '🌻 向日葵', labelEn: '🌻 Sunflower' },
  { value: '#F87171', label: '🌹 玫瑰', labelEn: '🌹 Rose' },
  { value: '#34D399', label: '🌿 薄荷', labelEn: '🌿 Mint' },
  { value: '#60A5FA', label: '💎 天蓝', labelEn: '💎 Sky' },
  { value: '#A78BFA', label: '🔮 紫晶', labelEn: '🔮 Amethyst' },
  { value: '#FB923C', label: '🍊 橘子', labelEn: '🍊 Orange' },
  { value: '#F472B6', label: '🌸 樱花', labelEn: '🌸 Sakura' },
  { value: '#2DD4BF', label: '🦚 孔雀', labelEn: '🦚 Teal' },
  { value: '#818CF8', label: '🍆 茄子', labelEn: '🍆 Indigo' },
  { value: '#CBD5E1', label: '☁️ 银灰', labelEn: '☁️ Silver' },
];

// ===================== Category options =====================
const categoryOptions = computed(() => {
  const cats = new Set<string>();
  notes.value.forEach(n => { if (n.category) cats.add(n.category); });
  const defaults = lang.value === 'zh'
    ? ['工作', '学习', '生活', '灵感', '待办']
    : ['Work', 'Study', 'Life', 'Idea', 'Todo'];
  const all = [...new Set([...defaults, ...cats])];
  return all.map(c => ({ label: c, value: c }));
});

// ===================== Computed =====================
const filteredNotes = computed(() => {
  let list = notes.value;

  // Tab filter
  if (activeTab.value === 'pinned') {
    list = list.filter(n => n.pinned && !n.archived);
  } else if (activeTab.value === 'archived') {
    list = list.filter(n => n.archived);
  } else {
    list = list.filter(n => !n.archived);
  }

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q)
    );
  }

  // Sort: pinned first, then by sortBy
  list = [...list].sort((a, b) => {
    // Pinned first (within non-archived)
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    // Then by sort
    if (sortBy.value === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy.value === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      const ta = a.title || a.content.slice(0, 20);
      const tb = b.title || b.content.slice(0, 20);
      return ta.localeCompare(tb);
    }
  });

  return list;
});

const stats = computed(() => {
  const total = notes.value.filter(n => !n.archived).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayNew = notes.value.filter(n => n.createdAt.startsWith(today)).length;
  const pinnedCount = notes.value.filter(n => n.pinned && !n.archived).length;
  const archivedCount = notes.value.filter(n => n.archived).length;
  return { total, todayNew, pinnedCount, archivedCount };
});

const usedCategories = computed(() => {
  const cats = new Set<string>();
  notes.value.forEach(n => { if (n.category && !n.archived) cats.add(n.category); });
  return [...cats];
});

// ===================== Actions =====================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (lang.value === 'zh') {
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } else {
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}

function openAddModal() {
  editingId.value = null;
  formTitle.value = '';
  formContent.value = '';
  formColor.value = '#FBBF24';
  formCategory.value = '';
  showModal.value = true;
}

function openEditModal(note: StickyNote) {
  editingId.value = note.id;
  formTitle.value = note.title;
  formContent.value = note.content;
  formColor.value = note.color;
  formCategory.value = note.category;
  showModal.value = true;
}

function saveNote() {
  if (!formContent.value.trim() && !formTitle.value.trim()) return;

  const now = new Date().toISOString();

  if (editingId.value) {
    const idx = notes.value.findIndex(n => n.id === editingId.value);
    if (idx !== -1) {
      notes.value[idx] = {
        ...notes.value[idx],
        title: formTitle.value.trim(),
        content: formContent.value.trim(),
        color: formColor.value,
        category: formCategory.value,
        updatedAt: now,
      };
    }
  } else {
    notes.value.unshift({
      id: generateId(),
      title: formTitle.value.trim(),
      content: formContent.value.trim(),
      color: formColor.value,
      category: formCategory.value,
      pinned: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  showModal.value = false;
}

function deleteNote(id: string) {
  notes.value = notes.value.filter(n => n.id !== id);
  if (expandedNoteId.value === id) expandedNoteId.value = null;
}

function togglePin(note: StickyNote) {
  note.pinned = !note.pinned;
  note.updatedAt = new Date().toISOString();
}

function toggleArchive(note: StickyNote) {
  note.archived = !note.archived;
  note.updatedAt = new Date().toISOString();
}

async function copyContent(note: StickyNote) {
  const text = note.title ? `${note.title}\n${note.content}` : note.content;
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = note.id;
    setTimeout(() => { copiedId.value = null; }, 1500);
  } catch { /* fallback: ignore */ }
}

const copiedId = ref<string | null>(null);

function exportNotes() {
  const active = filteredNotes.value;
  if (!active.length) return;

  let text = '';
  active.forEach(n => {
    text += `${'='.repeat(40)}\n`;
    if (n.title) text += `[${n.title}]\n`;
    if (n.category) text += `#${n.category}  `;
    text += `${formatDate(n.createdAt)}\n`;
    text += `${'-'.repeat(20)}\n`;
    text += `${n.content}\n\n`;
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sticky-notes-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearAll() {
  notes.value = [];
}

function getColorStyle(color: string) {
  return {
    '--note-color': color,
    '--note-bg': `${color}22`,
    '--note-border': `${color}66`,
    '--note-accent': color,
  };
}

function toggleExpand(id: string) {
  expandedNoteId.value = expandedNoteId.value === id ? null : id;
}

// Auto-detect language
onMounted(() => {
  const nav = navigator.language || 'zh';
  lang.value = nav.startsWith('zh') ? 'zh' : 'en';
});
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 960px">

      <!-- Header Stats Bar -->
      <c-card mb-4>
        <div flex items-center justify-between flex-wrap gap-3>
          <div flex items-center gap-4>
            <div text-center>
              <div text-2xl font-bold>{{ stats.total }}</div>
              <div text-xs op-60>{{ lang === 'zh' ? '便签' : 'Notes' }}</div>
            </div>
            <div text-center>
              <div text-2xl font-bold text-amber-400>{{ stats.todayNew }}</div>
              <div text-xs op-60>{{ lang === 'zh' ? '今日' : 'Today' }}</div>
            </div>
            <div text-center>
              <div text-2xl font-bold text-blue-400>{{ stats.pinnedCount }}</div>
              <div text-xs op-60>{{ lang === 'zh' ? '置顶' : 'Pinned' }}</div>
            </div>
            <div text-center>
              <div text-2xl font-bold op-50>{{ stats.archivedCount }}</div>
              <div text-xs op-60>{{ lang === 'zh' ? '归档' : 'Arch.' }}</div>
            </div>
          </div>
          <div flex items-center gap-2>
            <n-button size="small" quaternary @click="exportNotes" :disabled="filteredNotes.length === 0">
              <template #icon><n-icon><Download /></n-icon></template>
              {{ t('exportAll').value }}
            </n-button>
            <n-popconfirm @positive-click="clearAll">
              <template #trigger>
                <n-button size="small" quaternary type="error" :disabled="notes.length === 0">
                  <template #icon><n-icon><Trash /></n-icon></template>
                  {{ t('clearAll').value }}
                </n-button>
              </template>
              {{ t('clearAllConfirm').value }}
            </n-popconfirm>
            <n-button type="primary" @click="openAddModal">
              <template #icon><n-icon><Plus /></n-icon></template>
              {{ t('addNote').value }}
            </n-button>
          </div>
        </div>
      </c-card>

      <!-- Search & Sort Bar -->
      <c-card mb-4>
        <div flex items-center gap-3 flex-wrap>
          <div flex-1 min-w-0>
            <n-input
              v-model:value="searchQuery"
              :placeholder="t('search').value"
              clearable
              size="large"
            >
              <template #prefix><n-icon><Search /></n-icon></template>
            </n-input>
          </div>
          <n-select
            v-model:value="sortBy"
            :options="[
              { label: t('sortNewest').value, value: 'newest' },
              { label: t('sortOldest').value, value: 'oldest' },
              { label: t('sortAlpha').value, value: 'alpha' },
            ]"
            size="large"
            style="width: 150px"
          />
        </div>

        <!-- Category quick filters -->
        <div v-if="usedCategories.length" mt-3 flex items-center gap-2 flex-wrap>
          <span text-sm op-60>{{ t('categories').value }}：</span>
          <n-tag
            v-for="cat in usedCategories"
            :key="cat"
            size="small"
            round
            :type="searchQuery === cat ? 'primary' : 'default'"
            style="cursor: pointer"
            @click="searchQuery = searchQuery === cat ? '' : cat"
          >
            {{ cat }}
          </n-tag>
        </div>
      </c-card>

      <!-- Tabs -->
      <n-tabs v-model:value="activeTab" type="segment" mb-4>
        <n-tab-pane :name="'all'" :tab="t('all').value" />
        <n-tab-pane :name="'pinned'" :tab="t('pinned').value" />
        <n-tab-pane :name="'archived'" :tab="t('archived').value" />
      </n-tabs>

      <!-- Notes Grid -->
      <div v-if="filteredNotes.length" class="sn-grid">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="sn-card"
          :style="getColorStyle(note.color)"
          :class="{ 'sn-card--expanded': expandedNoteId === note.id, 'sn-card--pinned': note.pinned }"
          @click="toggleExpand(note.id)"
        >
          <!-- Pin indicator -->
          <div v-if="note.pinned" class="sn-pin" :title="t('unpin').value">📌</div>

          <!-- Title -->
          <div v-if="note.title" class="sn-title" :style="{ color: note.color }">
            {{ note.title }}
          </div>

          <!-- Content -->
          <div class="sn-content" :class="{ 'sn-content--truncated': expandedNoteId !== note.id }">
            {{ note.content || t('emptyTitle').value }}
          </div>

          <!-- Category tag -->
          <div v-if="note.category" class="sn-category">
            <span class="sn-category-dot" :style="{ background: note.color }" />
            {{ note.category }}
          </div>

          <!-- Time -->
          <div class="sn-time">
            {{ formatDate(note.updatedAt !== note.createdAt ? note.updatedAt : note.createdAt) }}
          </div>

          <!-- Actions -->
          <div class="sn-actions" @click.stop>
            <button class="sn-action-btn" :title="t('pin').value" @click="togglePin(note)">
              {{ note.pinned ? '📌' : '📍' }}
            </button>
            <button class="sn-action-btn" :title="t('copy').value" @click="copyContent(note)">
              {{ copiedId === note.id ? '✅' : '📋' }}
            </button>
            <button class="sn-action-btn" :title="t('archive').value" @click="toggleArchive(note)">
              {{ note.archived ? '📤' : '📥' }}
            </button>
            <button class="sn-action-btn" :title="t('editNote').value" @click="openEditModal(note)">
              ✏️
            </button>
            <n-popconfirm @positive-click="deleteNote(note.id)">
              <template #trigger>
                <button class="sn-action-btn sn-action-btn--danger" :title="t('delete').value">
                  🗑️
                </button>
              </template>
              {{ t('deleteConfirm').value }}
            </n-popconfirm>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <c-card v-else>
        <div text-center py-8>
          <div text-5xl mb-4>📝</div>
          <div text-lg op-60 mb-2>
            {{ searchQuery ? t('noSearchResult').value : (activeTab === 'archived' ? t('noArchived').value : t('noNotes').value) }}
          </div>
          <n-button v-if="!searchQuery && activeTab === 'all'" type="primary" mt-4 @click="openAddModal">
            <template #icon><n-icon><Plus /></n-icon></template>
            {{ t('addNote').value }}
          </n-button>
        </div>
      </c-card>

      <!-- Add/Edit Modal -->
      <n-modal
        v-model:show="showModal"
        preset="card"
        :title="editingId ? t('editNote').value : t('addNote').value"
        style="max-width: 520px"
        :bordered="false"
        :segmented="{ content: true, footer: true }"
      >
        <div flex flex-col gap-4>
          <!-- Color Picker -->
          <div>
            <div text-sm op-70 mb-2>{{ t('color').value }}</div>
            <div flex gap-2 flex-wrap>
              <button
                v-for="c in noteColors"
                :key="c.value"
                class="sn-color-btn"
                :class="{ 'sn-color-btn--active': formColor === c.value }"
                :style="{ background: c.value }"
                :title="lang === 'zh' ? c.label : c.labelEn"
                @click="formColor = c.value"
              />
            </div>
          </div>

          <!-- Title -->
          <div>
            <div text-sm op-70 mb-1>{{ t('title_').value }}</div>
            <n-input
              v-model:value="formTitle"
              :placeholder="t('titlePlaceholder').value"
              maxlength="60"
              show-count
            />
          </div>

          <!-- Content -->
          <div>
            <div text-sm op-70 mb-1>{{ t('content').value }}</div>
            <n-input
              v-model:value="formContent"
              type="textarea"
              :placeholder="t('contentPlaceholder').value"
              :autosize="{ minRows: 3, maxRows: 8 }"
              maxlength="2000"
              show-count
            />
          </div>

          <!-- Category -->
          <div>
            <div text-sm op-70 mb-1>{{ t('category').value }}</div>
            <n-select
              v-model:value="formCategory"
              :options="categoryOptions"
              :placeholder="t('categoryPlaceholder').value"
              clearable
              filterable
              tag
            />
          </div>
        </div>

        <template #footer>
          <div flex justify-end gap-2>
            <n-button @click="showModal = false">{{ t('cancel').value }}</n-button>
            <n-button type="primary" @click="saveNote" :disabled="!formContent.trim() && !formTitle.trim()">
              {{ t('save').value }}
            </n-button>
          </div>
        </template>
      </n-modal>

    </div>
  </div>
</template>

<style scoped>
/* Grid */
.sn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

/* Card */
.sn-card {
  position: relative;
  background: var(--note-bg, rgba(251, 191, 36, 0.13));
  border: 1px solid var(--note-border, rgba(251, 191, 36, 0.4));
  border-radius: 14px;
  padding: 16px 16px 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 140px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sn-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--note-accent, #FBBF24);
  border-radius: 14px 14px 0 0;
  opacity: 0.7;
}
.sn-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px -4px var(--note-border, rgba(251, 191, 36, 0.3));
  border-color: var(--note-accent, #FBBF24);
}
.sn-card--pinned {
  border-width: 2px;
}

/* Pin */
.sn-pin {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 16px;
  z-index: 2;
}

/* Title */
.sn-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 6px;
  padding-right: 24px;
  line-height: 1.4;
  word-break: break-word;
}

/* Content */
.sn-content {
  font-size: 0.85rem;
  opacity: 0.85;
  line-height: 1.6;
  flex: 1;
  word-break: break-word;
  white-space: pre-wrap;
}
.sn-content--truncated {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Category */
.sn-category {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 8px;
  width: fit-content;
}
.sn-category-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Time */
.sn-time {
  font-size: 0.68rem;
  opacity: 0.4;
  margin-top: 4px;
}

/* Actions */
.sn-actions {
  display: flex;
  gap: 2px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.2s ease;
}
.sn-card:hover .sn-actions,
.sn-card--expanded .sn-actions {
  opacity: 1;
  transform: translateY(0);
}

.sn-action-btn {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 6px;
  padding: 4px 7px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
  line-height: 1;
}
.sn-action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}
.sn-action-btn--danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Color button */
.sn-color-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.sn-color-btn:hover {
  transform: scale(1.15);
}
.sn-color-btn--active {
  border-color: white;
  transform: scale(1.15);
  box-shadow: 0 0 0 2px var(--note-accent, #FBBF24), 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Responsive */
@media (max-width: 640px) {
  .sn-grid {
    grid-template-columns: 1fr;
  }
}
</style>
