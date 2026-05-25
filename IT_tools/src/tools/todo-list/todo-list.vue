<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useStorage } from '@vueuse/core';
import {
  NButton, NInput, NSelect, NIcon, NTag, NPopconfirm, NCheckbox,
  NScrollbar, NModal, NDatePicker, NProgress, NSpin,
} from 'naive-ui';
import {
  Plus, Search, Trash, CircleCheck, Circle, Flag, Calendar,
  Filter, SortAscending, Download, Upload, Sun, Moon,
  ClipboardCheck, Archive, Star, StarOff,
  ChevronDown, ChevronUp, X, Edit, Bulb,
} from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '待办清单',
    subtitle: '高效管理你的每日任务，专注最重要的事',
    addTask: '添加任务',
    taskPlaceholder: '输入新任务...',
    add: '添加',
    myTasks: '我的任务',
    all: '全部',
    today: '今天',
    upcoming: '即将到来',
    completed: '已完成',
    noTasks: '暂无任务，添加你的第一个待办吧 ✨',
    noCompleted: '暂无已完成任务',
    noToday: '今天没有待办任务，好好休息 🌿',
    noUpcoming: '没有即将到来的任务',
    priority: '优先级',
    high: '高',
    medium: '中',
    low: '低',
    none: '无',
    category: '分类',
    categoryWork: '工作',
    categoryStudy: '学习',
    categoryLife: '生活',
    categoryHealth: '健康',
    categoryOther: '其他',
    dueDate: '截止日期',
    clearDate: '清除日期',
    today_: '今天',
    tomorrow: '明天',
    nextWeek: '下周',
    noDate: '无日期',
    delete: '删除',
    deleteConfirm: '确定删除这个任务吗？',
    edit: '编辑',
    complete: '完成',
    undo: '撤回完成',
    search: '搜索任务...',
    filter: '筛选',
    sortBy: '排序',
    sortPriority: '按优先级',
    sortDate: '按截止日期',
    sortCreated: '按创建时间',
    sortName: '按名称',
    exportAll: '导出',
    importData: '导入',
    totalTasks: '任务总数',
    completedCount: '已完成',
    pendingCount: '待完成',
    overdue: '已逾期',
    todayDue: '今日到期',
    completionRate: '完成率',
    quickAdd: '快速添加',
    presets: '快捷模板',
    presetReport: '交报告',
    presetMeeting: '开会',
    presetReview: '复习笔记',
    presetExercise: '运动锻炼',
    presetShopping: '购物清单',
    presetClean: '打扫房间',
    presetRead: '阅读30分钟',
    presetEmail: '回复邮件',
    presetPlan: '制定周计划',
    presetSkill: '学习新技能',
    overdueTag: '逾期',
    todayTag: '今天',
    tomorrowTag: '明天',
    daysLeft: '天后',
    emptyState: '开始规划你的一天吧',
    statsTitle: '统计概览',
    showCompleted: '显示已完成',
    hideCompleted: '隐藏已完成',
    clearCompleted: '清除已完成',
    clearCompletedConfirm: '确定清除所有已完成的任务吗？',
    focusMode: '专注模式',
    normalMode: '普通模式',
  },
  en: {
    title: 'Todo List',
    subtitle: 'Manage your daily tasks efficiently, focus on what matters',
    addTask: 'Add Task',
    taskPlaceholder: 'Enter a new task...',
    add: 'Add',
    myTasks: 'My Tasks',
    all: 'All',
    today: 'Today',
    upcoming: 'Upcoming',
    completed: 'Completed',
    noTasks: 'No tasks yet. Add your first todo! ✨',
    noCompleted: 'No completed tasks',
    noToday: 'No tasks for today. Take a break! 🌿',
    noUpcoming: 'No upcoming tasks',
    priority: 'Priority',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    none: 'None',
    category: 'Category',
    categoryWork: 'Work',
    categoryStudy: 'Study',
    categoryLife: 'Life',
    categoryHealth: 'Health',
    categoryOther: 'Other',
    dueDate: 'Due Date',
    clearDate: 'Clear Date',
    today_: 'Today',
    tomorrow: 'Tomorrow',
    nextWeek: 'Next Week',
    noDate: 'No Date',
    delete: 'Delete',
    deleteConfirm: 'Delete this task?',
    edit: 'Edit',
    complete: 'Complete',
    undo: 'Undo',
    search: 'Search tasks...',
    filter: 'Filter',
    sortBy: 'Sort',
    sortPriority: 'By Priority',
    sortDate: 'By Due Date',
    sortCreated: 'By Created',
    sortName: 'By Name',
    exportAll: 'Export',
    importData: 'Import',
    totalTasks: 'Total',
    completedCount: 'Completed',
    pendingCount: 'Pending',
    overdue: 'Overdue',
    todayDue: 'Due Today',
    completionRate: 'Completion',
    quickAdd: 'Quick Add',
    presets: 'Presets',
    presetReport: 'Submit Report',
    presetMeeting: 'Meeting',
    presetReview: 'Review Notes',
    presetExercise: 'Exercise',
    presetShopping: 'Shopping List',
    presetClean: 'Clean Room',
    presetRead: 'Read 30min',
    presetEmail: 'Reply Emails',
    presetPlan: 'Weekly Plan',
    presetSkill: 'Learn Skill',
    overdueTag: 'Overdue',
    todayTag: 'Today',
    tomorrowTag: 'Tomorrow',
    daysLeft: 'days left',
    emptyState: 'Start planning your day',
    statsTitle: 'Overview',
    showCompleted: 'Show Completed',
    hideCompleted: 'Hide Completed',
    clearCompleted: 'Clear Completed',
    clearCompletedConfirm: 'Clear all completed tasks?',
    focusMode: 'Focus Mode',
    normalMode: 'Normal Mode',
  },
};

