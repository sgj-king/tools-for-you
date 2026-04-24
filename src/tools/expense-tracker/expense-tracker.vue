<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStorage } from '@vueuse/core';
import { NGrid, NGi, NButton, NInput, NSelect, NModal, NForm, NFormItem, NSwitch, NTag, NProgress, NPopconfirm, NDatePicker, NTabs, NTabPane, NScrollbar } from 'naive-ui';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '记账本',
    subtitle: '轻松记录日常收支，帮你管好每一分钱',
    addExpense: '记一笔',
    editExpense: '编辑',
    amount: '金额',
    amountPlaceholder: '0.00',
    category: '分类',
    date: '日期',
    note: '备注',
    notePlaceholder: '添加备注...',
    type: '类型',
    expense: '支出',
    income: '收入',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    deleteConfirm: '确定删除这条记录吗？',
    totalBalance: '总余额',
    totalExpense: '总支出',
    totalIncome: '总收入',
    thisMonth: '本月',
    lastMonth: '上月',
    thisWeek: '本周',
    today: '今天',
    all: '全部',
    recentRecords: '最近记录',
    noRecords: '暂无记录，点击上方开始记账吧',
    budget: '月度预算',
    setBudget: '设置预算',
    budgetPlaceholder: '输入月度预算...',
    budgetRemaining: '剩余预算',
    budgetUsed: '已使用',
    budgetExceeded: '预算超支！',
    budgetOnTrack: '预算健康',
    categoryBreakdown: '分类统计',
    trend: '趋势',
    daily: '按日',
    weekly: '按周',
    monthly: '按月',
    overview: '概览',
    records: '记录',
    stats: '统计',
    settings: '设置',
    currency: '货币符号',
    currencyCN: '¥ 人民币',
    currencyUS: '$ 美元',
    currencyEU: '€ 欧元',
    currencyJP: '¥ 日元',
    clearAll: '清除所有数据',
    clearAllConfirm: '确定清除所有记账数据吗？此操作不可恢复！',
    exportData: '导出数据',
    importData: '导入数据',
    topCategories: '支出排行',
    incomeSource: '收入来源',
    search: '搜索',
    searchPlaceholder: '搜索备注或分类...',
    dailyAvg: '日均支出',
    monthTrend: '月度趋势',
    food: '餐饮',
    transport: '交通',
    shopping: '购物',
    entertainment: '娱乐',
    housing: '住房',
    medical: '医疗',
    education: '教育',
    utility: '水电',
    salary: '工资',
    bonus: '奖金',
    investment: '投资',
    other: '其他',
    noBudget: '未设置预算',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },
  en: {
    title: 'Expense Tracker',
    subtitle: 'Track income & expenses, visualize spending trends',
    addExpense: 'Add Record',
    editExpense: 'Edit',
    amount: 'Amount',
    amountPlaceholder: '0.00',
    category: 'Category',
    date: 'Date',
    note: 'Note',
    notePlaceholder: 'Add a note...',
    type: 'Type',
    expense: 'Expense',
    income: 'Income',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Delete this record?',
    totalBalance: 'Total Balance',
    totalExpense: 'Total Expense',
    totalIncome: 'Total Income',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisWeek: 'This Week',
    today: 'Today',
    all: 'All',
    recentRecords: 'Recent Records',
    noRecords: 'No records yet. Start tracking above!',
    budget: 'Monthly Budget',
    setBudget: 'Set Budget',
    budgetPlaceholder: 'Enter monthly budget...',
    budgetRemaining: 'Remaining',
    budgetUsed: 'Used',
    budgetExceeded: 'Budget Exceeded!',
    budgetOnTrack: 'On Track',
    categoryBreakdown: 'Category Breakdown',
    trend: 'Trend',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    overview: 'Overview',
    records: 'Records',
    stats: 'Stats',
    settings: 'Settings',
    currency: 'Currency',
    currencyCN: '¥ CNY',
    currencyUS: '$ USD',
    currencyEU: '€ EUR',
    currencyJP: '¥ JPY',
    clearAll: 'Clear All Data',
    clearAllConfirm: 'Clear all expense data? This cannot be undone!',
    exportData: 'Export Data',
    importData: 'Import Data',
    topCategories: 'Top Expenses',
    incomeSource: 'Income Sources',
    search: 'Search',
    searchPlaceholder: 'Search notes or categories...',
    dailyAvg: 'Daily Average',
    monthTrend: 'Monthly Trend',
    food: 'Food',
    transport: 'Transport',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    housing: 'Housing',
    medical: 'Medical',
    education: 'Education',
    utility: 'Utilities',
    salary: 'Salary',
    bonus: 'Bonus',
    investment: 'Investment',
    other: 'Other',
    noBudget: 'No budget set',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Types =====================
interface ExpenseItem {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: string;
}

// ===================== State =====================
const expenses = useStorage<ExpenseItem[]>('expense-tracker-items', []);
const monthlyBudget = useStorage<number>('expense-tracker-budget', 0);
const currencySymbol = useStorage<string>('expense-tracker-currency', '¥');
const searchQuery = ref('');
const showModal = ref(false);
const editingId = ref<string | null>(null);
const activeTab = ref('overview');

// Form state
const formType = ref<'expense' | 'income'>('expense');
const formAmount = ref('');
const formCategory = ref('');
const formDate = ref(Date.now());
const formNote = ref('');

// Budget modal
const showBudgetModal = ref(false);
const budgetInput = ref('');

// ===================== Categories =====================
const expenseCategoryIcons: Record<string, string> = {
  food: '🍜',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎬',
  housing: '🏠',
  medical: '🏥',
  education: '📚',
  utility: '💡',
  other: '📌',
};

const incomeCategoryIcons: Record<string, string> = {
  salary: '💰',
  bonus: '🎁',
  investment: '📈',
  other: '📌',
};

const expenseCategories = computed(() => [
  { label: labels[lang.value].food, value: 'food', icon: '🍜' },
  { label: labels[lang.value].transport, value: 'transport', icon: '🚗' },
  { label: labels[lang.value].shopping, value: 'shopping', icon: '🛍️' },
  { label: labels[lang.value].entertainment, value: 'entertainment', icon: '🎬' },
  { label: labels[lang.value].housing, value: 'housing', icon: '🏠' },
  { label: labels[lang.value].medical, value: 'medical', icon: '🏥' },
  { label: labels[lang.value].education, value: 'education', icon: '📚' },
  { label: labels[lang.value].utility, value: 'utility', icon: '💡' },
  { label: labels[lang.value].other, value: 'other', icon: '📌' },
]);

const incomeCategories = computed(() => [
  { label: labels[lang.value].salary, value: 'salary', icon: '💰' },
  { label: labels[lang.value].bonus, value: 'bonus', icon: '🎁' },
  { label: labels[lang.value].investment, value: 'investment', icon: '📈' },
  { label: labels[lang.value].other, value: 'other', icon: '📌' },
]);

const currentCategories = computed(() => {
  return formType.value === 'expense' ? expenseCategories.value : incomeCategories.value;
});

// ===================== Helpers =====================
function formatDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getTodayStr(): string {
  return formatDateStr(Date.now());
}

function formatMoney(amount: number): string {
  return `${currencySymbol.value}${amount.toFixed(2)}`;
}

function getCategoryIcon(cat: string, type: string): string {
  if (type === 'expense') return expenseCategoryIcons[cat] || '📌';
  return incomeCategoryIcons[cat] || '📌';
}

function getCategoryLabel(cat: string): string {
  const key = cat as keyof typeof labels.zh;
  return labels[lang.value][key] || cat;
}

// ===================== Date filtering =====================
const todayStr = computed(() => getTodayStr());

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return formatDateStr(d.getTime());
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getLastMonthStart(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function getLastMonthEnd(): string {
  const d = new Date();
  d.setDate(0); // last day of previous month
  return formatDateStr(d.getTime());
}

// ===================== Computed Stats =====================
const totalIncome = computed(() =>
  expenses.value.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0)
);

const totalExpense = computed(() =>
  expenses.value.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0)
);

