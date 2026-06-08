<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useStorage } from '@vueuse/core';

// ============ i18n Labels ============
const labels = {
  zh: {
    title: '心情追踪器',
    subtitle: '记录心情，了解自己，拥抱每一天',
    todayMood: '今日心情',
    selectMood: '你今天感觉如何？',
    amazing: '超棒',
    good: '不错',
    okay: '还行',
    bad: '不好',
    awful: '很差',
    note: '写点日记',
    notePlaceholder: '今天发生了什么？记录一下...',
    activities: '今日活动',
    save: '保存记录',
    saved: '已保存 ✓',
    update: '更新记录',
    moodLog: '心情记录',
    emptyLog: '暂无记录，记录你的第一个心情吧',
    trendChart: '心情趋势',
    weekAvg: '本周均值',
    monthAvg: '本月均值',
    moodDistribution: '心情分布',
    insights: '心情洞察',
    bestDay: '最佳心情日',
    worstDay: '最低心情日',
    mostActivity: '最常活动',
    bestActivity: '最佳搭配',
    totalEntries: '总记录数',
    currentStreak: '连续记录',
    bestStreak: '最长连续',
    avgMood: '平均心情',
    delete: '删除',
    deleteConfirm: '确定删除这条记录吗？',
    thisWeek: '本周',
    thisMonth: '本月',
    all: '全部',
    mood5: '超棒 🤩',
    mood4: '不错 😊',
    mood3: '还行 😐',
    mood2: '不好 😟',
    mood1: '很差 😢',
    noInsight: '数据不足，继续记录来获取洞察',
    daysAgo: '天前',
    today: '今天',
    yesterday: '昨天',
    activityWork: '工作',
    activityStudy: '学习',
    activityExercise: '运动',
    activitySocial: '社交',
    activityRelax: '休闲',
    activityCreative: '创作',
    activityNature: '户外',
    activityCook: '烹饪',
    activityRead: '阅读',
    activityMusic: '音乐',
    activityGame: '游戏',
    activityMeditate: '冥想',
    activityShop: '购物',
    activityTravel: '旅行',
    activitySleep: '早睡',
    entries7d: '7天记录',
    entries30d: '30天记录',
    positiveDays: '积极天数',
    tipTitle: '小贴士',
    tip1: '每天记录心情，能帮助你更好地了解自己',
    tip2: '关注积极的活动，它们是快乐的来源',
    tip3: '心情低落时，试试做让你开心的活动',
    tip4: '保持记录习惯，洞察会越来越准确',
  },
  en: {
    title: 'Mood Tracker',
    subtitle: 'Track your mood, understand yourself, embrace each day',
    todayMood: 'Today\'s Mood',
    selectMood: 'How are you feeling today?',
    amazing: 'Amazing',
    good: 'Good',
    okay: 'Okay',
    bad: 'Bad',
    awful: 'Awful',
    note: 'Write a note',
    notePlaceholder: 'What happened today? Write it down...',
    activities: 'Activities',
    save: 'Save Entry',
    saved: 'Saved ✓',
    update: 'Update Entry',
    moodLog: 'Mood Log',
    emptyLog: 'No entries yet. Record your first mood!',
    trendChart: 'Mood Trend',
    weekAvg: 'Week Avg',
    monthAvg: 'Month Avg',
    moodDistribution: 'Mood Distribution',
    insights: 'Mood Insights',
    bestDay: 'Best Mood Day',
    worstDay: 'Lowest Mood Day',
    mostActivity: 'Most Frequent',
    bestActivity: 'Best Activity',
    totalEntries: 'Total Entries',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    avgMood: 'Avg Mood',
    delete: 'Delete',
    deleteConfirm: 'Delete this entry?',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    all: 'All',
    mood5: 'Amazing 🤩',
    mood4: 'Good 😊',
    mood3: 'Okay 😐',
    mood2: 'Bad 😟',
    mood1: 'Awful 😢',
    noInsight: 'Not enough data. Keep logging to unlock insights!',
    daysAgo: 'days ago',
    today: 'Today',
    yesterday: 'Yesterday',
    activityWork: 'Work',
    activityStudy: 'Study',
    activityExercise: 'Exercise',
    activitySocial: 'Social',
    activityRelax: 'Relax',
    activityCreative: 'Creative',
    activityNature: 'Nature',
    activityCook: 'Cooking',
    activityRead: 'Reading',
    activityMusic: 'Music',
    activityGame: 'Gaming',
    activityMeditate: 'Meditation',
    activityShop: 'Shopping',
    activityTravel: 'Travel',
    activitySleep: 'Early Sleep',
    entries7d: '7-Day Entries',
    entries30d: '30-Day Entries',
    positiveDays: 'Positive Days',
    tipTitle: 'Tips',
    tip1: 'Daily mood tracking helps you understand yourself better',
    tip2: 'Focus on positive activities — they are sources of joy',
    tip3: 'When feeling down, try activities that make you happy',
    tip4: 'Keep the habit, insights will become more accurate',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ============ Types ============
interface MoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
  activities: string[];
  createdAt: string;
}

// ============ Activity Definitions ============
const activityDefs = [
  { key: 'work', icon: '💼', color: '#3b82f6' },
  { key: 'study', icon: '📚', color: '#8b5cf6' },
  { key: 'exercise', icon: '🏃', color: '#ef4444' },
  { key: 'social', icon: '👥', color: '#f97316' },
  { key: 'relax', icon: '🛋️', color: '#06b6d4' },
  { key: 'creative', icon: '🎨', color: '#ec4899' },
  { key: 'nature', icon: '🌿', color: '#22c55e' },
  { key: 'cook', icon: '🍳', color: '#f59e0b' },
  { key: 'read', icon: '📖', color: '#6366f1' },
  { key: 'music', icon: '🎵', color: '#14b8a6' },
  { key: 'game', icon: '🎮', color: '#a855f7' },
  { key: 'meditate', icon: '🧘', color: '#0ea5e9' },
  { key: 'shop', icon: '🛍️', color: '#f43f5e' },
  { key: 'travel', icon: '✈️', color: '#6d28d9' },
  { key: 'sleep', icon: '💤', color: '#475569' },
];

const activityLabelMap: Record<string, Record<string, string>> = {};
activityDefs.forEach(a => {
  const key = `activity${a.key.charAt(0).toUpperCase() + a.key.slice(1)}` as keyof typeof labels.zh;
  activityLabelMap[a.key] = {
    zh: labels.zh[key] || a.key,
    en: labels.en[key] || a.key,
  };
});

// ============ Mood Config ============
const moodConfig = [
  { level: 5, emoji: '🤩', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  { level: 4, emoji: '😊', color: '#84cc16', bg: 'rgba(132,204,22,0.15)' },
  { level: 3, emoji: '😐', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  { level: 2, emoji: '😟', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { level: 1, emoji: '😢', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
];

function getMoodConfig(level: number) {
  return moodConfig.find(m => m.level === level) || moodConfig[2];
}

function getActivityLabel(key: string) {
  return activityLabelMap[key]?.[lang.value] || key;
}

// ============ State ============
const entries = useStorage<MoodEntry[]>('mood-tracker-entries', []);
const selectedMood = ref<1 | 2 | 3 | 4 | 5 | null>(null);
const noteText = ref('');
const selectedActivities = ref<string[]>([]);
const viewFilter = ref<'week' | 'month' | 'all'>('month');

// ============ Helpers ============
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateStr(dateStr: string) {
  const today = getTodayStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  if (dateStr === today) return t('today').value;
  if (dateStr === yesterday) return t('yesterday').value;

  const d = new Date(dateStr);
  const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 30) return `${diff} ${t('daysAgo').value}`;

  if (lang.value === 'zh') {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============ Today's Entry ============
const todayEntry = computed(() => {
  const today = getTodayStr();
  return entries.value.find(e => e.date === today) || null;
});

const isTodaySaved = computed(() => todayEntry.value !== null);

// Load today's entry if exists
onMounted(() => {
  if (todayEntry.value) {
    selectedMood.value = todayEntry.value.mood;
    noteText.value = todayEntry.value.note;
    selectedActivities.value = [...todayEntry.value.activities];
  }
});

// ============ Save Entry ============
const saveEntry = () => {
  if (!selectedMood.value) return;

  const today = getTodayStr();
  const existingIdx = entries.value.findIndex(e => e.date === today);

  const entry: MoodEntry = {
    id: existingIdx >= 0 ? entries.value[existingIdx].id : Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: today,
    mood: selectedMood.value,
    note: noteText.value.trim(),
    activities: [...selectedActivities.value],
    createdAt: existingIdx >= 0 ? entries.value[existingIdx].createdAt : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    entries.value[existingIdx] = entry;
  } else {
    entries.value.unshift(entry);
  }
};

// ============ Toggle Activity ============
const toggleActivity = (key: string) => {
  const idx = selectedActivities.value.indexOf(key);
  if (idx >= 0) {
    selectedActivities.value.splice(idx, 1);
  } else {
    selectedActivities.value.push(key);
  }
};

// ============ Delete Entry ============
const deleteEntry = (id: string) => {
  const idx = entries.value.findIndex(e => e.id === id);
  if (idx >= 0) {
    entries.value.splice(idx, 1);
    if (todayEntry.value === null) {
      selectedMood.value = null;
      noteText.value = '';
      selectedActivities.value = [];
    }
  }
};

// ============ Filtered Entries ============
const filteredEntries = computed(() => {
  const now = new Date();
  let cutoff: Date | null = null;

  if (viewFilter.value === 'week') {
    cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (viewFilter.value === 'month') {
    cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (!cutoff) return entries.value;
  return entries.value.filter(e => new Date(e.date) >= cutoff);
});

// ============ Stats ============
const totalEntries = computed(() => entries.value.length);

const currentStreak = computed(() => {
  if (entries.value.length === 0) return 0;
  const sorted = [...entries.value].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (sorted.some(e => e.date === ds)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
});

const bestStreak = computed(() => {
  if (entries.value.length === 0) return 0;
  const sorted = [...entries.value].sort((a, b) => a.date.localeCompare(b.date));
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.abs(diff - 1) < 0.5) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
});

const avgMood = computed(() => {
  if (entries.value.length === 0) return 0;
  const sum = entries.value.reduce((s, e) => s + e.mood, 0);
  return (sum / entries.value.length).toFixed(1);
});

const weekAvg = computed(() => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const waStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
  const weekEntries = entries.value.filter(e => e.date >= waStr);
  if (weekEntries.length === 0) return '—';
  return (weekEntries.reduce((s, e) => s + e.mood, 0) / weekEntries.length).toFixed(1);
});

const monthAvg = computed(() => {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const maStr = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;
  const monthEntries = entries.value.filter(e => e.date >= maStr);
  if (monthEntries.length === 0) return '—';
  return (monthEntries.reduce((s, e) => s + e.mood, 0) / monthEntries.length).toFixed(1);
});

// ============ Mood Trend (last 14 days) ============
const trendDays = computed(() => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = entries.value.find(e => e.date === ds);
    days.push({
      date: ds,
      label: lang.value === 'zh'
        ? `${d.getMonth() + 1}/${d.getDate()}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mood: entry ? entry.mood : null,
      shortLabel: lang.value === 'zh'
        ? `${d.getDate()}`
        : d.toLocaleDateString('en-US', { weekday: 'narrow' }),
    });
  }
  return days;
});

const trendMax = 5;

// ============ Mood Distribution ============
const moodDistribution = computed(() => {
  const dist = [0, 0, 0, 0, 0]; // index 0=mood1, index 4=mood5
  entries.value.forEach(e => {
    dist[e.mood - 1]++;
  });
  return dist;
});

const moodDistTotal = computed(() => moodDistribution.value.reduce((s, c) => s + c, 0) || 1);

// ============ Insights ============
const bestMoodDay = computed(() => {
  if (entries.value.length === 0) return null;
  const best = [...entries.value].sort((a, b) => b.mood - a.mood)[0];
  return { date: best.date, mood: best.mood, activities: best.activities };
});

const worstMoodDay = computed(() => {
  if (entries.value.length === 0) return null;
  const worst = [...entries.value].sort((a, b) => a.mood - b.mood)[0];
  return { date: worst.date, mood: worst.mood, activities: worst.activities };
});

const activityStats = computed(() => {
  const stats: Record<string, { count: number; totalMood: number }> = {};
  entries.value.forEach(e => {
    e.activities.forEach(a => {
      if (!stats[a]) stats[a] = { count: 0, totalMood: 0 };
      stats[a].count++;
      stats[a].totalMood += e.mood;
    });
  });
  return Object.entries(stats).map(([key, val]) => ({
    key,
    count: val.count,
    avgMood: val.totalMood / val.count,
  })).sort((a, b) => b.count - a.count);
});

const mostFrequentActivity = computed(() => {
  if (activityStats.value.length === 0) return null;
  return activityStats.value[0];
});

const bestActivityCombo = computed(() => {
  if (activityStats.value.length === 0) return null;
  return [...activityStats.value].sort((a, b) => b.avgMood - a.avgMood)[0];
});

// ============ Positive Days ============
const positiveDays7d = computed(() => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const waStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
  const weekEntries = entries.value.filter(e => e.date >= waStr);
  return weekEntries.filter(e => e.mood >= 4).length;
});

const positiveDays30d = computed(() => {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const maStr = `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, '0')}-${String(monthAgo.getDate()).padStart(2, '0')}`;
  const monthEntries = entries.value.filter(e => e.date >= maStr);
  return monthEntries.filter(e => e.mood >= 4).length;
});

// ============ Daily Tip ============
const dailyTipIndex = computed(() => {
  return new Date().getDay() % 4;
});

const tipKeys: (keyof typeof labels.zh)[] = ['tip1', 'tip2', 'tip3', 'tip4'];
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

      <!-- Header -->
      <c-card mb-4>
        <div flex items-center gap-3>
          <div text-4xl>🌈</div>
          <div>
            <div text-xl font-bold>{{ t('title').value }}</div>
            <div text-sm op-60>{{ t('subtitle').value }}</div>
          </div>
        </div>
      </c-card>

      <!-- Daily Tip -->
      <c-card mb-4>
        <div flex items-center gap-3>
          <div text-2xl>💡</div>
          <div>
            <div text-xs op-50 font-bold uppercase>{{ t('tipTitle').value }}</div>
            <div text-sm mt-1>{{ t(tipKeys[dailyTipIndex.value]).value }}</div>
          </div>
        </div>
      </c-card>

      <!-- Today's Mood Input -->
      <c-card mb-4 :style="{ borderLeft: selectedMood ? `4px solid ${getMoodConfig(selectedMood).color}` : '4px solid rgba(255,255,255,0.1)' }">
        <div text-lg font-bold mb-1>{{ t('todayMood').value }}</div>
        <div text-sm op-50 mb-4>{{ t('selectMood').value }}</div>

        <!-- Mood Selector -->
        <div flex justify-center gap-3 mb-5>
          <div
            v-for="m in moodConfig"
            :key="m.level"
            flex flex-col items-center gap-2 cursor-pointer
            p-3 rounded-xl transition-all duration-200
            :style="{
              background: selectedMood === m.level ? m.bg : 'rgba(255,255,255,0.03)',
              border: selectedMood === m.level ? `2px solid ${m.color}` : '2px solid rgba(255,255,255,0.06)',
              transform: selectedMood === m.level ? 'scale(1.1)' : 'scale(1)',
              minWidth: '64px',
            }"
            @click="selectedMood = m.level as 1|2|3|4|5"
          >
            <div text-3xl>{{ m.emoji }}</div>
            <div text-xs font-bold :style="{ color: selectedMood === m.level ? m.color : 'rgba(255,255,255,0.5)' }">
              {{ m.level === 5 ? t('amazing').value : m.level === 4 ? t('good').value : m.level === 3 ? t('okay').value : m.level === 2 ? t('bad').value : t('awful').value }}
            </div>
          </div>
        </div>

        <!-- Note -->
        <div mb-4>
          <div text-sm font-bold mb-2>✏️ {{ t('note').value }}</div>
          <n-input
            v-model:value="noteText"
            type="textarea"
            :placeholder="t('notePlaceholder').value"
            :rows="2"
            size="large"
          />
        </div>

        <!-- Activities -->
        <div mb-5>
          <div text-sm font-bold mb-2>🏷️ {{ t('activities').value }}</div>
          <div flex flex-wrap gap-2>
            <div
              v-for="act in activityDefs"
              :key="act.key"
              flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150
              :style="{
                background: selectedActivities.includes(act.key) ? act.color + '22' : 'rgba(255,255,255,0.05)',
                border: selectedActivities.includes(act.key) ? `1px solid ${act.color}66` : '1px solid rgba(255,255,255,0.08)',
                color: selectedActivities.includes(act.key) ? act.color : 'rgba(255,255,255,0.6)',
              }"
              @click="toggleActivity(act.key)"
            >
              <span text-sm>{{ act.icon }}</span>
              <span text-xs font-bold>{{ getActivityLabel(act.key) }}</span>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div flex justify-center>
          <n-button
            :type="selectedMood ? 'primary' : 'default'"
            size="large"
            round
            :disabled="!selectedMood"
            @click="saveEntry"
            :style="selectedMood ? { background: getMoodConfig(selectedMood).color, borderColor: getMoodConfig(selectedMood).color } : {}"
          >
            {{ isTodaySaved ? t('update').value : t('save').value }}
          </n-button>
        </div>
      </c-card>

      <!-- Stats Overview -->
      <c-card v-if="totalEntries > 0" mb-4>
        <div text-lg font-bold mb-4>📊 {{ t('insights').value }}</div>
        <n-grid :cols="4" :x-gap="12" :y-gap="8" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08)); border: 1px solid rgba(34,197,94,0.25)">
              <div text-xs op-50>{{ t('totalEntries').value }}</div>
              <div text-2xl font-bold text-green-400>{{ totalEntries }}</div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.08)); border: 1px solid rgba(59,130,246,0.25)">
              <div text-xs op-50>{{ t('currentStreak').value }}</div>
              <div text-2xl font-bold text-blue-400>{{ currentStreak }}</div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08)); border: 1px solid rgba(249,115,22,0.25)">
              <div text-xs op-50>{{ t('bestStreak').value }}</div>
              <div text-2xl font-bold text-orange-400>{{ bestStreak }}</div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.08)); border: 1px solid rgba(168,85,247,0.25)">
              <div text-xs op-50>{{ t('avgMood').value }}</div>
              <div text-2xl font-bold text-purple-400>{{ avgMood }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- Week/Month Avg Row -->
        <n-grid :cols="3" :x-gap="12" :y-gap="8" mt-3 responsive="screen" item-responsive>
          <n-gi span="1">
            <div p-2 rounded-lg text-center style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.15)">
              <div text-xs op-50>{{ t('weekAvg').value }}</div>
              <div text-lg font-bold text-green-300>{{ weekAvg }}</div>
            </div>
          </n-gi>
          <n-gi span="1">
            <div p-2 rounded-lg text-center style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.15)">
              <div text-xs op-50>{{ t('monthAvg').value }}</div>
              <div text-lg font-bold text-blue-300>{{ monthAvg }}</div>
            </div>
          </n-gi>
          <n-gi span="1">
            <div p-2 rounded-lg text-center style="background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.15)">
              <div text-xs op-50>{{ t('positiveDays').value }}</div>
              <div text-lg font-bold text-yellow-300>{{ positiveDays7d }}<span text-xs op-50>/7</span></div>
            </div>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- Mood Trend Chart -->
      <c-card v-if="totalEntries > 0" mb-4>
        <div text-lg font-bold mb-4>📈 {{ t('trendChart').value }}</div>

        <!-- Visual Bar Chart -->
        <div flex items-end gap-1 style="height: 160px" mb-2>
          <div
            v-for="day in trendDays"
            :key="day.date"
            flex-1 flex flex-col items-center justify-end
            style="height: 100%"
          >
            <!-- Value label -->
            <div v-if="day.mood" text-xs font-bold mb-1 :style="{ color: getMoodConfig(day.mood).color }">
              {{ day.mood }}
            </div>
            <!-- Bar -->
            <div
              w-full rounded-t-md transition-all duration-300
              :style="{
                height: day.mood ? `${(day.mood / trendMax) * 100}%` : '2px',
                background: day.mood
                  ? `linear-gradient(180deg, ${getMoodConfig(day.mood).color}, ${getMoodConfig(day.mood).color}44)`
                  : 'rgba(255,255,255,0.06)',
                minHeight: day.mood ? '6px' : '2px',
                opacity: day.mood ? 1 : 0.3,
              }"
            />
          </div>
        </div>
        <!-- X Labels -->
        <div flex gap-1>
          <div v-for="day in trendDays" :key="day.date + '-label'" flex-1 text-center text-xs op-30>
            {{ day.shortLabel }}
          </div>
        </div>
        <!-- Scale -->
        <div flex justify-between mt-2 text-xs op-30>
          <span>1 😢</span>
          <span>3 😐</span>
          <span>5 🤩</span>
        </div>
      </c-card>

      <!-- Mood Distribution -->
      <c-card v-if="totalEntries > 0" mb-4>
        <div text-lg font-bold mb-4>🥧 {{ t('moodDistribution').value }}</div>

        <div space-y-2>
          <div v-for="(count, idx) in moodDistribution" :key="idx" flex items-center gap-3>
            <div w-8 text-center text-lg>{{ moodConfig[4 - idx].emoji }}</div>
            <div flex-1>
              <div
                h-6 rounded-full overflow-hidden style="background: rgba(255,255,255,0.06)"
              >
                <div
                  h-full rounded-full transition-all duration-500
                  :style="{
                    width: `${(count / moodDistTotal) * 100}%`,
                    background: `linear-gradient(90deg, ${moodConfig[4 - idx].color}, ${moodConfig[4 - idx].color}88)`,
                    minWidth: count > 0 ? '8px' : '0px',
                  }"
                />
              </div>
            </div>
            <div w-12 text-right text-sm font-bold :style="{ color: moodConfig[4 - idx].color }">
              {{ Math.round((count / moodDistTotal) * 100) }}%
            </div>
          </div>
        </div>
      </c-card>

      <!-- Activity Insights -->
      <c-card v-if="activityStats.length > 0" mb-4>
        <div text-lg font-bold mb-4>🎯 {{ t('insights').value }}</div>

        <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- Best Mood Day -->
          <n-gi span="2 m:1" v-if="bestMoodDay">
            <div p-3 rounded-lg style="background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05)); border: 1px solid rgba(34,197,94,0.2)">
              <div text-xs op-50 mb-1>🌟 {{ t('bestDay').value }}</div>
              <div text-base font-bold text-green-400>{{ formatDateStr(bestMoodDay.date) }}</div>
              <div v-if="bestMoodDay.activities.length > 0" text-xs op-40 mt-1>
                {{ bestMoodDay.activities.map(a => activityDefs.find(ad => ad.key === a)?.icon + ' ' + getActivityLabel(a)).join(' · ') }}
              </div>
            </div>
          </n-gi>
          <!-- Worst Mood Day -->
          <n-gi span="2 m:1" v-if="worstMoodDay">
            <div p-3 rounded-lg style="background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05)); border: 1px solid rgba(239,68,68,0.2)">
              <div text-xs op-50 mb-1>🌧️ {{ t('worstDay').value }}</div>
              <div text-base font-bold text-red-400>{{ formatDateStr(worstMoodDay.date) }}</div>
              <div v-if="worstMoodDay.activities.length > 0" text-xs op-40 mt-1>
                {{ worstMoodDay.activities.map(a => activityDefs.find(ad => ad.key === a)?.icon + ' ' + getActivityLabel(a)).join(' · ') }}
              </div>
            </div>
          </n-gi>
          <!-- Most Frequent Activity -->
          <n-gi span="2 m:1" v-if="mostFrequentActivity">
            <div p-3 rounded-lg style="background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05)); border: 1px solid rgba(59,130,246,0.2)">
              <div text-xs op-50 mb-1>🔢 {{ t('mostActivity').value }}</div>
              <div text-base font-bold text-blue-400>
                {{ activityDefs.find(a => a.key === mostFrequentActivity.key)?.icon }}
                {{ getActivityLabel(mostFrequentActivity.key) }}
                <span text-xs op-50>{{ mostFrequentActivity.count }}x</span>
              </div>
            </div>
          </n-gi>
          <!-- Best Activity Combo -->
          <n-gi span="2 m:1" v-if="bestActivityCombo && activityStats.length > 1">
            <div p-3 rounded-lg style="background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05)); border: 1px solid rgba(168,85,247,0.2)">
              <div text-xs op-50 mb-1>⭐ {{ t('bestActivity').value }}</div>
              <div text-base font-bold text-purple-400>
                {{ activityDefs.find(a => a.key === bestActivityCombo.key)?.icon }}
                {{ getActivityLabel(bestActivityCombo.key) }}
                <span text-xs op-50>(avg {{ bestActivityCombo.avgMood.toFixed(1) }})</span>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- Mood Log -->
      <c-card mb-4>
        <div flex items-center justify-between mb-4>
          <div text-lg font-bold>📋 {{ t('moodLog').value }}</div>
          <n-button-group size="small">
            <n-button :type="viewFilter === 'week' ? 'primary' : 'default'" @click="viewFilter = 'week'" ghost>
              {{ t('thisWeek').value }}
            </n-button>
            <n-button :type="viewFilter === 'month' ? 'primary' : 'default'" @click="viewFilter = 'month'" ghost>
              {{ t('thisMonth').value }}
            </n-button>
            <n-button :type="viewFilter === 'all' ? 'primary' : 'default'" @click="viewFilter = 'all'" ghost>
              {{ t('all').value }}
            </n-button>
          </n-button-group>
        </div>

        <!-- Empty State -->
        <div v-if="filteredEntries.length === 0" py-8 text-center op-40>
          <div text-4xl mb-3>📝</div>
          <div text-lg>{{ t('emptyLog').value }}</div>
        </div>

        <!-- Entries List -->
        <div v-for="entry in filteredEntries" :key="entry.id" mb-3>
          <div
            p-3 rounded-xl
            :style="{
              background: getMoodConfig(entry.mood).bg,
              borderLeft: `4px solid ${getMoodConfig(entry.mood).color}`,
              border: `1px solid ${getMoodConfig(entry.mood).color}22`,
              borderLeftWidth: '4px',
              borderLeftColor: getMoodConfig(entry.mood).color,
            }"
          >
            <div flex items-center justify-between>
              <div flex items-center gap-3>
                <div text-2xl>{{ getMoodConfig(entry.mood).emoji }}</div>
                <div>
                  <div flex items-center gap-2>
                    <span font-bold :style="{ color: getMoodConfig(entry.mood).color }">
                      {{ t((`mood${entry.mood}`) as keyof typeof labels.zh).value }}
                    </span>
                    <span text-xs op-40>{{ formatDateStr(entry.date) }}</span>
                  </div>
                  <div v-if="entry.note" text-sm op-60 mt-1>{{ entry.note }}</div>
                  <div v-if="entry.activities.length > 0" flex flex-wrap gap-1 mt-1.5>
                    <span
                      v-for="actKey in entry.activities"
                      :key="actKey"
                      text-xs px-1.5 py-0.5 rounded
                      :style="{
                        background: (activityDefs.find(a => a.key === actKey)?.color || '#888') + '22',
                        color: activityDefs.find(a => a.key === actKey)?.color || '#888',
                      }"
                    >
                      {{ activityDefs.find(a => a.key === actKey)?.icon }}
                      {{ getActivityLabel(actKey) }}
                    </span>
                  </div>
                </div>
              </div>
              <n-popconfirm @positive-click="deleteEntry(entry.id)">
                <template #trigger>
                  <n-button size="small" quaternary circle type="error">
                    <template #icon>🗑️</template>
                  </n-button>
                </template>
                {{ t('deleteConfirm').value }}
              </n-popconfirm>
            </div>
          </div>
        </div>
      </c-card>

    </div>
  </div>
</template>

<style scoped>
</style>