// ===================== Language =====================
const lang = useStorage<'zh' | 'en'>('todo-list-lang', 'zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Types =====================
type Priority = 'high' | 'medium' | 'low' | 'none';
type Category = 'work' | 'study' | 'life' | 'health' | 'other';
type ViewFilter = 'all' | 'today' | 'upcoming' | 'completed';
type SortMode = 'priority' | 'date' | 'created' | 'name';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate: number | null; // timestamp ms
  createdAt: number; // timestamp ms
  completedAt: number | null;
}

// ===================== State =====================
const todos = useStorage<TodoItem[]>('todo-list-items', []);
const newText = ref('');
const newPriority = ref<Priority>('none');
const newCategory = ref<Category>('work');
const newDueDate = ref<number | null>(null);
const searchQuery = ref('');
const viewFilter = ref<ViewFilter>('all');
const sortMode = ref<SortMode>('priority');
const showCompleted = ref(true);
const focusMode = ref(false);
const editingId = ref<string | null>(null);
const editText = ref('');
const editPriority = ref<Priority>('none');
const editCategory = ref<Category>('work');
const editDueDate = ref<number | null>(null);
const showAddPanel = ref(true);
const showPresets = ref(false);

// ===================== Helpers =====================
const priorityValue = (p: Priority): number => {
  const map: Record<Priority, number> = { high: 3, medium: 2, low: 1, none: 0 };
  return map[p];
};

const priorityColor = (p: Priority): string => {
  const map: Record<Priority, string> = {
    high: '#e74c3c',
    medium: '#f39c12',
    low: '#3498db',
    none: '#6c757d',
  };
  return map[p];
};

const categoryColor = (c: Category): string => {
  const map: Record<Category, string> = {
    work: '#6366f1',
    study: '#0ea5e9',
    life: '#22c55e',
    health: '#f43f5e',
    other: '#a78bfa',
  };
  return map[c];
};

const categoryIcon = (c: Category): string => {
  const map: Record<Category, string> = {
    work: '💼',
    study: '📚',
    life: '🏡',
    health: '💪',
    other: '📌',
  };
  return map[c];
};

const priorityIcon = (p: Priority): string => {
  const map: Record<Priority, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🔵',
    none: '',
  };
  return map[p];
};

const isToday = (timestamp: number | null): boolean => {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
};

const isTomorrow = (timestamp: number | null): boolean => {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return d.getFullYear() === tom.getFullYear()
    && d.getMonth() === tom.getMonth()
    && d.getDate() === tom.getDate();
};

const isOverdue = (item: TodoItem): boolean => {
  if (item.completed || !item.dueDate) return false;
  const due = new Date(item.dueDate);
  const now = new Date();
  due.setHours(23, 59, 59, 999);
  return due < now;
};

