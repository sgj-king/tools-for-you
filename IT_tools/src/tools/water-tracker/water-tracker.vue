<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStorage } from '@vueuse/core';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '饮水量追踪器',
    subtitle: '追踪每日饮水，养成健康饮水习惯 💧',
    dailyGoal: '每日目标',
    currentIntake: '今日已饮',
    remaining: '还需饮水',
    goalReached: '🎉 恭喜！今日饮水目标已达成！',
    addWater: '记录饮水',
    quickAdd: '快捷添加',
    customAmount: '自定义',
    smallCup: '小杯 150ml',
    mediumCup: '中杯 250ml',
    largeCup: '大杯 350ml',
    bottle: '水瓶 500ml',
    bigBottle: '大瓶 750ml',
    inputMl: '输入毫升数...',
    add: '添加',
    todayRecord: '今日记录',
    noRecords: '今天还没有记录，快来喝杯水吧！💧',
    clearToday: '清空今日',
    clearConfirm: '确定清空今日所有饮水记录吗？',
    history: '近7日趋势',
    ml: '毫升',
    liter: '升',
    percentage: '完成度',
    averageIntake: '7日均值',
    bestDay: '最佳记录',
    settings: '目标设置',
    goalPreset: '目标预设',
    goalLow: '一般活动 1500ml',
    goalMedium: '适度运动 2000ml',
    goalHigh: '活跃运动 2500ml',
    goalVeryHigh: '高温/运动 3000ml',
    customGoal: '自定义目标',
    setGoal: '设置目标',
    reminder: '饮水提醒',
    reminderOn: '开启提醒',
    reminderOff: '关闭提醒',
    reminderInterval: '提醒间隔',
    min30: '30分钟',
    min60: '1小时',
    min90: '1.5小时',
    min120: '2小时',
    reminderTitle: '该喝水啦！💧',
    reminderBody: '已经有一段时间没喝水了，记得补充水分哦',
    tip: '饮水小贴士',
    tip1: '晨起一杯水，唤醒身体新陈代谢',
    tip2: '饭前半小时饮水，有助消化',
    tip3: '运动前后及时补水，防止脱水',
    tip4: '不要等到口渴才喝水',
    tip5: '少量多次饮水，优于一次大量',
    tip6: '温水比冰水更有利于身体吸收',
    tip7: '睡前1小时减少饮水，保证睡眠质量',
    time: '时间',
    amount: '水量',
    total: '合计',
    day: '天',
    unit: '单位',
    undo: '撤销',
  },
  en: {
    title: 'Water Intake Tracker',
    subtitle: 'Track daily water intake, build healthy hydration habits 💧',
    dailyGoal: 'Daily Goal',
    currentIntake: 'Today\'s Intake',
    remaining: 'Remaining',
    goalReached: '🎉 Congratulations! Daily water goal reached!',
    addWater: 'Log Water',
    quickAdd: 'Quick Add',
    customAmount: 'Custom',
    smallCup: 'Small Cup 150ml',
    mediumCup: 'Medium Cup 250ml',
    largeCup: 'Large Cup 350ml',
    bottle: 'Bottle 500ml',
    bigBottle: 'Big Bottle 750ml',
    inputMl: 'Enter milliliters...',
    add: 'Add',
    todayRecord: 'Today\'s Log',
    noRecords: 'No records yet. Time to drink some water! 💧',
    clearToday: 'Clear Today',
    clearConfirm: 'Clear all water records for today?',
    history: '7-Day Trend',
    ml: 'ml',
    liter: 'L',
    percentage: 'Progress',
    averageIntake: '7-Day Avg',
    bestDay: 'Best Day',
    settings: 'Goal Settings',
    goalPreset: 'Goal Presets',
    goalLow: 'Light Activity 1500ml',
    goalMedium: 'Moderate 2000ml',
    goalHigh: 'Active 2500ml',
    goalVeryHigh: 'Hot/Intense 3000ml',
    customGoal: 'Custom Goal',
    setGoal: 'Set Goal',
    reminder: 'Reminder',
    reminderOn: 'On',
    reminderOff: 'Off',
    reminderInterval: 'Interval',
    min30: '30 min',
    min60: '1 hour',
    min90: '1.5 hours',
    min120: '2 hours',
    reminderTitle: 'Time to hydrate! 💧',
    reminderBody: 'You haven\'t had water in a while. Stay hydrated!',
    tip: 'Hydration Tips',
    tip1: 'Drink a glass of water after waking up to boost metabolism',
    tip2: 'Drink water 30 min before meals to aid digestion',
    tip3: 'Hydrate before and after exercise to prevent dehydration',
    tip4: 'Don\'t wait until you\'re thirsty to drink water',
    tip5: 'Small sips throughout the day is better than large amounts at once',
    tip6: 'Warm water is easier for the body to absorb than ice water',
    tip7: 'Reduce water intake 1 hour before bedtime for better sleep',
    time: 'Time',
    amount: 'Amount',
    total: 'Total',
    day: 'day',
    unit: 'Unit',
    undo: 'Undo',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Types =====================
interface WaterRecord {
  id: string;
  time: string; // HH:mm
  amount: number; // ml
  timestamp: number;
}

interface DayData {
  date: string; // YYYY-MM-DD
  records: WaterRecord[];
  goal: number;
}

// ===================== State =====================
const dailyGoal = useStorage<number>('water-tracker-goal', 2000);
const records = useStorage<WaterRecord[]>('water-tracker-records', []);
const historyData = useStorage<DayData[]>('water-tracker-history', []);
const reminderEnabled = useStorage<boolean>('water-tracker-reminder', false);
const reminderInterval = useStorage<number>('water-tracker-interval', 60);
const showSettings = ref(false);
const customMl = ref('');
const showCustomInput = ref(false);

// Notification state
let reminderTimer: ReturnType<typeof setInterval> | null = null;

// ===================== Helper =====================
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ===================== Computed =====================
const todayStr = computed(getTodayStr);

const todayRecords = computed(() => {
  return records.value.filter(r => {
    // Records from today (simple: all records stored are today's)
    return true;
  });
});

const todayTotal = computed(() => {
  return todayRecords.value.reduce((sum, r) => sum + r.amount, 0);
});

const progressPercent = computed(() => {
  if (dailyGoal.value <= 0) return 0;
  return Math.min(100, Math.round((todayTotal.value / dailyGoal.value) * 100));
});

const remaining = computed(() => {
  return Math.max(0, dailyGoal.value - todayTotal.value);
});

const isGoalReached = computed(() => {
  return todayTotal.value >= dailyGoal.value;
});

// History: last 7 days
const last7Days = computed(() => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = lang.value === 'zh'
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : `${d.getMonth() + 1}/${d.getDate()}`;

    // Find history data for this date
    const hist = historyData.value.find(h => h.date === dateStr);
    const isToday = dateStr === todayStr.value;

    let total: number;
    let goal: number;
    if (isToday) {
      total = todayTotal.value;
      goal = dailyGoal.value;
    } else if (hist) {
      total = hist.records.reduce((sum, r) => sum + r.amount, 0);
      goal = hist.goal;
    } else {
      total = 0;
      goal = dailyGoal.value;
    }

    days.push({ date: dateStr, label: dayLabel, total, goal, isToday });
  }
  return days;
});

