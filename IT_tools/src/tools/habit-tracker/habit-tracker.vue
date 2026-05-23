<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useStorage } from '@vueuse/core';

// i18n labels
const labels = {
  zh: {
    title: '习惯追踪器',
    addHabit: '添加习惯',
    habitName: '习惯名称',
    habitNamePlaceholder: '输入习惯名称...',
    icon: '图标',
    frequency: '频率',
    daily: '每天',
    weekly: '每周',
    color: '主题色',
    add: '添加',
    myHabits: '我的习惯',
    empty: '暂无习惯，点击上方添加一个吧',
    streak: '连续',
    days: '天',
    bestStreak: '最长连续',
    todayCheckin: '今日打卡',
    checkedIn: '已打卡 ✓',
    weekProgress: '本周进度',
    completionRate: '完成率',
    totalCheckins: '总打卡',
    todayStats: '今日统计',
    completed: '已完成',
    pending: '待完成',
    allDone: '今日习惯全部完成！🎉',
    delete: '删除',
    deleteConfirm: '确定删除这个习惯吗？所有打卡记录将丢失。',
    resetStreak: '重置连续',
    category: '分类',
    categoryHealth: '健康',
    categoryStudy: '学习',
    categoryWork: '工作',
    categoryLife: '生活',
    categoryOther: '其他',
    presets: '快捷模板',
    presetExercise: '运动锻炼',
    presetReading: '阅读学习',
    presetWater: '喝8杯水',
    presetEarlyRise: '早起',
    presetMeditation: '冥想',
    presetJournal: '写日记',
    presetNoPhone: '减少手机',
    presetVitamin: '吃维生素',
    monthlyView: '月度视图',
    checked: '已打卡',
    missed: '未打卡',
    future: '未来',
    thisMonth: '本月',
    lastMonth: '上月',
    habitsCount: '习惯数',
    activeDays: '活跃天数',
    motivation: '每日一言',
    motivation1: '坚持就是胜利，每天进步一点点',
    motivation2: '好习惯是成功的阶梯',
    motivation3: '不积跬步，无以至千里',
    motivation4: '自律给我自由',
    motivation5: '今天的努力，明天的收获',
    motivation6: '每一次打卡都是对自己的承诺',
    motivation7: '习惯决定命运，行动改变人生',
  },
  en: {
    title: 'Habit Tracker',
    addHabit: 'Add Habit',
    habitName: 'Habit Name',
    habitNamePlaceholder: 'Enter habit name...',
    icon: 'Icon',
    frequency: 'Frequency',
    daily: 'Daily',
    weekly: 'Weekly',
    color: 'Theme Color',
    add: 'Add',
    myHabits: 'My Habits',
    empty: 'No habits yet. Add one above!',
    streak: 'Streak',
    days: 'days',
    bestStreak: 'Best Streak',
    todayCheckin: 'Check In',
    checkedIn: 'Done ✓',
    weekProgress: 'This Week',
    completionRate: 'Completion',
    totalCheckins: 'Total Check-ins',
    todayStats: 'Today\'s Stats',
    completed: 'Completed',
    pending: 'Pending',
    allDone: 'All habits completed today! 🎉',
    delete: 'Delete',
    deleteConfirm: 'Delete this habit? All check-in records will be lost.',
    resetStreak: 'Reset Streak',
    category: 'Category',
    categoryHealth: 'Health',
    categoryStudy: 'Study',
    categoryWork: 'Work',
    categoryLife: 'Life',
    categoryOther: 'Other',
    presets: 'Quick Presets',
    presetExercise: 'Exercise',
    presetReading: 'Reading',
    presetWater: 'Drink 8 Glasses',
    presetEarlyRise: 'Wake Up Early',
    presetMeditation: 'Meditation',
    presetJournal: 'Journal',
    presetNoPhone: 'Less Screen Time',
    presetVitamin: 'Take Vitamins',
    monthlyView: 'Monthly View',
    checked: 'Checked',
    missed: 'Missed',
    future: 'Future',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    habitsCount: 'Habits',
    activeDays: 'Active Days',
    motivation: 'Daily Motivation',
    motivation1: 'Consistency is key, improve a little each day',
    motivation2: 'Good habits are the staircase to success',
    motivation3: 'Small steps lead to great journeys',
    motivation4: 'Discipline brings freedom',
    motivation5: 'Today\'s effort, tomorrow\'s reward',
    motivation6: 'Every check-in is a promise to yourself',
    motivation7: 'Habits shape destiny, actions change life',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Types
interface HabitItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  category: 'health' | 'study' | 'work' | 'life' | 'other';
  createdAt: string;
  checkins: string[]; // ISO date strings (YYYY-MM-DD)
}

// State
const habits = useStorage<HabitItem[]>('habit-tracker-items', []);
const newName = ref('');
const newIcon = ref('🎯');
const newColor = ref('#18a058');
const newFrequency = ref<'daily' | 'weekly'>('daily');
const newCategory = ref<'health' | 'study' | 'work' | 'life' | 'other'>('life');
const showAddModal = ref(false);
const selectedHabitId = ref<string | null>(null);
const today = ref(getTodayStr());

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Icon options
const iconOptions = ['🎯', '💪', '📚', '💧', '🌅', '🧘', '✍️', '🏃', '🍎', '💊', '🎵', '🧹', '💰', '📱', '🚶', '💤', '🥗', '🎨', '📝', '🏋️'];

// Color presets
const colorPresets = [
  '#18a058', '#2080f0', '#f0a020', '#e03050', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#14b8a6',
];

// Category options
const categoryOptions = computed(() => [
  { label: labels[lang.value].categoryHealth, value: 'health' },
  { label: labels[lang.value].categoryStudy, value: 'study' },
  { label: labels[lang.value].categoryWork, value: 'work' },
  { label: labels[lang.value].categoryLife, value: 'life' },
  { label: labels[lang.value].categoryOther, value: 'other' },
]);

// Preset habits
const presetHabits = computed(() => [
  { name: labels[lang.value].presetExercise, icon: '🏃', color: '#e03050', category: 'health' as const },
  { name: labels[lang.value].presetReading, icon: '📚', color: '#2080f0', category: 'study' as const },
  { name: labels[lang.value].presetWater, icon: '💧', color: '#06b6d4', category: 'health' as const },
  { name: labels[lang.value].presetEarlyRise, icon: '🌅', color: '#f0a020', category: 'life' as const },
  { name: labels[lang.value].presetMeditation, icon: '🧘', color: '#8b5cf6', category: 'health' as const },
  { name: labels[lang.value].presetJournal, icon: '✍️', color: '#6366f1', category: 'life' as const },
  { name: labels[lang.value].presetNoPhone, icon: '📱', color: '#f97316', category: 'life' as const },
  { name: labels[lang.value].presetVitamin, icon: '💊', color: '#14b8a6', category: 'health' as const },
]);

// Add habit
const addHabit = () => {
  if (!newName.value.trim()) return;
  const habit: HabitItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: newName.value.trim(),
    icon: newIcon.value,
    color: newColor.value,
    frequency: newFrequency.value,
    category: newCategory.value,
    createdAt: new Date().toISOString(),
    checkins: [],
  };
  habits.value.push(habit);
  newName.value = '';
  newIcon.value = '🎯';
  newColor.value = '#18a058';
  newFrequency.value = 'daily';
  newCategory.value = 'life';
  showAddModal.value = false;
};

