<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// i18n labels
const labels = {
  zh: {
    title: '番茄钟',
    work: '专注',
    shortBreak: '短休息',
    longBreak: '长休息',
    start: '开始专注',
    pause: '暂停',
    resume: '继续',
    reset: '重置',
    skip: '跳过',
    settings: '设置',
    workDuration: '专注时长（分钟）',
    shortBreakDuration: '短休息时长（分钟）',
    longBreakDuration: '长休息时长（分钟）',
    longBreakInterval: '长休息间隔（番茄数）',
    autoStartBreak: '自动开始休息',
    autoStartWork: '自动开始专注',
    sessions: '已完成番茄',
    todaySessions: '今日番茄',
    targetSessions: '今日目标',
    currentRound: '当前轮次',
    howToUse: '使用说明',
    step1: '设定专注时长，点击"开始专注"',
    step2: '专注工作直到计时结束',
    step3: '短暂休息后开始下一个番茄',
    step4: '每完成设定数量的番茄后，享受一次长休息',
    tip: '小贴士',
    tipContent: '番茄工作法通过将工作分割为25分钟的专注时段和5分钟的休息时段来提高效率。每4个番茄后，休息15-30分钟。',
    minutes: '分',
    seconds: '秒',
    sessionComplete: '番茄完成！',
    breakComplete: '休息结束！',
    focusPrompt: '开始下一个专注时段？',
    breakPrompt: '休息一下吧！',
    sound: '提示音',
    on: '开',
    off: '关',
    totalFocusTime: '今日专注时长',
    hour: '小时',
    minute: '分钟',
  },
  en: {
    title: 'Pomodoro Timer',
    work: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    start: 'Start Focus',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    skip: 'Skip',
    settings: 'Settings',
    workDuration: 'Focus Duration (min)',
    shortBreakDuration: 'Short Break (min)',
    longBreakDuration: 'Long Break (min)',
    longBreakInterval: 'Long Break Interval',
    autoStartBreak: 'Auto-start Break',
    autoStartWork: 'Auto-start Focus',
    sessions: 'Completed Pomodoros',
    todaySessions: "Today's Pomodoros",
    targetSessions: 'Daily Target',
    currentRound: 'Current Round',
    howToUse: 'How to Use',
    step1: 'Set focus duration, click "Start Focus"',
    step2: 'Work with focus until the timer ends',
    step3: 'Take a short break, then start the next pomodoro',
    step4: 'After a set number of pomodoros, enjoy a long break',
    tip: 'Tip',
    tipContent: 'The Pomodoro Technique boosts productivity by splitting work into 25-minute focus sessions and 5-minute breaks. After every 4 pomodoros, take a 15-30 minute long break.',
    minutes: 'min',
    seconds: 'sec',
    sessionComplete: 'Pomodoro Complete!',
    breakComplete: 'Break Over!',
    focusPrompt: 'Start the next focus session?',
    breakPrompt: 'Take a break!',
    sound: 'Sound',
    on: 'On',
    off: 'Off',
    totalFocusTime: 'Total Focus Time Today',
    hour: 'hr',
    minute: 'min',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Settings with persistence
const workDuration = useStorage('pomodoro-work-duration', 25);
const shortBreakDuration = useStorage('pomodoro-short-break', 5);
const longBreakDuration = useStorage('pomodoro-long-break', 15);
const longBreakInterval = useStorage('pomodoro-long-break-interval', 4);
const autoStartBreak = useStorage('pomodoro-auto-break', false);
const autoStartWork = useStorage('pomodoro-auto-work', false);
const soundEnabled = useStorage('pomodoro-sound', true);
const dailyTarget = useStorage('pomodoro-daily-target', 8);

// Timer state
type Phase = 'work' | 'shortBreak' | 'longBreak';
const currentPhase = ref<Phase>('work');
const isRunning = ref(false);
const timeRemaining = ref(workDuration.value * 60); // in seconds
const completedPomodoros = useStorage('pomodoro-completed-today', 0);
const lastDate = useStorage('pomodoro-last-date', '');
const totalFocusSeconds = useStorage('pomodoro-total-focus-seconds', 0);

let intervalId: ReturnType<typeof setInterval> | null = null;

// Reset daily stats if it's a new day
const checkNewDay = () => {
  const today = new Date().toDateString();
  if (lastDate.value !== today) {
    completedPomodoros.value = 0;
    totalFocusSeconds.value = 0;
    lastDate.value = today;
  }
};

onMounted(() => {
  checkNewDay();
});

// Phase durations
const phaseDurations = computed(() => ({
  work: workDuration.value * 60,
  shortBreak: shortBreakDuration.value * 60,
  longBreak: longBreakDuration.value * 60,
}));

// Current phase total duration
const currentDuration = computed(() => phaseDurations.value[currentPhase.value]);

// Progress (0 to 1)
const progress = computed(() => {
  const total = currentDuration.value;
  if (total === 0) return 0;
  return (total - timeRemaining.value) / total;
});

// Format time display
const displayMinutes = computed(() => Math.floor(timeRemaining.value / 60));
const displaySeconds = computed(() => timeRemaining.value % 60);
const formattedTime = computed(() => {
  const m = String(displayMinutes.value).padStart(2, '0');
  const s = String(displaySeconds.value).padStart(2, '0');
  return `${m}:${s}`;
});

// Phase info
const phaseInfo = computed(() => {
  const round = completedPomodoros.value % longBreakInterval.value;
  const isLongNext = round === longBreakInterval.value - 1;
  return {
    phase: currentPhase.value,
    round: round + 1,
    totalRounds: longBreakInterval.value,
    isLongNext,
  };
});

// Phase color
const phaseColor = computed(() => {
  switch (currentPhase.value) {
    case 'work': return '#ef4444';
    case 'shortBreak': return '#22c55e';
    case 'longBreak': return '#3b82f6';
    default: return '#ef4444';
  }
});

const phaseGradient = computed(() => {
  switch (currentPhase.value) {
    case 'work': return 'from-red-500/20 to-orange-500/10';
    case 'shortBreak': return 'from-green-500/20 to-emerald-500/10';
    case 'longBreak': return 'from-blue-500/20 to-indigo-500/10';
    default: return 'from-red-500/20 to-orange-500/10';
  }
});

// SVG circle parameters
const circleRadius = 140;
const circleCircumference = 2 * Math.PI * circleRadius;
const strokeDashoffset = computed(() => {
  return circleCircumference * (1 - progress.value);
});

// Play notification sound
const playSound = () => {
  if (!soundEnabled.value) return;
  try {
    const audioCtx = new AudioContext();
    // Play a pleasant chime
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.2);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.2 + 0.5);
      oscillator.start(audioCtx.currentTime + i * 0.2);
      oscillator.stop(audioCtx.currentTime + i * 0.2 + 0.5);
    });
  }
  catch {
    // Audio not available
  }
};