const averageIntake = computed(() => {
  const days = last7Days.value;
  if (days.length === 0) return 0;
  return Math.round(days.reduce((sum, d) => sum + d.total, 0) / days.length);
});

const bestDay = computed(() => {
  return Math.max(...last7Days.value.map(d => d.total), 0);
});

// Quick add presets
const quickAddOptions = computed(() => [
  { label: t('smallCup').value, amount: 150, icon: '🥛' },
  { label: t('mediumCup').value, amount: 250, icon: '☕' },
  { label: t('largeCup').value, amount: 350, icon: '🫗' },
  { label: t('bottle').value, amount: 500, icon: '🍶' },
  { label: t('bigBottle').value, amount: 750, icon: '🧴' },
]);

// Goal presets
const goalPresets = computed(() => [
  { label: t('goalLow').value, value: 1500 },
  { label: t('goalMedium').value, value: 2000 },
  { label: t('goalHigh').value, value: 2500 },
  { label: t('goalVeryHigh').value, value: 3000 },
]);

// Interval options
const intervalOptions = computed(() => [
  { label: t('min30').value, value: 30 },
  { label: t('min60').value, value: 60 },
  { label: t('min90').value, value: 90 },
  { label: t('min120').value, value: 120 },
]);

// Water level animation
const waterLevel = computed(() => {
  return Math.min(100, (todayTotal.value / dailyGoal.value) * 100);
});