// Add from preset
const addFromPreset = (preset: typeof presetHabits.value[0]) => {
  const habit: HabitItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: preset.name,
    icon: preset.icon,
    color: preset.color,
    frequency: 'daily',
    category: preset.category,
    createdAt: new Date().toISOString(),
    checkins: [],
  };
  // Check duplicate
  if (habits.value.some(h => h.name === preset.name)) return;
  habits.value.push(habit);
};

// Toggle check-in
const toggleCheckin = (habitId: string) => {
  const habit = habits.value.find(h => h.id === habitId);
  if (!habit) return;
  const todayStr = today.value;
  const idx = habit.checkins.indexOf(todayStr);
  if (idx >= 0) {
    habit.checkins.splice(idx, 1);
  } else {
    habit.checkins.push(todayStr);
  }
};

// Check if habit is checked in today
const isCheckedToday = (habit: HabitItem) => {
  return habit.checkins.includes(today.value);
};

// Calculate streak for a habit
const calcStreak = (habit: HabitItem): number => {
  const sorted = [...habit.checkins].sort().reverse();
  if (sorted.length === 0) return 0;

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(current);
    if (sorted.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    current.setDate(current.getDate() - 1);
  }
  return streak;
};

// Calculate best streak
const calcBestStreak = (habit: HabitItem): number => {
  const sorted = [...habit.checkins].sort();
  if (sorted.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.abs(diff - 1) < 0.5) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
};