const totalBalance = computed(() => totalIncome.value - totalExpense.value);

// This month
const thisMonthExpenses = computed(() =>
  expenses.value.filter(e => e.type === 'expense' && e.date >= getMonthStart())
);
const thisMonthIncome = computed(() =>
  expenses.value.filter(e => e.type === 'income' && e.date >= getMonthStart())
);
const thisMonthExpenseTotal = computed(() =>
  thisMonthExpenses.value.reduce((sum, e) => sum + e.amount, 0)
);
const thisMonthIncomeTotal = computed(() =>
  thisMonthIncome.value.reduce((sum, e) => sum + e.amount, 0)
);

// Last month
const lastMonthExpenses = computed(() =>
  expenses.value.filter(e => e.type === 'expense' && e.date >= getLastMonthStart() && e.date <= getLastMonthEnd())
);
const lastMonthExpenseTotal = computed(() =>
  lastMonthExpenses.value.reduce((sum, e) => sum + e.amount, 0)
);

// This week
const thisWeekExpenseTotal = computed(() =>
  expenses.value.filter(e => e.type === 'expense' && e.date >= getWeekStart()).reduce((sum, e) => sum + e.amount, 0)
);

// Today
const todayExpenseTotal = computed(() =>
  expenses.value.filter(e => e.type === 'expense' && e.date === todayStr.value).reduce((sum, e) => sum + e.amount, 0)
);