const daysUntil = (timestamp: number | null): number | null => {
  if (!timestamp) return null;
  const due = new Date(timestamp);
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const formatDate = (timestamp: number | null): string => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (lang.value === 'zh') {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const genId = () => `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const quickDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
  const d = new Date();
  if (type === 'tomorrow') d.setDate(d.getDate() + 1);
  else if (type === 'nextWeek') d.setDate(d.getDate() + 7);
  d.setHours(18, 0, 0, 0);
  return d.getTime();
};

// ===================== Computed =====================
const filteredTodos = computed(() => {
  let list = [...todos.value];

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(item => item.text.toLowerCase().includes(q));
  }

  // View filter
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;

  switch (viewFilter.value) {
    case 'today':
      list = list.filter(item =>
        !item.completed
        && (item.dueDate !== null && item.dueDate >= todayStart && item.dueDate < todayEnd),
      );
      break;
    case 'upcoming':
      list = list.filter(item =>
        !item.completed
        && item.dueDate !== null
        && item.dueDate >= todayStart
        && item.dueDate < weekEnd,
      );
      break;
    case 'completed':
      list = list.filter(item => item.completed);
      break;
    default:
      if (!showCompleted.value) {
        list = list.filter(item => !item.completed);
      }
      break;
  }

  // Sort
  list.sort((a, b) => {
    switch (sortMode.value) {
      case 'priority': {
        const pd = priorityValue(b.priority) - priorityValue(a.priority);
        if (pd !== 0) return pd;
        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt - a.createdAt;
      }
      case 'date':
        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      case 'created':
        return b.createdAt - a.createdAt;
      case 'name':
        return a.text.localeCompare(b.text, lang.value === 'zh' ? 'zh-CN' : 'en');
      default:
        return 0;
    }
  });

  // In focus mode, only show uncompleted high+medium priority
  if (focusMode.value) {
    list = list.filter(item => !item.completed && (item.priority === 'high' || item.priority === 'medium'));
  }

  return list;
});

const stats = computed(() => {
  const total = todos.value.length;
  const done = todos.value.filter(i => i.completed).length;
  const pending = total - done;
  const overdueCount = todos.value.filter(i => isOverdue(i)).length;
  const todayDueCount = todos.value.filter(i =>
    !i.completed && i.dueDate !== null && isToday(i.dueDate),
  ).length;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, pending, overdueCount, todayDueCount, rate };
});

const overdueTodos = computed(() => todos.value.filter(i => isOverdue(i)));

// ===================== Actions =====================
const addTodo = () => {
  const text = newText.value.trim();
  if (!text) return;
  todos.value.unshift({
    id: genId(),
    text,
    completed: false,
    priority: newPriority.value,
    category: newCategory.value,
    dueDate: newDueDate.value,
    createdAt: Date.now(),
    completedAt: null,
  });
  newText.value = '';
  newPriority.value = 'none';
  newDueDate.value = null;
};

const addPreset = (text: string, category: Category, priority: Priority = 'none') => {
  todos.value.unshift({
    id: genId(),
    text,
    completed: false,
    priority,
    category,
    dueDate: null,
    createdAt: Date.now(),
    completedAt: null,
  });
};

const toggleComplete = (item: TodoItem) => {
  item.completed = !item.completed;
  item.completedAt = item.completed ? Date.now() : null;
};

const deleteTodo = (id: string) => {
  todos.value = todos.value.filter(i => i.id !== id);
};

const startEdit = (item: TodoItem) => {
  editingId.value = item.id;
  editText.value = item.text;
  editPriority.value = item.priority;
  editCategory.value = item.category;
  editDueDate.value = item.dueDate;
};

const saveEdit = (item: TodoItem) => {
  if (!editText.value.trim()) return;
  item.text = editText.value.trim();
  item.priority = editPriority.value;
  item.category = editCategory.value;
  item.dueDate = editDueDate.value;
  editingId.value = null;
};

const cancelEdit = () => {
  editingId.value = null;
};

const clearCompleted = () => {
  todos.value = todos.value.filter(i => !i.completed);
};

const exportTodos = () => {
  const data = JSON.stringify(todos.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `todo-list-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importTodos = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          todos.value = [...data, ...todos.value];
        }
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  };
  input.click();
};

// Keyboard shortcut
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !editingId.value) {
    e.preventDefault();
    addTodo();
  }
};