// Format date as YYYY-MM-DD
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Get week dates (Mon-Sun)
const getWeekDates = () => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
};

// Week day labels
const weekDayLabels = computed(() => {
  if (lang.value === 'zh') return ['一', '二', '三', '四', '五', '六', '日'];
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
});

// Get habit's week data
const getHabitWeekData = (habit: HabitItem) => {
  const weekDates = getWeekDates();
  return weekDates.map(date => ({
    date,
    checked: habit.checkins.includes(date),
  }));
};

// Today stats
const todayStats = computed(() => {
  const total = habits.value.length;
  const done = habits.value.filter(h => h.checkins.includes(today.value)).length;
  return { total, done, pending: total - done };
});

// Overall completion rate (last 30 days)
const overallCompletionRate = computed(() => {
  if (habits.value.length === 0) return 0;
  const last30 = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last30.push(formatDate(d));
  }
  let total = 0;
  let done = 0;
  for (const habit of habits.value) {
    for (const date of last30) {
      if (new Date(habit.createdAt) <= new Date(date)) {
        total++;
        if (habit.checkins.includes(date)) done++;
      }
    }
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
});

// Total check-ins across all habits
const totalAllCheckins = computed(() => {
  return habits.value.reduce((sum, h) => sum + h.checkins.length, 0);
});

// Active days (days with at least one check-in, last 30 days)
const activeDays = computed(() => {
  const allDates = new Set<string>();
  habits.value.forEach(h => h.checkins.forEach(d => allDates.add(d)));
  const last30 = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = formatDate(d);
    if (allDates.has(ds)) last30.push(ds);
  }
  return last30.length;
});

// Monthly view data
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());

const monthDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: { date: string; day: number; isToday: boolean; isFuture: boolean }[] = [];

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = formatDate(date);
    days.push({
      date: dateStr,
      day: d,
      isToday: dateStr === today.value,
      isFuture: date > new Date(),
    });
  }
  return days;
});

const monthStartDayOfWeek = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const day = firstDay.getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
});