// Notification
const showNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '🍅' });
  }
};

// Timer tick
const tick = () => {
  if (timeRemaining.value > 0) {
    timeRemaining.value--;
    // Track focus time
    if (currentPhase.value === 'work') {
      totalFocusSeconds.value++;
    }
  }
  else {
    // Phase complete
    stopTimer();
    playSound();

    if (currentPhase.value === 'work') {
      completedPomodoros.value++;
      showNotification(
        labels[lang.value].sessionComplete,
        labels[lang.value].breakPrompt,
      );

      // Decide break type
      const nextPhase: Phase = (completedPomodoros.value % longBreakInterval.value === 0)
        ? 'longBreak'
        : 'shortBreak';
      currentPhase.value = nextPhase;
      timeRemaining.value = phaseDurations.value[nextPhase];

      if (autoStartBreak.value) {
        startTimer();
      }
    }
    else {
      showNotification(
        labels[lang.value].breakComplete,
        labels[lang.value].focusPrompt,
      );
      currentPhase.value = 'work';
      timeRemaining.value = phaseDurations.value.work;

      if (autoStartWork.value) {
        startTimer();
      }
    }
  }
};

const startTimer = () => {
  if (isRunning.value) return;
  isRunning.value = true;
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  intervalId = setInterval(tick, 1000);
};