// Toggle language
const toggleLang = () => {
  lang.value = lang.value === 'zh' ? 'en' : 'zh';
};

// Priority select options
const priorityOptions = computed(() => [
  { label: t('none').value, value: 'none' },
  { label: `${priorityIcon('low')} ${t('low').value}`, value: 'low' },
  { label: `${priorityIcon('medium')} ${t('medium').value}`, value: 'medium' },
  { label: `${priorityIcon('high')} ${t('high').value}`, value: 'high' },
]);

const categoryOptions = computed(() => [
  { label: `${categoryIcon('work')} ${t('categoryWork').value}`, value: 'work' },
  { label: `${categoryIcon('study')} ${t('categoryStudy').value}`, value: 'study' },
  { label: `${categoryIcon('life')} ${t('categoryLife').value}`, value: 'life' },
  { label: `${categoryIcon('health')} ${t('categoryHealth').value}`, value: 'health' },
  { label: `${categoryIcon('other')} ${t('categoryOther').value}`, value: 'other' },
]);

const viewFilterOptions = computed(() => [
  { label: t('all').value, value: 'all' },
  { label: t('today').value, value: 'today' },
  { label: t('upcoming').value, value: 'upcoming' },
  { label: t('completed').value, value: 'completed' },
]);

const sortOptions = computed(() => [
  { label: t('sortPriority').value, value: 'priority' },
  { label: t('sortDate').value, value: 'date' },
  { label: t('sortCreated').value, value: 'created' },
  { label: t('sortName').value, value: 'name' },
]);

// Presets data
const presetItems = computed(() => [
  { text: t('presetReport').value, cat: 'work' as Category, pri: 'high' as Priority },
  { text: t('presetMeeting').value, cat: 'work' as Category, pri: 'medium' as Priority },
  { text: t('presetReview').value, cat: 'study' as Category, pri: 'medium' as Priority },
  { text: t('presetExercise').value, cat: 'health' as Category, pri: 'low' as Priority },
  { text: t('presetShopping').value, cat: 'life' as Category, pri: 'low' as Priority },
  { text: t('presetClean').value, cat: 'life' as Category, pri: 'low' as Priority },
  { text: t('presetRead').value, cat: 'study' as Category, pri: 'low' as Priority },
  { text: t('presetEmail').value, cat: 'work' as Category, pri: 'medium' as Priority },
  { text: t('presetPlan').value, cat: 'work' as Category, pri: 'medium' as Priority },
  { text: t('presetSkill').value, cat: 'study' as Category, pri: 'low' as Priority },
]);
</script>