const monthName = computed(() => {
  if (lang.value === 'zh') return `${currentYear.value}年${currentMonth.value + 1}月`;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[currentMonth.value]} ${currentYear.value}`;
});

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// Get day checkin count in month view
const getDayCheckinCount = (dateStr: string) => {
  return habits.value.filter(h => h.checkins.includes(dateStr)).length;
};

// Daily motivation
const dailyMotivation = computed(() => {
  const dayOfWeek = new Date().getDay();
  const keys: (keyof typeof labels.zh)[] = [
    'motivation1', 'motivation2', 'motivation3', 'motivation4',
    'motivation5', 'motivation6', 'motivation7',
  ];
  return labels[lang.value][keys[dayOfWeek % keys.length]];
});

// Delete habit
const deleteHabit = (id: string) => {
  const idx = habits.value.findIndex(h => h.id === id);
  if (idx >= 0) habits.value.splice(idx, 1);
};

// Sort habits by today's status (unchecked first), then by streak
const sortedHabits = computed(() => {
  return [...habits.value].sort((a, b) => {
    const aChecked = isCheckedToday(a);
    const bChecked = isCheckedToday(b);
    if (aChecked !== bChecked) return aChecked ? 1 : -1;
    return calcStreak(b) - calcStreak(a);
  });
});
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

      <!-- Motivation Banner -->
      <c-card mb-4>
        <div flex items-center gap-3>
          <div text-3xl>🌱</div>
          <div>
            <div text-sm op-60>{{ t('motivation').value }}</div>
            <div text-base font-bold mt-1>{{ dailyMotivation.value }}</div>
          </div>
        </div>
      </c-card>

      <!-- Today Stats Overview -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('todayStats').value }}</div>
        <n-grid :cols="4" :x-gap="12" :y-gap="8" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(24,160,88,0.2), rgba(24,160,88,0.1)); border: 1px solid rgba(24,160,88,0.3)">
              <div text-sm op-60>{{ t('habitsCount').value }}</div>
              <div text-3xl font-bold text-green-400>{{ todayStats.value.total }}</div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1)); border: 1px solid rgba(59,130,246,0.3)">
              <div text-sm op-60>{{ t('completed').value }}</div>
              <div text-3xl font-bold text-blue-400>{{ todayStats.value.done }}</div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(240,160,32,0.2), rgba(240,160,32,0.1)); border: 1px solid rgba(240,160,32,0.3)">
              <div text-sm op-60>{{ t('pending').value }}</div>
              <div text-3xl font-bold text-yellow-400>{{ todayStats.value.pending }}</div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.1)); border: 1px solid rgba(139,92,246,0.3)">
              <div text-sm op-60>{{ t('completionRate').value }}</div>
              <div text-3xl font-bold text-purple-400>{{ overallCompletionRate.value }}%</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- All done banner -->
        <div v-if="todayStats.value.total > 0 && todayStats.value.pending === 0" mt-4 p-3 rounded-lg text-center
          style="background: linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1)); border: 1px solid rgba(34,197,94,0.4)">
          <div text-lg font-bold text-green-400>{{ t('allDone').value }}</div>
        </div>

        <!-- Progress bar -->
        <div v-if="todayStats.value.total > 0" mt-4>
          <n-progress
            :percentage="todayStats.value.total > 0 ? Math.round((todayStats.value.done / todayStats.value.total) * 100) : 0"
            :color="'#18a058'"
            :rail-color="'rgba(255,255,255,0.08)'"
            :height="10"
            :border-radius="5"
          />
        </div>
      </c-card>

      <!-- Quick Presets -->
      <c-card mb-4 v-if="habits.length === 0">
        <div text-lg font-bold mb-3>{{ t('presets').value }}</div>
        <div flex flex-wrap gap-2>
          <n-button
            v-for="preset in presetHabits"
            :key="preset.name"
            @click="addFromPreset(preset)"
            size="large"
            :style="{ borderColor: preset.color + '55', color: preset.color }"
            ghost
          >
            {{ preset.icon }} {{ preset.name }}
          </n-button>
        </div>
      </c-card>

      <!-- Add Habit Button -->
      <div mb-4 flex justify-center>
        <n-button type="primary" size="large" @click="showAddModal = true" round>
          <template #icon>➕</template>
          {{ t('addHabit').value }}
        </n-button>
      </div>

      <!-- Habits List -->
      <div v-if="sortedHabits.length > 0">
        <div text-lg font-bold mb-3>{{ t('myHabits').value }}</div>
        <div v-for="habit in sortedHabits" :key="habit.id" mb-3>
          <c-card :style="{ borderLeft: `4px solid ${habit.color}` }">
            <div flex items-center justify-between gap-3>
              <!-- Left: Icon + Name + Streak -->
              <div flex items-center gap-3 flex-1 min-w-0>
                <div text-2xl>{{ habit.icon }}</div>
                <div min-w-0 flex-1>
                  <div flex items-center gap-2>
                    <span font-bold text-base truncate>{{ habit.name }}</span>
                    <n-tag size="small" :type="isCheckedToday(habit) ? 'success' : 'default'" round>
                      {{ isCheckedToday(habit) ? t('checkedIn').value : t('todayCheckin').value }}
                    </n-tag>
                  </div>
                  <div flex items-center gap-4 mt-1 text-sm op-60>
                    <span>🔥 {{ t('streak').value }} <span font-bold :style="{ color: habit.color }">{{ calcStreak(habit) }}</span> {{ t('days').value }}</span>
                    <span>🏆 {{ t('bestStreak').value }} <span font-bold>{{ calcBestStreak(habit) }}</span></span>
                    <span>📊 {{ t('totalCheckins').value }} <span font-bold>{{ habit.checkins.length }}</span></span>
                  </div>
                </div>
              </div>

              <!-- Right: Check-in Button -->
              <div flex items-center gap-2>
                <n-button
                  :type="isCheckedToday(habit) ? 'success' : 'default'"
                  size="large"
                  round
                  @click="toggleCheckin(habit.id)"
                  :style="isCheckedToday(habit) ? { background: habit.color, borderColor: habit.color } : {}"
                >
                  {{ isCheckedToday(habit) ? '✓' : t('todayCheckin').value }}
                </n-button>
                <n-popconfirm @positive-click="deleteHabit(habit.id)">
                  <template #trigger>
                    <n-button size="small" quaternary circle type="error">
                      <template #icon>🗑️</template>
                    </n-button>
                  </template>
                  {{ t('deleteConfirm').value }}
                </n-popconfirm>
              </div>
            </div>

            <!-- Week Progress -->
            <div mt-3>
              <div text-xs op-50 mb-1>{{ t('weekProgress').value }}</div>
              <div flex gap-1>
                <div v-for="(wd, idx) in getHabitWeekData(habit)" :key="wd.date"
                  flex-1 flex flex-col items-center gap-1>
                  <div
                    w-full h-8 rounded-md flex items-center justify-center text-sm font-bold
                    :style="{
                      background: wd.checked ? habit.color + '44' : 'rgba(255,255,255,0.05)',
                      border: wd.date === today ? `2px solid ${habit.color}` : '1px solid rgba(255,255,255,0.08)',
                      color: wd.checked ? habit.color : 'rgba(255,255,255,0.3)',
                    }"
                  >
                    {{ wd.checked ? '✓' : '' }}
                  </div>
                  <div text-xs op-40>{{ weekDayLabels.value[idx] }}</div>
                </div>
              </div>
            </div>
          </c-card>
        </div>
      </div>

      <!-- Empty State -->
      <c-card v-else-if="habits.length === 0 && !showAddModal">
        <div text-center py-8 op-50>
          <div text-4xl mb-3>🌱</div>
          <div text-lg>{{ t('empty').value }}</div>
        </div>
      </c-card>

      <!-- Monthly View -->
      <c-card v-if="habits.length > 0" mt-4>
        <div flex items-center justify-between mb-3>
          <div text-lg font-bold>{{ t('monthlyView').value }}</div>
          <div flex items-center gap-2>
            <n-button size="small" quaternary circle @click="prevMonth">◀</n-button>
            <span font-bold min-w-32 text-center>{{ monthName.value }}</span>
            <n-button size="small" quaternary circle @click="nextMonth">▶</n-button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div grid grid-cols-7 gap-1>
          <!-- Header -->
          <div v-for="d in weekDayLabels.value" :key="d" text-center text-xs op-40 py-1>{{ d }}</div>

          <!-- Empty cells before month start -->
          <div v-for="i in monthStartDayOfWeek.value" :key="'empty-' + i" />

          <!-- Day cells -->
          <div v-for="day in monthDays.value" :key="day.date"
            rounded-lg p-1 text-center
            :style="{
              background: day.isFuture ? 'rgba(255,255,255,0.02)' : getDayCheckinCount(day.date) > 0
                ? `rgba(24,160,88,${Math.min(0.5, getDayCheckinCount(day.date) * 0.15 + 0.05)})`
                : 'rgba(255,255,255,0.04)',
              border: day.isToday ? '2px solid #18a058' : '1px solid rgba(255,255,255,0.06)',
              opacity: day.isFuture ? 0.4 : 1,
            }"
          >
            <div text-sm :class="{ 'font-bold text-green-400': day.isToday }">{{ day.day }}</div>
            <div v-if="!day.isFuture && getDayCheckinCount(day.date) > 0" text-xs text-green-400>
              {{ getDayCheckinCount(day.date) }}/{{ habits.length }}
            </div>
            <div v-else-if="!day.isFuture && habits.length > 0 && new Date(day.date) < new Date()" text-xs op-20>
              ·
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div flex items-center justify-center gap-4 mt-3 text-xs op-50>
          <div flex items-center gap-1>
            <div w-3 h-3 rounded style="background: rgba(24,160,88,0.5)"></div>
            <span>{{ t('checked').value }}</span>
          </div>
          <div flex items-center gap-1>
            <div w-3 h-3 rounded style="background: rgba(255,255,255,0.04)"></div>
            <span>{{ t('missed').value }}</span>
          </div>
          <div flex items-center gap-1>
            <div w-3 h-3 rounded style="background: rgba(255,255,255,0.02); opacity: 0.4"></div>
            <span>{{ t('future').value }}</span>
          </div>
        </div>
      </c-card>

      <!-- Add Habit Modal -->
      <n-modal v-model:show="showAddModal" preset="card" :title="t('addHabit').value" style="max-width: 500px">
        <n-form>
          <n-form-item :label="t('habitName').value">
            <n-input v-model:value="newName" :placeholder="t('habitNamePlaceholder').value" size="large" />
          </n-form-item>

          <n-form-item :label="t('icon').value">
            <div flex flex-wrap gap-2>
              <div
                v-for="ico in iconOptions" :key="ico"
                w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer text-xl
                :style="{
                  background: newIcon === ico ? 'rgba(24,160,88,0.3)' : 'rgba(255,255,255,0.05)',
                  border: newIcon === ico ? '2px solid #18a058' : '1px solid rgba(255,255,255,0.1)',
                }"
                @click="newIcon = ico"
              >
                {{ ico }}
              </div>
            </div>
          </n-form-item>

          <n-form-item :label="t('color').value">
            <div flex gap-2>
              <div
                v-for="clr in colorPresets" :key="clr"
                w-8 h-8 rounded-full cursor-pointer
                :style="{
                  background: clr,
                  border: newColor === clr ? '3px solid white' : '2px solid rgba(255,255,255,0.2)',
                  transform: newColor === clr ? 'scale(1.2)' : 'scale(1)',
                }"
                @click="newColor = clr"
              />
            </div>
          </n-form-item>

          <n-grid :cols="2" :x-gap="12">
            <n-gi>
              <n-form-item :label="t('frequency').value">
                <n-select v-model:value="newFrequency" :options="[
                  { label: labels[lang.value].daily, value: 'daily' },
                  { label: labels[lang.value].weekly, value: 'weekly' },
                ]" size="large" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('category').value">
                <n-select v-model:value="newCategory" :options="categoryOptions.value" size="large" />
              </n-form-item>
            </n-gi>
          </n-grid>
        </n-form>

        <template #footer>
          <div flex justify-end gap-2>
            <n-button @click="showAddModal = false">{{ lang === 'zh' ? '取消' : 'Cancel' }}</n-button>
            <n-button type="primary" @click="addHabit" :disabled="!newName.trim()">{{ t('add').value }}</n-button>
          </div>
        </template>
      </n-modal>

    </div>
  </div>
</template>

<style scoped>
</style>