// Daily tip
const dailyTip = computed(() => {
  const dayOfWeek = new Date().getDay();
  const keys: (keyof typeof labels.zh)[] = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5', 'tip6', 'tip7'];
  return labels[lang.value][keys[dayOfWeek % keys.length]];
});

// History bar max
const historyMax = computed(() => {
  const maxVal = Math.max(...last7Days.value.map(d => Math.max(d.total, d.goal)), 0);
  return maxVal > 0 ? maxVal : 2000;
});

// ===================== Actions =====================
const addWater = (amount: number) => {
  if (amount <= 0) return;
  const record: WaterRecord = {
    id: genId(),
    time: getCurrentTime(),
    amount,
    timestamp: Date.now(),
  };
  records.value.push(record);
  // Save to history
  saveTodayToHistory();
};

const undoLastRecord = () => {
  if (records.value.length > 0) {
    records.value.pop();
    saveTodayToHistory();
  }
};

const clearTodayRecords = () => {
  records.value = [];
  saveTodayToHistory();
};

const addCustomWater = () => {
  const ml = parseInt(customMl.value);
  if (isNaN(ml) || ml <= 0) return;
  addWater(ml);
  customMl.value = '';
  showCustomInput.value = false;
};

const setGoalFromPreset = (goal: number) => {
  dailyGoal.value = goal;
};

// History management: archive yesterday's data on mount
const archiveOldData = () => {
  const todayDate = getTodayStr();
  // Check if we have records that are not from today
  // Since records are cleared daily, we save today's data
  saveTodayToHistory();
};

const saveTodayToHistory = () => {
  const todayDate = getTodayStr();
  const existing = historyData.value.findIndex(h => h.date === todayDate);
  const dayData: DayData = {
    date: todayDate,
    records: [...records.value],
    goal: dailyGoal.value,
  };
  if (existing >= 0) {
    historyData.value[existing] = dayData;
  } else {
    historyData.value.push(dayData);
  }
  // Keep only last 30 days of history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
  historyData.value = historyData.value.filter(h => h.date >= cutoff);
};

// Notification / Reminder
const startReminder = () => {
  stopReminder();
  if (!reminderEnabled.value) return;
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }

  reminderTimer = setInterval(() => {
    if (Notification.permission === 'granted') {
      new Notification(labels[lang.value].reminderTitle, {
        body: labels[lang.value].reminderBody,
        icon: '💧',
      });
    }
  }, reminderInterval.value * 60 * 1000);
};

const stopReminder = () => {
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
};

const toggleReminder = (enabled: boolean) => {
  reminderEnabled.value = enabled;
  if (enabled) {
    startReminder();
  } else {
    stopReminder();
  }
};

// Wave animation
const waveOffset = ref(0);
let waveAnimFrame: number | null = null;

const animateWave = () => {
  waveOffset.value = (waveOffset.value + 0.5) % 360;
  waveAnimFrame = requestAnimationFrame(animateWave);
};