<template>
  <div class="todo-container" :class="{ 'focus-mode': focusMode }">
    <!-- Header -->
    <div class="todo-header">
      <div class="header-top">
        <div class="title-area">
          <h1 class="title">{{ t('title').value }}</h1>
          <span class="subtitle">{{ t('subtitle').value }}</span>
        </div>
        <div class="header-actions">
          <button class="icon-btn" :title="t('focusMode').value" @click="focusMode = !focusMode">
            <n-icon size="18" :color="focusMode ? '#f59e0b' : '#888'">
              <Bulb />
            </n-icon>
          </button>
          <button class="icon-btn lang-btn" @click="toggleLang">
            {{ lang === 'zh' ? 'EN' : '中' }}
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">{{ t('totalTasks').value }}</span>
        </div>
        <div class="stat-item stat-done">
          <span class="stat-value">{{ stats.done }}</span>
          <span class="stat-label">{{ t('completedCount').value }}</span>
        </div>
        <div class="stat-item stat-pending">
          <span class="stat-value">{{ stats.pending }}</span>
          <span class="stat-label">{{ t('pendingCount').value }}</span>
        </div>
        <div v-if="stats.overdueCount > 0" class="stat-item stat-overdue">
          <span class="stat-value">{{ stats.overdueCount }}</span>
          <span class="stat-label">{{ t('overdue').value }}</span>
        </div>
        <div class="stat-item stat-rate">
          <n-progress
            type="circle"
            :percentage="stats.rate"
            :size="36"
            :stroke-width="4"
            :color="stats.rate >= 80 ? '#22c55e' : stats.rate >= 50 ? '#f59e0b' : '#ef4444'"
            :rail-color="'rgba(255,255,255,0.08)'"
          />
          <span class="stat-label">{{ t('completionRate').value }}</span>
        </div>
      </div>
    </div>

    <!-- Add Task Area -->
    <div v-if="!focusMode" class="add-area">
      <div class="add-input-row">
        <n-input
          v-model:value="newText"
          :placeholder="t('taskPlaceholder').value"
          size="large"
          class="task-input"
          @keydown="handleKeydown"
        />
        <n-button type="primary" size="large" class="add-btn" @click="addTodo">
          <template #icon>
            <n-icon><Plus /></n-icon>
          </template>
          {{ t('add').value }}
        </n-button>
      </div>
      <div class="add-options">
        <n-select
          v-model:value="newPriority"
          :options="priorityOptions"
          size="small"
          class="option-select priority-select"
          :placeholder="t('priority').value"
        />
        <n-select
          v-model:value="newCategory"
          :options="categoryOptions"
          size="small"
          class="option-select category-select"
          :placeholder="t('category').value"
        />
        <n-date-picker
          v-model:value="newDueDate"
          size="small"
          type="date"
          :placeholder="t('dueDate').value"
          clearable
          class="date-select"
        />
        <div class="quick-dates">
          <button class="quick-date-btn" @click="newDueDate = quickDate('today')">{{ t('today_').value }}</button>
          <button class="quick-date-btn" @click="newDueDate = quickDate('tomorrow')">{{ t('tomorrow').value }}</button>
          <button class="quick-date-btn" @click="newDueDate = quickDate('nextWeek')">{{ t('nextWeek').value }}</button>
        </div>
      </div>

      <!-- Presets Toggle -->
      <div class="presets-toggle">
        <button class="preset-toggle-btn" @click="showPresets = !showPresets">
          <n-icon size="16"><StarOff /></n-icon>
          {{ t('presets').value }}
          <n-icon size="14">
            <ChevronDown v-if="!showPresets" />
            <ChevronUp v-else />
          </n-icon>
        </button>
      </div>
      <div v-if="showPresets" class="presets-grid">
        <button
          v-for="p in presetItems"
          :key="p.text"
          class="preset-chip"
          @click="addPreset(p.text, p.cat, p.pri)"
        >
          {{ categoryIcon(p.cat) }} {{ p.text }}
        </button>
      </div>
    </div>

    <!-- Filter & Sort Bar -->
    <div class="filter-bar">
      <div class="filter-left">
        <n-select
          v-model:value="viewFilter"
          :options="viewFilterOptions"
          size="small"
          class="filter-select"
        />
        <n-select
          v-model:value="sortMode"
          :options="sortOptions"
          size="small"
          class="filter-select sort-select"
        />
        <n-input
          v-model:value="searchQuery"
          :placeholder="t('search').value"
          size="small"
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon size="14"><Search /></n-icon>
          </template>
        </n-input>
      </div>
      <div class="filter-right">
        <button v-if="viewFilter === 'all'" class="toggle-btn" @click="showCompleted = !showCompleted">
          {{ showCompleted ? t('hideCompleted').value : t('showCompleted').value }}
        </button>
        <button class="icon-btn" :title="t('importData').value" @click="importTodos">
          <n-icon size="16"><Upload /></n-icon>
        </button>
        <button class="icon-btn" :title="t('exportAll').value" @click="exportTodos">
          <n-icon size="16"><Download /></n-icon>
        </button>
      </div>
    </div>

    <!-- Task List -->
    <div class="task-list-wrapper">
      <n-scrollbar class="task-scrollbar">
        <div v-if="filteredTodos.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">
            <template v-if="viewFilter === 'today'">{{ t('noToday').value }}</template>
            <template v-else-if="viewFilter === 'completed'">{{ t('noCompleted').value }}</template>
            <template v-else-if="viewFilter === 'upcoming'">{{ t('noUpcoming').value }}</template>
            <template v-else>{{ t('noTasks').value }}</template>
          </div>
        </div>

        <transition-group name="task-list" tag="div" class="task-list">
          <div
            v-for="item in filteredTodos"
            :key="item.id"
            class="task-item"
            :class="{
              'task-completed': item.completed,
              'task-overdue': isOverdue(item),
              'task-high': item.priority === 'high' && !item.completed,
              'task-editing': editingId === item.id,
            }"
          >
            <!-- Left: checkbox + priority indicator -->
            <div class="task-left">
              <div
                class="priority-bar"
                :style="{ backgroundColor: item.completed ? '#444' : priorityColor(item.priority) }"
              />
              <button class="check-btn" :class="{ checked: item.completed }" @click="toggleComplete(item)">
                <n-icon size="20" :color="item.completed ? '#22c55e' : '#666'">
                  <CircleCheck v-if="item.completed" />
                  <Circle v-else />
                </n-icon>
              </button>
            </div>

            <!-- Center: content -->
            <div v-if="editingId === item.id" class="task-edit-area">
              <n-input v-model:value="editText" size="small" class="edit-input" @keydown.enter="saveEdit(item)" />
              <div class="edit-options">
                <n-select v-model:value="editPriority" :options="priorityOptions" size="tiny" class="edit-option" />
                <n-select v-model:value="editCategory" :options="categoryOptions" size="tiny" class="edit-option" />
                <n-date-picker v-model:value="editDueDate" size="tiny" type="date" clearable class="edit-date" />
              </div>
              <div class="edit-actions">
                <n-button size="tiny" type="primary" @click="saveEdit(item)">{{ t('edit').value }}</n-button>
                <n-button size="tiny" @click="cancelEdit">{{ t('cancel').value }}</n-button>
              </div>
            </div>
            <div v-else class="task-content" @click="startEdit(item)">
              <div class="task-text" :class="{ 'line-through': item.completed }">
                {{ item.text }}
              </div>
              <div class="task-meta">
                <span
                  v-if="item.priority !== 'none'"
                  class="meta-tag priority-tag"
                  :style="{ color: priorityColor(item.priority) }"
                >
                  {{ priorityIcon(item.priority) }} {{ t(item.priority).value }}
                </span>
                <span
                  class="meta-tag category-tag"
                  :style="{ color: categoryColor(item.category) }"
                >
                  {{ categoryIcon(item.category) }} {{ t(`category${item.category.charAt(0).toUpperCase() + item.category.slice(1)}` as keyof typeof labels.zh).value }}
                </span>
                <span v-if="item.dueDate" class="meta-tag date-tag" :class="{ 'overdue-text': isOverdue(item) }">
                  <n-icon size="12"><Calendar /></n-icon>
                  {{ formatDate(item.dueDate) }}
                  <span v-if="isOverdue(item)" class="overdue-badge">{{ t('overdueTag').value }}</span>
                  <span v-else-if="isToday(item.dueDate)" class="today-badge">{{ t('todayTag').value }}</span>
                  <span v-else-if="isTomorrow(item.dueDate)" class="tomorrow-badge">{{ t('tomorrowTag').value }}</span>
                  <span v-else-if="daysUntil(item.dueDate) !== null && daysUntil(item.dueDate)! > 0" class="days-left">
                    {{ daysUntil(item.dueDate) }} {{ t('daysLeft').value }}
                  </span>
                </span>
              </div>
            </div>

            <!-- Right: actions -->
            <div class="task-actions">
              <button class="action-btn" @click.stop="startEdit(item)">
                <n-icon size="14"><Edit /></n-icon>
              </button>
              <n-popconfirm @positive-click="deleteTodo(item.id)">
                <template #trigger>
                  <button class="action-btn delete-btn" @click.stop>
                    <n-icon size="14"><Trash /></n-icon>
                  </button>
                </template>
                {{ t('deleteConfirm').value }}
              </n-popconfirm>
            </div>
          </div>
        </transition-group>
      </n-scrollbar>
    </div>

    <!-- Clear completed button -->
    <div v-if="stats.done > 0" class="clear-bar">
      <n-popconfirm @positive-click="clearCompleted">
        <template #trigger>
          <n-button size="small" type="error" ghost>
            {{ t('clearCompleted').value }} ({{ stats.done }})
          </n-button>
        </template>
        {{ t('clearCompletedConfirm').value }}
      </n-popconfirm>
    </div>
  </div>