// Budget
const budgetPercentage = computed(() => {
  if (monthlyBudget.value <= 0) return 0;
  return Math.min(100, Math.round((thisMonthExpenseTotal.value / monthlyBudget.value) * 100));
});

const budgetRemaining = computed(() => {
  return monthlyBudget.value - thisMonthExpenseTotal.value;
});

const isBudgetExceeded = computed(() => {
  return monthlyBudget.value > 0 && thisMonthExpenseTotal.value > monthlyBudget.value;
});

// Daily average (this month)
const dailyAvgExpense = computed(() => {
  const now = new Date();
  const daysInMonth = now.getDate();
  if (daysInMonth === 0) return 0;
  return thisMonthExpenseTotal.value / daysInMonth;
});

// Category breakdown (this month)
const categoryBreakdown = computed(() => {
  const map: Record<string, number> = {};
  thisMonthExpenses.value.forEach(e => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return Object.entries(map)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      label: getCategoryLabel(cat),
      icon: getCategoryIcon(cat, 'expense'),
      percentage: thisMonthExpenseTotal.value > 0 ? Math.round((amount / thisMonthExpenseTotal.value) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
});

// Income source breakdown (this month)
const incomeBreakdown = computed(() => {
  const map: Record<string, number> = {};
  thisMonthIncome.value.forEach(e => {
    map[e.category] = (map[e.category] || 0) + e.amount;
  });
  return Object.entries(map)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      label: getCategoryLabel(cat),
      icon: getCategoryIcon(cat, 'income'),
      percentage: thisMonthIncomeTotal.value > 0 ? Math.round((amount / thisMonthIncomeTotal.value) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
});

// Last 7 days trend
const weeklyTrend = computed(() => {
  const days: { label: string; date: string; expense: number; income: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDateStr(d.getTime());
    const dayLabel = lang.value === 'zh'
      ? labels.zh.weekDays[d.getDay()]
      : labels.en.weekDays[d.getDay()];
    days.push({
      label: dayLabel,
      date: dateStr,
      expense: expenses.value.filter(e => e.type === 'expense' && e.date === dateStr).reduce((s, e) => s + e.amount, 0),
      income: expenses.value.filter(e => e.type === 'income' && e.date === dateStr).reduce((s, e) => s + e.amount, 0),
    });
  }
  return days;
});

const weeklyMaxExpense = computed(() => Math.max(...weeklyTrend.value.map(d => d.expense), 1));

// Last 6 months trend
const monthlyTrend = computed(() => {
  const months: { label: string; expense: number; income: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthEnd = formatDateStr(nextMonth.getTime() - 86400000);
    const monthLabel = lang.value === 'zh'
      ? `${d.getMonth() + 1}月`
      : labels.en.months[d.getMonth()];
    months.push({
      label: monthLabel,
      expense: expenses.value.filter(e => e.type === 'expense' && e.date >= monthStart && e.date <= monthEnd).reduce((s, e) => s + e.amount, 0),
      income: expenses.value.filter(e => e.type === 'income' && e.date >= monthStart && e.date <= monthEnd).reduce((s, e) => s + e.amount, 0),
    });
  }
  return months;
});

const monthlyMaxExpense = computed(() => Math.max(...monthlyTrend.value.map(m => m.expense), 1));

// Filtered records
const filteredRecords = computed(() => {
  let records = [...expenses.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    records = records.filter(r =>
      r.note.toLowerCase().includes(q) ||
      getCategoryLabel(r.category).toLowerCase().includes(q)
    );
  }
  return records;
});

// ===================== Actions =====================
const openAddModal = (type: 'expense' | 'income' = 'expense') => {
  editingId.value = null;
  formType.value = type;
  formAmount.value = '';
  formCategory.value = currentCategories.value[0]?.value || 'food';
  formDate.value = Date.now();
  formNote.value = '';
  showModal.value = true;
};

const openEditModal = (item: ExpenseItem) => {
  editingId.value = item.id;
  formType.value = item.type;
  formAmount.value = String(item.amount);
  formCategory.value = item.category;
  formDate.value = new Date(item.date).getTime();
  formNote.value = item.note;
  showModal.value = true;
};

const saveRecord = () => {
  const amount = parseFloat(formAmount.value);
  if (isNaN(amount) || amount <= 0) return;

  if (editingId.value) {
    const item = expenses.value.find(e => e.id === editingId.value);
    if (item) {
      item.type = formType.value;
      item.amount = amount;
      item.category = formCategory.value;
      item.date = formatDateStr(formDate.value);
      item.note = formNote.value;
    }
  } else {
    expenses.value.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: formType.value,
      amount,
      category: formCategory.value,
      date: formatDateStr(formDate.value),
      note: formNote.value,
      createdAt: new Date().toISOString(),
    });
  }
  showModal.value = false;
};

const deleteRecord = (id: string) => {
  const idx = expenses.value.findIndex(e => e.id === id);
  if (idx >= 0) expenses.value.splice(idx, 1);
};

const saveBudget = () => {
  const val = parseFloat(budgetInput.value);
  if (!isNaN(val) && val >= 0) {
    monthlyBudget.value = val;
  }
  showBudgetModal.value = false;
};

const openBudgetModal = () => {
  budgetInput.value = monthlyBudget.value > 0 ? String(monthlyBudget.value) : '';
  showBudgetModal.value = true;
};

const setCurrency = (symbol: string) => {
  currencySymbol.value = symbol;
};

const clearAllData = () => {
  expenses.value = [];
  monthlyBudget.value = 0;
};

const exportData = () => {
  const data = JSON.stringify({ expenses: expenses.value, budget: monthlyBudget.value, currency: currencySymbol.value }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expense-tracker-${getTodayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const handleImportData = () => {
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
        if (data.expenses && Array.isArray(data.expenses)) {
          expenses.value = data.expenses;
        }
        if (data.budget) monthlyBudget.value = data.budget;
        if (data.currency) currencySymbol.value = data.currency;
      } catch { /* invalid JSON */ }
    };
    reader.readAsText(file);
  };
  input.click();
};

// Color map for categories
const categoryColors: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  shopping: '#ec4899',
  entertainment: '#8b5cf6',
  housing: '#14b8a6',
  medical: '#ef4444',
  education: '#6366f1',
  utility: '#f59e0b',
  salary: '#22c55e',
  bonus: '#10b981',
  investment: '#06b6d4',
  other: '#64748b',
};