const pauseTimer = () => {
  isRunning.value = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const resetTimer = () => {
  pauseTimer();
  currentPhase.value = 'work';
  timeRemaining.value = phaseDurations.value.work;
};

const skipPhase = () => {
  pauseTimer();
  playSound();
  if (currentPhase.value === 'work') {
    const nextPhase: Phase = (phaseInfo.value.isLongNext)
      ? 'longBreak'
      : 'shortBreak';
    currentPhase.value = nextPhase;
    timeRemaining.value = phaseDurations.value[nextPhase];
  }
  else {
    currentPhase.value = 'work';
    timeRemaining.value = phaseDurations.value.work;
  }
};

const stopTimer = () => {
  isRunning.value = false;
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// Watch duration settings changes (only apply when not running)
watch([workDuration, shortBreakDuration, longBreakDuration], () => {
  if (!isRunning.value) {
    timeRemaining.value = phaseDurations.value[currentPhase.value];
  }
});

// Phase switch function
const switchPhase = (phase: Phase) => {
  if (isRunning.value) return;
  currentPhase.value = phase;
  timeRemaining.value = phaseDurations.value[phase];
};

// Cleanup
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

// Total focus time display
const totalFocusDisplay = computed(() => {
  const hrs = Math.floor(totalFocusSeconds.value / 3600);
  const mins = Math.floor((totalFocusSeconds.value % 3600) / 60);
  return { hrs, mins };
});

// Phase tabs
const phaseTabs = computed(() => [
  { key: 'work' as Phase, label: labels[lang.value].work, color: '#ef4444' },
  { key: 'shortBreak' as Phase, label: labels[lang.value].shortBreak, color: '#22c55e' },
  { key: 'longBreak' as Phase, label: labels[lang.value].longBreak, color: '#3b82f6' },
]);
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <n-grid :cols="24" :x-gap="16" responsive="screen" item-responsive>
        <!-- Left: Timer -->
        <n-gi span="24 m:14">
          <!-- Phase Tabs -->
          <c-card mb-4>
            <div flex justify-center gap-2 mb-6>
              <button
                v-for="tab in phaseTabs"
                :key="tab.key"
                :disabled="isRunning"
                px-5 py-2 rounded-full text-sm font-medium transition-all duration-300
                :style="{
                  background: currentPhase === tab.key ? tab.color + '33' : 'transparent',
                  border: currentPhase === tab.key ? `2px solid ${tab.color}` : '2px solid rgba(255,255,255,0.1)',
                  color: currentPhase === tab.key ? tab.color : 'rgba(255,255,255,0.5)',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning && currentPhase !== tab.key ? 0.5 : 1,
                }"
                @click="switchPhase(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- Circular Timer -->
            <div flex justify-center mb-6>
              <div relative w-80 h-80>
                <svg viewBox="0 0 320 320" class="w-full h-full">
                  <!-- Background circle -->
                  <circle
                    cx="160" cy="160" :r="circleRadius"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    stroke-width="8"
                  />
                  <!-- Progress circle -->
                  <circle
                    cx="160" cy="160" :r="circleRadius"
                    fill="none"
                    :stroke="phaseColor"
                    stroke-width="8"
                    stroke-linecap="round"
                    :stroke-dasharray="circleCircumference"
                    :stroke-dashoffset="strokeDashoffset"
                    style="transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 0.5s ease"
                  />
                  <!-- Decorative dots at quarter points -->
                  <circle cx="160" cy="18" r="3" fill="rgba(255,255,255,0.2)" />
                  <circle cx="302" cy="160" r="3" fill="rgba(255,255,255,0.2)" />
                  <circle cx="160" cy="302" r="3" fill="rgba(255,255,255,0.2)" />
                  <circle cx="18" cy="160" r="3" fill="rgba(255,255,255,0.2)" />
                </svg>
                <!-- Center content -->
                <div absolute inset-0 flex flex-col items-center justify-center>
                  <div text-6xl font-bold font-mono tracking-wider :style="{ color: phaseColor }">
                    {{ formattedTime }}
                  </div>
                  <div text-sm op-60 mt-2>
                    {{ currentPhase === 'work' ? t('work').value : currentPhase === 'shortBreak' ? t('shortBreak').value : t('longBreak').value }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Control Buttons -->
            <div flex justify-center gap-3 mb-4>
              <n-button
                v-if="!isRunning"
                type="primary"
                size="large"
                round
                :style="{ background: phaseColor, border: 'none', minWidth: '140px' }"
                @click="startTimer"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </template>
                {{ timeRemaining === currentDuration && currentPhase === 'work' ? t('start').value : t('resume').value }}
              </n-button>
              <n-button
                v-else
                size="large"
                round
                :style="{ minWidth: '140px' }"
                @click="pauseTimer"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                </template>
                {{ t('pause').value }}
              </n-button>
              <n-button size="large" round quaternary @click="skipPhase">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </template>
                {{ t('skip').value }}
              </n-button>
              <n-button size="large" round quaternary @click="resetTimer">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                </template>
                {{ t('reset').value }}
              </n-button>
            </div>

            <!-- Round indicator -->
            <div flex justify-center gap-2>
              <div
                v-for="i in longBreakInterval"
                :key="i"
                w-3 h-3 rounded-full transition-all duration-300
                :style="{
                  background: i <= (completedPomodoros % longBreakInterval) ? phaseColor : 'rgba(255,255,255,0.15)',
                  boxShadow: i <= (completedPomodoros % longBreakInterval) ? `0 0 8px ${phaseColor}66` : 'none',
                }"
              />
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Stats & Settings -->
        <n-gi span="24 m:10">
          <!-- Stats Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('todaySessions').value }}</div>
            <div flex justify-center mb-4>
              <div text-center>
                <div text-5xl font-bold :style="{ color: phaseColor }">
                  {{ completedPomodoros }}
                </div>
                <div text-sm op-60 mt-1>🍅 {{ t('sessions').value }}</div>
              </div>
            </div>
            <!-- Progress toward target -->
            <div mb-4>
              <div flex justify-between text-sm mb-1>
                <span op-70>{{ t('targetSessions').value }}: {{ dailyTarget }}</span>
                <span :style="{ color: phaseColor }">{{ Math.min(100, Math.round((completedPomodoros / dailyTarget) * 100)) }}%</span>
              </div>
              <n-progress
                type="line"
                :percentage="Math.min(100, Math.round((completedPomodoros / dailyTarget) * 100))"
                :color="phaseColor"
                :height="12"
                :border-radius="6"
                :indicator-placement="'inside'"
              />
            </div>
            <!-- Total focus time -->
            <div p-3 rounded-lg :class="`bg-gradient-to-r ${phaseGradient}`" border="1px solid rgba(255,255,255,0.1)">
              <div text-sm op-70>{{ t('totalFocusTime').value }}</div>
              <div text-xl font-bold mt-1>
                <span v-if="totalFocusDisplay.hrs > 0">{{ totalFocusDisplay.hrs }} {{ t('hour').value }} </span>
                <span>{{ totalFocusDisplay.mins }} {{ t('minute').value }}</span>
              </div>
            </div>
          </c-card>

          <!-- Settings Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-4>⚙️ {{ t('settings').value }}</div>
            <div flex flex-col gap-4>
              <!-- Work Duration -->
              <div>
                <div flex justify-between text-sm mb-1>
                  <span op-70>{{ t('workDuration').value }}</span>
                  <span font-bold>{{ workDuration }}</span>
                </div>
                <n-slider v-model:value="workDuration" :min="1" :max="60" :step="1" :marks="{ 15: '15', 25: '25', 45: '45', 60: '60' }" />
              </div>
              <!-- Short Break Duration -->
              <div>
                <div flex justify-between text-sm mb-1>
                  <span op-70>{{ t('shortBreakDuration').value }}</span>
                  <span font-bold>{{ shortBreakDuration }}</span>
                </div>
                <n-slider v-model:value="shortBreakDuration" :min="1" :max="30" :step="1" :marks="{ 3: '3', 5: '5', 10: '10' }" />
              </div>
              <!-- Long Break Duration -->
              <div>
                <div flex justify-between text-sm mb-1>
                  <span op-70>{{ t('longBreakDuration').value }}</span>
                  <span font-bold>{{ longBreakDuration }}</span>
                </div>
                <n-slider v-model:value="longBreakDuration" :min="5" :max="60" :step="1" :marks="{ 10: '10', 15: '15', 30: '30' }" />
              </div>
              <!-- Long Break Interval -->
              <div>
                <div flex justify-between text-sm mb-1>
                  <span op-70>{{ t('longBreakInterval').value }}</span>
                  <span font-bold>{{ longBreakInterval }}</span>
                </div>
                <n-slider v-model:value="longBreakInterval" :min="2" :max="8" :step="1" :marks="{ 2: '2', 4: '4', 6: '6', 8: '8' }" />
              </div>
              <!-- Daily Target -->
              <div>
                <div flex justify-between text-sm mb-1>
                  <span op-70>{{ t('targetSessions').value }}</span>
                  <span font-bold>{{ dailyTarget }}</span>
                </div>
                <n-slider v-model:value="dailyTarget" :min="1" :max="20" :step="1" :marks="{ 4: '4', 8: '8', 12: '12', 16: '16' }" />
              </div>
              <!-- Auto Start -->
              <n-grid :cols="2" :x-gap="12">
                <n-gi>
                  <div flex items-center justify-between>
                    <span text-sm op-70>{{ t('autoStartBreak').value }}</span>
                    <n-switch v-model:value="autoStartBreak" size="small" />
                  </div>
                </n-gi>
                <n-gi>
                  <div flex items-center justify-between>
                    <span text-sm op-70>{{ t('autoStartWork').value }}</span>
                    <n-switch v-model:value="autoStartWork" size="small" />
                  </div>
                </n-gi>
              </n-grid>
              <!-- Sound -->
              <div flex items-center justify-between>
                <span text-sm op-70>🔔 {{ t('sound').value }}</span>
                <n-switch v-model:value="soundEnabled" size="small">
                  <template #checked>{{ t('on').value }}</template>
                  <template #unchecked>{{ t('off').value }}</template>
                </n-switch>
              </div>
            </div>
          </c-card>

          <!-- Tips Card -->
          <c-card>
            <div text-lg font-bold mb-3>💡 {{ t('tip').value }}</div>
            <div text-sm leading-relaxed op-70>{{ t('tipContent').value }}</div>
            <div mt-4>
              <div text-sm font-bold mb-2>{{ t('howToUse').value }}</div>
              <n-ul>
                <n-li><span text-sm op-70>{{ t('step1').value }}</span></n-li>
                <n-li><span text-sm op-70>{{ t('step2').value }}</span></n-li>
                <n-li><span text-sm op-70>{{ t('step3').value }}</span></n-li>
                <n-li><span text-sm op-70>{{ t('step4').value }}</span></n-li>
              </n-ul>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
button:disabled {
  cursor: not-allowed !important;
}
</style>