</template>

<style scoped>
.todo-container {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px 24px;
}

/* ===== Header ===== */
.todo-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-area .title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1.2;
}

.title-area .subtitle {
  font-size: 14px;
  color: #888;
  margin-top: 4px;
  display: block;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #aaa;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.lang-btn {
  font-size: 12px;
  font-weight: 600;
  width: auto;
  padding: 0 10px;
}

/* ===== Stats Bar ===== */
.stats-bar {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 50px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #e0e0e0;
}

.stat-done .stat-value { color: #22c55e; }
.stat-pending .stat-value { color: #f59e0b; }
.stat-overdue .stat-value { color: #ef4444; }

.stat-label {
  font-size: 11px;
  color: #777;
}

.stat-rate {
  margin-left: auto;
  gap: 4px;
}

/* ===== Add Area ===== */
.add-area {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.add-input-row {
  display: flex;
  gap: 8px;
}

.add-btn {
  flex-shrink: 0;
  border-radius: 10px !important;
  font-weight: 600 !important;
}

.add-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.option-select {
  width: 110px;
  flex-shrink: 0;
}

.date-select {
  width: 140px;
  flex-shrink: 0;
}

.quick-dates {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.quick-date-btn {
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-date-btn:hover {
  background: rgba(99, 102, 241, 0.25);
  color: #c7d2fe;
}

/* ===== Presets ===== */
.presets-toggle {
  display: flex;
  justify-content: flex-end;
}

.preset-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.preset-toggle-btn:hover {
  color: #bbb;
  background: rgba(255, 255, 255, 0.06);
}

.presets-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #bbb;
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-chip:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #e0e0e0;
}

/* ===== Filter Bar ===== */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-select {
  width: 100px;
}

.sort-select {
  width: 120px;
}

.search-input {
  min-width: 160px;
  flex: 1;
  max-width: 260px;
}

.filter-right {
  display: flex;
  gap: 6px;
  align-items: center;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #aaa;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ddd;
}

/* ===== Task List ===== */
.task-list-wrapper {
  flex: 1;
  min-height: 200px;
}

.task-scrollbar {
  max-height: 60vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  text-align: center;
  line-height: 1.6;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.task-item:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.12);
}

.task-item.task-completed {
  opacity: 0.55;
}

.task-item.task-overdue {
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.04);
}

.task-item.task-editing {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.06);
}

.task-left {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 2px;
}

.priority-bar {
  width: 3px;
  height: 28px;
  border-radius: 2px;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.check-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: transform 0.15s;
  flex-shrink: 0;
}

.check-btn:hover {
  transform: scale(1.15);
}

.check-btn.checked {
  animation: checkBounce 0.3s ease;
}

@keyframes checkBounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.task-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.task-text {
  font-size: 14px;
  color: #e0e0e0;
  line-height: 1.5;
  word-break: break-word;
}

.task-text.line-through {
  text-decoration: line-through;
  color: #777;
}

.task-meta {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
}

.priority-tag {
  background: rgba(255, 255, 255, 0.04);
}

.category-tag {
  background: rgba(255, 255, 255, 0.04);
}

.date-tag {
  color: #999;
  background: rgba(255, 255, 255, 0.04);
}

.date-tag.overdue-text {
  color: #ef4444;
}

.overdue-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.today-badge {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.tomorrow-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.days-left {
  color: #777;
  font-size: 10px;
}

/* ===== Edit Area ===== */
.task-edit-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-input {
  width: 100%;
}

.edit-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.edit-option {
  width: 100px;
}

.edit-date {
  width: 140px;
}

.edit-actions {
  display: flex;
  gap: 6px;
}

/* ===== Task Actions ===== */
.task-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ddd;
}

.delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* ===== Clear Bar ===== */
.clear-bar {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

/* ===== Focus Mode ===== */
.focus-mode .stats-bar {
  border-color: rgba(245, 158, 11, 0.2);
  background: rgba(245, 158, 11, 0.04);
}

.focus-mode .title {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== Transitions ===== */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.task-list-move {
  transition: transform 0.3s ease;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .todo-container {
    gap: 12px;
  }

  .title-area .title {
    font-size: 22px;
  }

  .stats-bar {
    padding: 10px 14px;
    gap: 8px;
  }

  .add-options {
    flex-direction: column;
  }

  .option-select, .date-select {
    width: 100%;
  }

  .quick-dates {
    margin-left: 0;
    justify-content: flex-start;
  }

  .filter-left {
    flex-direction: column;
  }

  .filter-select, .sort-select, .search-input {
    width: 100%;
    max-width: none;
  }

  .filter-right {
    width: 100%;
    justify-content: flex-end;
  }

  .task-actions {
    opacity: 1;
  }

  .edit-options {
    flex-direction: column;
  }

  .edit-option, .edit-date {
    width: 100%;
  }
}
</style>