function getCategoryColor(cat: string): string {
  return categoryColors[cat] || '#64748b';
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 960px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <!-- Title -->
      <div text-center mb-6>
        <div text-4xl mb-2>💰</div>
        <div text-2xl font-bold>{{ t('title').value }}</div>
        <div text-sm op-60 mt-1>{{ t('subtitle').value }}</div>
      </div>

      <!-- Quick Add Buttons -->
      <div flex justify-center gap-3 mb-6>
        <n-button type="error" size="large" round @click="openAddModal('expense')">
          <template #icon>📉</template>
          {{ t('expense').value }}
        </n-button>
        <n-button type="success" size="large" round @click="openAddModal('income')">
          <template #icon>📈</template>
          {{ t('income').value }}
        </n-button>
      </div>

      <!-- Tabs -->
      <n-tabs v-model:value="activeTab" type="line" animated mb-4>
        <n-tab-pane name="overview" :tab="t('overview').value">
          <!-- Summary Cards -->
          <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" item-responsive mb-4>
            <n-gi span="3 m:1">
              <div p-4 rounded-xl style="background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05)); border: 1px solid rgba(34,197,94,0.3)">
                <div text-sm op-60>{{ t('totalBalance').value }}</div>
                <div text-2xl font-bold :style="{ color: totalBalance >= 0 ? '#22c55e' : '#ef4444' }">
                  {{ formatMoney(totalBalance) }}
                </div>
              </div>
            </n-gi>
            <n-gi span="3 m:1">
              <div p-4 rounded-xl style="background: linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05)); border: 1px solid rgba(239,68,68,0.3)">
                <div text-sm op-60>{{ t('totalExpense').value }}</div>
                <div text-2xl font-bold text-red-400>{{ formatMoney(totalExpense) }}</div>
              </div>
            </n-gi>
            <n-gi span="3 m:1">
              <div p-4 rounded-xl style="background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05)); border: 1px solid rgba(34,197,94,0.3)">
                <div text-sm op-60>{{ t('totalIncome').value }}</div>
                <div text-2xl font-bold text-green-400>{{ formatMoney(totalIncome) }}</div>
              </div>
            </n-gi>
          </n-grid>

          <!-- Time Period Summary -->
          <c-card mb-4>
            <n-grid :cols="4" :x-gap="8" :y-gap="8" responsive="screen" item-responsive>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg text-center style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)">
                  <div text-xs op-50>{{ t('today').value }}</div>
                  <div text-lg font-bold>{{ formatMoney(todayExpenseTotal) }}</div>
                </div>
              </n-gi>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg text-center style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)">
                  <div text-xs op-50>{{ t('thisWeek').value }}</div>
                  <div text-lg font-bold>{{ formatMoney(thisWeekExpenseTotal) }}</div>
                </div>
              </n-gi>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg text-center style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)">
                  <div text-xs op-50>{{ t('thisMonth').value }}</div>
                  <div text-lg font-bold>{{ formatMoney(thisMonthExpenseTotal) }}</div>
                </div>
              </n-gi>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg text-center style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)">
                  <div text-xs op-50>{{ t('dailyAvg').value }}</div>
                  <div text-lg font-bold>{{ formatMoney(dailyAvgExpense) }}</div>
                </div>
              </n-gi>
            </n-grid>
          </c-card>

          <!-- Budget Card -->
          <c-card mb-4>
            <div flex items-center justify-between mb-3>
              <div text-lg font-bold>🎯 {{ t('budget').value }}</div>
              <n-button size="small" @click="openBudgetModal" quaternary>
                {{ t('setBudget').value }}
              </n-button>
            </div>
            <div v-if="monthlyBudget > 0">
              <div flex justify-between text-sm mb-2>
                <span op-60>{{ formatMoney(thisMonthExpenseTotal) }} / {{ formatMoney(monthlyBudget) }}</span>
                <span :style="{ color: isBudgetExceeded ? '#ef4444' : '#22c55e' }">
                  {{ isBudgetExceeded ? t('budgetExceeded').value : `${budgetPercentage}%` }}
                </span>
              </div>
              <n-progress
                :percentage="budgetPercentage"
                :color="isBudgetExceeded ? '#ef4444' : '#22c55e'"
                :rail-color="'rgba(255,255,255,0.08)'"
                :height="12"
                :border-radius="6"
              />
              <div text-sm mt-2 :style="{ color: isBudgetExceeded ? '#ef4444' : '#22c55e' }">
                {{ isBudgetExceeded ? t('budgetExceeded').value : `${t('budgetRemaining').value}: ${formatMoney(budgetRemaining)}` }}
              </div>
            </div>
            <div v-else text-center py-4 op-40>
              {{ t('noBudget').value }}
            </div>
          </c-card>

          <!-- Weekly Trend (mini bar chart) -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>📊 {{ t('trend').value }}</div>
            <div flex items-end gap-2 style="height: 120px">
              <div v-for="day in weeklyTrend" :key="day.date" flex-1 flex flex-col items-center justify-end h-full>
                <div v-if="day.expense > 0" text-xs mb-1 text-orange-400>{{ formatMoney(day.expense) }}</div>
                <div
                  w-full rounded-t-md
                  :style="{
                    height: `${Math.max(4, (day.expense / weeklyMaxExpense) * 80)}px`,
                    background: `linear-gradient(to top, rgba(249,115,22,0.8), rgba(249,115,22,0.3))`,
                    minHeight: '4px'
                  }"
                />
                <div text-xs op-40 mt-2>{{ day.label }}</div>
              </div>
            </div>
          </c-card>

          <!-- Category Breakdown -->
          <c-card mb-4 v-if="categoryBreakdown.length > 0">
            <div text-lg font-bold mb-3>📊 {{ t('topCategories').value }}</div>
            <div v-for="cat in categoryBreakdown" :key="cat.category" mb-3>
              <div flex items-center gap-3>
                <div text-xl>{{ cat.icon }}</div>
                <div flex-1>
                  <div flex justify-between mb-1>
                    <span text-sm font-bold>{{ cat.label }}</span>
                    <span text-sm op-60>{{ formatMoney(cat.amount) }} ({{ cat.percentage }}%)</span>
                  </div>
                  <div w-full h-2 rounded-full style="background: rgba(255,255,255,0.06)">
                    <div h-full rounded-full :style="{ width: `${cat.percentage}%`, background: getCategoryColor(cat.category) }" />
                  </div>
                </div>
              </div>
            </div>
          </c-card>

          <!-- Income Source Breakdown -->
          <c-card v-if="incomeBreakdown.length > 0">
            <div text-lg font-bold mb-3>📈 {{ t('incomeSource').value }}</div>
            <div v-for="cat in incomeBreakdown" :key="cat.category" mb-3>
              <div flex items-center gap-3>
                <div text-xl>{{ cat.icon }}</div>
                <div flex-1>
                  <div flex justify-between mb-1>
                    <span text-sm font-bold>{{ cat.label }}</span>
                    <span text-sm op-60>{{ formatMoney(cat.amount) }} ({{ cat.percentage }}%)</span>
                  </div>
                  <div w-full h-2 rounded-full style="background: rgba(255,255,255,0.06)">
                    <div h-full rounded-full :style="{ width: `${cat.percentage}%`, background: getCategoryColor(cat.category) }" />
                  </div>
                </div>
              </div>
            </div>
          </c-card>
        </n-tab-pane>

        <n-tab-pane name="records" :tab="t('records').value">
          <!-- Search -->
          <div mb-4>
            <n-input
              v-model:value="searchQuery"
              :placeholder="t('searchPlaceholder').value"
              clearable
              size="large"
            >
              <template #prefix>🔍</template>
            </n-input>
          </div>

          <!-- Records List -->
          <div v-if="filteredRecords.length > 0">
            <div v-for="record in filteredRecords" :key="record.id" mb-3>
              <c-card :style="{ borderLeft: `4px solid ${record.type === 'expense' ? getCategoryColor(record.category) : '#22c55e'}` }">
                <div flex items-center justify-between gap-3>
                  <div flex items-center gap-3 flex-1 min-w-0>
                    <div text-2xl>{{ getCategoryIcon(record.category, record.type) }}</div>
                    <div min-w-0 flex-1>
                      <div flex items-center gap-2>
                        <span font-bold>{{ getCategoryLabel(record.category) }}</span>
                        <n-tag :type="record.type === 'expense' ? 'error' : 'success'" size="small" round>
                          {{ record.type === 'expense' ? t('expense').value : t('income').value }}
                        </n-tag>
                      </div>
                      <div text-sm op-50 mt-1>
                        {{ record.date }}
                        <span v-if="record.note" ml-2>· {{ record.note }}</span>
                      </div>
                    </div>
                  </div>
                  <div flex items-center gap-2>
                    <div text-lg font-bold :style="{ color: record.type === 'expense' ? '#ef4444' : '#22c55e' }">
                      {{ record.type === 'expense' ? '-' : '+' }}{{ formatMoney(record.amount) }}
                    </div>
                    <n-button size="tiny" quaternary circle @click="openEditModal(record)">✏️</n-button>
                    <n-popconfirm @positive-click="deleteRecord(record.id)">
                      <template #trigger>
                        <n-button size="tiny" quaternary circle type="error">🗑️</n-button>
                      </template>
                      {{ t('deleteConfirm').value }}
                    </n-popconfirm>
                  </div>
                </div>
              </c-card>
            </div>
          </div>
          <c-card v-else>
            <div text-center py-8 op-40>
              <div text-4xl mb-3>📝</div>
              <div text-lg>{{ t('noRecords').value }}</div>
            </div>
          </c-card>
        </n-tab-pane>

        <n-tab-pane name="stats" :tab="t('stats').value">
          <!-- Monthly Trend Bar Chart -->
          <c-card mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('monthTrend').value }}</div>
            <div flex items-end gap-3 style="height: 160px">
              <div v-for="month in monthlyTrend" :key="month.label" flex-1 flex flex-col items-center justify-end h-full>
                <div v-if="month.expense > 0" text-xs mb-1 text-orange-400>{{ formatMoney(month.expense) }}</div>
                <div
                  w-full rounded-t-md
                  :style="{
                    height: `${Math.max(4, (month.expense / monthlyMaxExpense) * 120)}px`,
                    background: `linear-gradient(to top, rgba(249,115,22,0.8), rgba(249,115,22,0.3))`,
                    minHeight: '4px'
                  }"
                />
                <div text-xs op-40 mt-2>{{ month.label }}</div>
              </div>
            </div>
          </c-card>

          <!-- Category Breakdown (full) -->
          <c-card mb-4 v-if="categoryBreakdown.length > 0">
            <div text-lg font-bold mb-4>📊 {{ t('categoryBreakdown').value }}</div>
            <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
              <n-gi v-for="cat in categoryBreakdown" :key="cat.category" span="2 m:1">
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08)">
                  <div flex items-center gap-2 mb-2>
                    <div text-xl>{{ cat.icon }}</div>
                    <span font-bold>{{ cat.label }}</span>
                  </div>
                  <div flex justify-between text-sm mb-1>
                    <span op-60>{{ formatMoney(cat.amount) }}</span>
                    <span font-bold :style="{ color: getCategoryColor(cat.category) }">{{ cat.percentage }}%</span>
                  </div>
                  <div w-full h-2 rounded-full style="background: rgba(255,255,255,0.06)">
                    <div h-full rounded-full :style="{ width: `${cat.percentage}%`, background: getCategoryColor(cat.category) }" />
                  </div>
                </div>
              </n-gi>
            </n-grid>
          </c-card>

          <!-- Month comparison -->
          <c-card v-if="lastMonthExpenseTotal > 0">
            <div text-lg font-bold mb-3>{{ t('lastMonth').value }} vs {{ t('thisMonth').value }}</div>
            <div flex gap-4>
              <div flex-1 p-4 rounded-lg style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)">
                <div text-sm op-60>{{ t('lastMonth').value }}</div>
                <div text-xl font-bold>{{ formatMoney(lastMonthExpenseTotal) }}</div>
              </div>
              <div flex-1 p-4 rounded-lg style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)">
                <div text-sm op-60>{{ t('thisMonth').value }}</div>
                <div text-xl font-bold>{{ formatMoney(thisMonthExpenseTotal) }}</div>
              </div>
            </div>
            <div mt-2 text-center>
              <span v-if="lastMonthExpenseTotal > 0" text-sm :style="{ color: thisMonthExpenseTotal > lastMonthExpenseTotal ? '#ef4444' : '#22c55e' }">
                {{ thisMonthExpenseTotal > lastMonthExpenseTotal ? '↑' : '↓' }}
                {{ Math.abs(Math.round(((thisMonthExpenseTotal - lastMonthExpenseTotal) / lastMonthExpenseTotal) * 100)) }}%
                {{ lang === 'zh' ? (thisMonthExpenseTotal > lastMonthExpenseTotal ? '增加' : '减少') : (thisMonthExpenseTotal > lastMonthExpenseTotal ? 'increase' : 'decrease') }}
              </span>
            </div>
          </c-card>
        </n-tab-pane>

        <n-tab-pane name="settings" :tab="t('settings').value">
          <c-card mb-4>
            <div text-lg font-bold mb-4>{{ t('currency').value }}</div>
            <div flex gap-3>
              <n-button
                v-for="cur in [{ label: t('currencyCN').value, value: '¥' }, { label: t('currencyUS').value, value: '$' }, { label: t('currencyEU').value, value: '€' }, { label: t('currencyJP').value, value: '¥' }]"
                :key="cur.value + cur.label"
                :type="currencySymbol === cur.value ? 'primary' : 'default'"
                @click="setCurrency(cur.value)"
                size="large"
              >
                {{ cur.label }}
              </n-button>
            </div>
          </c-card>

          <c-card mb-4>
            <div text-lg font-bold mb-4>{{ t('budget').value }}</div>
            <div flex items-center gap-3 mb-3>
              <span>{{ t('setBudget').value }}: {{ monthlyBudget > 0 ? formatMoney(monthlyBudget) : t('noBudget').value }}</span>
              <n-button size="small" @click="openBudgetModal">{{ t('setBudget').value }}</n-button>
            </div>
          </c-card>

          <c-card mb-4>
            <div text-lg font-bold mb-4>📦 {{ lang === 'zh' ? '数据管理' : 'Data Management' }}</div>
            <div flex flex-wrap gap-3>
              <n-button @click="exportData" size="large">
                📤 {{ t('exportData').value }}
              </n-button>
              <n-button @click="handleImportData" size="large">
                📥 {{ t('importData').value }}
              </n-button>
              <n-popconfirm @positive-click="clearAllData">
                <template #trigger>
                  <n-button type="error" size="large">
                    🗑️ {{ t('clearAll').value }}
                  </n-button>
                </template>
                {{ t('clearAllConfirm').value }}
              </n-popconfirm>
            </div>
          </c-card>
        </n-tab-pane>
      </n-tabs>

      <!-- Add/Edit Modal -->
      <n-modal v-model:show="showModal" preset="card" :title="editingId ? t('editExpense').value : t('addExpense').value" style="max-width: 480px">
        <n-form>
          <!-- Type Toggle -->
          <n-form-item :label="t('type').value">
            <div flex gap-2>
              <n-button
                :type="formType === 'expense' ? 'error' : 'default'"
                @click="formType = 'expense'; formCategory = expenseCategories[0]?.value || 'food'"
                round
                size="large"
              >
                📉 {{ t('expense').value }}
              </n-button>
              <n-button
                :type="formType === 'income' ? 'success' : 'default'"
                @click="formType = 'income'; formCategory = incomeCategories[0]?.value || 'salary'"
                round
                size="large"
              >
                📈 {{ t('income').value }}
              </n-button>
            </div>
          </n-form-item>

          <!-- Amount -->
          <n-form-item :label="t('amount').value">
            <n-input
              v-model:value="formAmount"
              :placeholder="t('amountPlaceholder').value"
              size="large"
              type="number"
              :prefix="currencySymbol"
            />
          </n-form-item>

          <!-- Category -->
          <n-form-item :label="t('category').value">
            <div flex flex-wrap gap-2>
              <div
                v-for="cat in currentCategories"
                :key="cat.value"
                p-2 px-3 rounded-lg cursor-pointer flex items-center gap-1
                :style="{
                  background: formCategory === cat.value ? (formType === 'expense' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)') : 'rgba(255,255,255,0.05)',
                  border: formCategory === cat.value ? (formType === 'expense' ? '2px solid rgba(239,68,68,0.6)' : '2px solid rgba(34,197,94,0.6)') : '1px solid rgba(255,255,255,0.1)',
                }"
                @click="formCategory = cat.value"
              >
                <span>{{ cat.icon }}</span>
                <span text-sm>{{ cat.label }}</span>
              </div>
            </div>
          </n-form-item>

          <!-- Date -->
          <n-form-item :label="t('date').value">
            <n-date-picker v-model:value="formDate" type="date" size="large" style="width: 100%" />
          </n-form-item>

          <!-- Note -->
          <n-form-item :label="t('note').value">
            <n-input v-model:value="formNote" :placeholder="t('notePlaceholder').value" size="large" />
          </n-form-item>
        </n-form>

        <template #footer>
          <div flex justify-end gap-2>
            <n-button @click="showModal = false">{{ t('cancel').value }}</n-button>
            <n-button :type="formType === 'expense' ? 'error' : 'success'" @click="saveRecord" :disabled="!formAmount || parseFloat(formAmount) <= 0">
              {{ t('save').value }}
            </n-button>
          </div>
        </template>
      </n-modal>

      <!-- Budget Modal -->
      <n-modal v-model:show="showBudgetModal" preset="card" :title="t('setBudget').value" style="max-width: 400px">
        <n-form>
          <n-form-item :label="t('budget').value">
            <n-input
              v-model:value="budgetInput"
              :placeholder="t('budgetPlaceholder').value"
              size="large"
              type="number"
              :prefix="currencySymbol"
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <div flex justify-end gap-2>
            <n-button @click="showBudgetModal = false">{{ t('cancel').value }}</n-button>
            <n-button type="primary" @click="saveBudget">{{ t('save').value }}</n-button>
          </div>
        </template>
      </n-modal>
    </div>
  </div>
</template>

<style scoped>
</style>