// Lifecycle
onMounted(() => {
  // Load today's records from history
  const todayHist = historyData.value.find(h => h.date === getTodayStr());
  if (todayHist && todayHist.records.length > 0) {
    records.value = [...todayHist.records];
  }

  if (reminderEnabled.value) {
    startReminder();
  }
  animateWave();
});

onUnmounted(() => {
  saveTodayToHistory();
  stopReminder();
  if (waveAnimFrame) {
    cancelAnimationFrame(waveAnimFrame);
  }
});
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 800px">

      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <!-- Water Bottle Visual -->
      <c-card mb-4>
        <div flex items-center justify-center>
          <div relative w-52 h-72 rounded-3xl overflow-hidden style="border: 3px solid rgba(56,189,248,0.4); background: rgba(255,255,255,0.03)">
            <!-- Water fill -->
            <div
              absolute bottom-0 left-0 right-0
              :style="{
                height: `${waterLevel}%`,
                background: isGoalReached
                  ? 'linear-gradient(180deg, rgba(34,197,94,0.7), rgba(16,185,129,0.9))'
                  : 'linear-gradient(180deg, rgba(56,189,248,0.5), rgba(14,165,233,0.8))',
                transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '0 0 1.2rem 1.2rem',
              }"
            >
              <!-- Wave effect -->
              <div
                absolute top-0 left-0 right-0 h-6
                :style="{
                  background: isGoalReached
                    ? 'rgba(34,197,94,0.4)'
                    : 'rgba(56,189,248,0.4)',
                  borderRadius: '50%',
                  transform: `translateX(${Math.sin(waveOffset * Math.PI * 1 / 180) * 8}px)`,
                }"
              />
            </div>
            <!-- Bottle cap -->
            <div w-20 h-5 rounded-t-lg :style="{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: 'rgba(56,189,248,0.3)', border: '2px solid rgba(56,189,248,0.4)', borderBottom: 'none' }" />
            <!-- Percentage text -->
            <div text-center z-10 :style="{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }">
              <div text-4xl font-bold :style="{ color: waterLevel > 50 ? 'white' : 'rgba(56,189,248,0.9)' }">
                {{ progressPercent }}%
              </div>
              <div text-sm mt-1 :style="{ color: waterLevel > 50 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }">
                {{ isGoalReached ? '✅' : `${remaining}${t('ml').value}` }}
              </div>
            </div>
            <!-- Scale markers -->
            <div v-for="mark in [25, 50, 75]" :key="mark"
              absolute left-0 w-3 :style="{ bottom: `${mark}%`, borderTop: '1px dashed rgba(255,255,255,0.15)' }"
            />
          </div>
        </div>

        <!-- Goal reached banner -->
        <div v-if="isGoalReached" mt-4 p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.15)); border: 1px solid rgba(34,197,94,0.4)">
          <div text-lg font-bold text-green-400>{{ t('goalReached').value }}</div>
        </div>

        <!-- Stats row -->
        <div mt-4 grid grid-cols-3 gap-3>
          <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(56,189,248,0.08)); border: 1px solid rgba(56,189,248,0.25)">
            <div text-xs op-50>{{ t('dailyGoal').value }}</div>
            <div text-xl font-bold text-sky-400>{{ dailyGoal }}<span text-sm ml-1>{{ t('ml').value }}</span></div>
          </div>
          <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08)); border: 1px solid rgba(34,197,94,0.25)">
            <div text-xs op-50>{{ t('currentIntake').value }}</div>
            <div text-xl font-bold text-green-400>{{ todayTotal }}<span text-sm ml-1>{{ t('ml').value }}</span></div>
          </div>
          <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(251,146,60,0.2), rgba(251,146,60,0.08)); border: 1px solid rgba(251,146,60,0.25)">
            <div text-xs op-50>{{ t('percentage').value }}</div>
            <div text-xl font-bold text-orange-400>{{ progressPercent }}%</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div mt-3>
          <n-progress
            :percentage="progressPercent"
            :color="isGoalReached ? '#22c55e' : '#38bdf8'"
            :rail-color="'rgba(255,255,255,0.08)'"
            :height="12"
            :border-radius="6"
          />
        </div>
      </c-card>

      <!-- Quick Add -->
      <c-card mb-4>
        <div text-lg font-bold mb-3>{{ t('quickAdd').value }}</div>
        <div flex flex-wrap gap-2>
          <n-button
            v-for="opt in quickAddOptions"
            :key="opt.amount"
            size="large"
            round
            @click="addWater(opt.amount)"
            :style="{
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.3)',
              color: '#7dd3fc',
            }"
          >
            {{ opt.icon }} {{ opt.label }}
          </n-button>
          <n-button
            size="large"
            round
            @click="showCustomInput = !showCustomInput"
            :style="{
              background: showCustomInput ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)',
              border: `1px solid rgba(139,92,246,${showCustomInput ? '0.5' : '0.25'})`,
              color: '#a78bfa',
            }"
          >
            ✏️ {{ t('customAmount').value }}
          </n-button>
        </div>

        <!-- Custom input -->
        <div v-if="showCustomInput" mt-3 flex gap-2>
          <n-input
            v-model:value="customMl"
            :placeholder="t('inputMl').value"
            size="large"
            type="number"
            :min="1"
            style="flex: 1"
            @keyup.enter="addCustomWater"
          />
          <n-button type="primary" size="large" @click="addCustomWater" :disabled="!customMl || parseInt(customMl) <= 0">
            {{ t('add').value }} 💧
          </n-button>
        </div>
      </c-card>

      <!-- Today's Records -->
      <c-card mb-4>
        <div flex items-center justify-between mb-3>
          <div text-lg font-bold>{{ t('todayRecord').value }}</div>
          <div flex items-center gap-2>
            <n-button v-if="records.length > 0" size="small" quaternary @click="undoLastRecord" type="warning">
              ↩️ {{ t('undo').value }}
            </n-button>
            <n-popconfirm v-if="records.length > 0" @positive-click="clearTodayRecords">
              <template #trigger>
                <n-button size="small" quaternary type="error">🗑️ {{ t('clearToday').value }}</n-button>
              </template>
              {{ t('clearConfirm').value }}
            </n-popconfirm>
          </div>
        </div>

        <div v-if="records.length > 0">
          <div
            v-for="(record, idx) in [...records].reverse()"
            :key="record.id"
            flex items-center justify-between py-2
            :style="{
              borderBottom: idx < records.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }"
          >
            <div flex items-center gap-3>
              <div text-xl>💧</div>
              <div>
                <span font-bold>{{ record.amount }}ml</span>
                <span text-sm op-50 ml-2>{{ record.time }}</span>
              </div>
            </div>
            <div text-sm op-40>
              +{{ ((record.amount / dailyGoal) * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
        <div v-else text-center py-6 op-50>
          <div text-4xl mb-2>💧</div>
          <div>{{ t('noRecords').value }}</div>
        </div>
      </c-card>

      <!-- 7-Day History -->
      <c-card mb-4>
        <div text-lg font-bold mb-3>{{ t('history').value }}</div>

        <!-- Stats summary -->
        <div grid grid-cols-2 gap-3 mb-4>
          <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.08)); border: 1px solid rgba(99,102,241,0.25)">
            <div text-xs op-50>{{ t('averageIntake').value }}</div>
            <div text-2xl font-bold text-indigo-400>{{ averageIntake }}<span text-sm ml-1>{{ t('ml').value }}</span></div>
          </div>
          <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(236,72,153,0.2), rgba(236,72,153,0.08)); border: 1px solid rgba(236,72,153,0.25)">
            <div text-xs op-50>{{ t('bestDay').value }}</div>
            <div text-2xl font-bold text-pink-400>{{ bestDay }}<span text-sm ml-1>{{ t('ml').value }}</span></div>
          </div>
        </div>

        <!-- Bar chart -->
        <div flex items-end gap-2 h-40>
          <div v-for="day in last7Days" :key="day.date" flex-1 flex flex-col items-center gap-1>
            <!-- Bar -->
            <div relative w-full flex flex-col justify-end style="height: 120px">
              <!-- Goal line -->
              <div
                absolute left-0 right-0
                :style="{ bottom: `${(day.goal / historyMax) * 100}%` }"
                style="border-top: 1px dashed rgba(255,255,255,0.15)"
              />
              <!-- Intake bar -->
              <div
                w-full rounded-t-md
                :style="{
                  height: `${Math.max(2, (day.total / historyMax) * 100)}%`,
                  background: day.total >= day.goal
                    ? 'linear-gradient(180deg, rgba(34,197,94,0.8), rgba(16,185,129,0.5))'
                    : 'linear-gradient(180deg, rgba(56,189,248,0.7), rgba(14,165,233,0.4))',
                  transition: 'height 0.5s ease',
                  minHeight: day.total > 0 ? '4px' : '0',
                }"
              />
            </div>
            <!-- Label -->
            <div text-xs :class="{ 'font-bold text-sky-400': day.isToday }" op-60>{{ day.label }}</div>
            <!-- Value -->
            <div text-xs op-40>{{ day.total > 0 ? (day.total >= 1000 ? `${(day.total / 1000).toFixed(1)}L` : `${day.total}ml`) : '-' }}</div>
          </div>
        </div>
      </c-card>

      <!-- Tip -->
      <c-card mb-4>
        <div flex items-center gap-3>
          <div text-3xl>💡</div>
          <div>
            <div text-sm op-60>{{ t('tip').value }}</div>
            <div text-base font-bold mt-1>{{ dailyTip.value }}</div>
          </div>
        </div>
      </c-card>

      <!-- Settings -->
      <c-card mb-4>
        <div flex items-center justify-between cursor-pointer @click="showSettings = !showSettings">
          <div flex items-center gap-2>
            <div text-xl>⚙️</div>
            <div text-lg font-bold>{{ t('settings').value }}</div>
          </div>
          <div :style="{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }">▼</div>
        </div>

        <div v-if="showSettings" mt-4>
          <!-- Goal presets -->
          <div mb-4>
            <div text-sm font-bold mb-2>{{ t('goalPreset').value }}</div>
            <div flex flex-wrap gap-2>
              <n-button
                v-for="preset in goalPresets"
                :key="preset.value"
                :type="dailyGoal === preset.value ? 'primary' : 'default'"
                size="medium"
                round
                @click="setGoalFromPreset(preset.value)"
              >
                {{ preset.label }}
              </n-button>
            </div>
          </div>

          <!-- Custom goal -->
          <div mb-4>
            <div text-sm font-bold mb-2>{{ t('customGoal').value }}</div>
            <div flex gap-2>
              <n-input-number
                v-model:value="dailyGoal"
                :min="500"
                :max="8000"
                :step="100"
                size="large"
                style="flex: 1"
              >
                <template #suffix>{{ t('ml').value }}</template>
              </n-input-number>
            </div>
          </div>

          <!-- Reminder -->
          <div mb-2>
            <div text-sm font-bold mb-2>{{ t('reminder').value }}</div>
            <div flex items-center gap-3>
              <n-switch :value="reminderEnabled" @update:value="toggleReminder" size="large">
                <template #checked>{{ t('reminderOn').value }}</template>
                <template #unchecked>{{ t('reminderOff').value }}</template>
              </n-switch>
              <div v-if="reminderEnabled" flex gap-2>
                <n-button
                  v-for="opt in intervalOptions"
                  :key="opt.value"
                  size="small"
                  :type="reminderInterval === opt.value ? 'primary' : 'default'"
                  round
                  @click="() => { reminderInterval = opt.value; if (reminderEnabled) { startReminder() } }"
                >
                  {{ opt.label }}
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </c-card>

    </div>
  </div>
</template>

<style scoped>
</style>
