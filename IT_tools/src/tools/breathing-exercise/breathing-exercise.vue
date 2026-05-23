<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStorage } from '@vueuse/core';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '呼吸练习',
    subtitle: '跟随节奏呼吸，放松身心 🌿',
    selectPattern: '选择呼吸模式',
    patterns: {
      box: '箱式呼吸',
      boxDesc: '4-4-4-4 · 专注与平衡',
      relaxing: '4-7-8 放松法',
      relaxingDesc: '4-7-8 · 深度放松助眠',
      energizing: '活力呼吸',
      energizingDesc: '6-2-6-2 · 提升精力',
      equal: '等比呼吸',
      equalDesc: '4-4 · 入门基础',
      deep: '腹式深呼吸',
      deepDesc: '5-7 · 缓解焦虑',
    },
    phases: {
      inhale: '吸气',
      hold: '屏息',
      exhale: '呼气',
      holdExhale: '屏息',
    },
    phaseHints: {
      inhale: '缓缓深吸...',
      hold: '保持...',
      exhale: '慢慢呼出...',
      holdExhale: '保持...',
    },
    start: '开始练习',
    pause: '暂停',
    resume: '继续',
    stop: '停止',
    session: '练习时长',
    cycles: '完成周期',
    todayCycles: '今日练习',
    totalMinutes: '累计分钟',
    settings: '练习设置',
    sessionDuration: '目标时长',
    sound: '提示音',
    soundOn: '开启',
    soundOff: '关闭',
    vibration: '振动引导',
    min1: '1 分钟',
    min3: '3 分钟',
    min5: '5 分钟',
    min10: '10 分钟',
    min15: '15 分钟',
    unlimited: '不限',
    benefits: '呼吸的好处',
    benefit1: '🫁 增强肺活量，改善呼吸效率',
    benefit2: '😌 降低皮质醇，缓解焦虑压力',
    benefit3: '🧘 激活副交感神经，促进放松',
    benefit4: '💡 提高血氧浓度，增强专注力',
    benefit5: '😴 改善睡眠质量，帮助入眠',
    benefit6: '❤️ 调节心率，稳定血压',
    tips: '练习贴士',
    tip1: '找一个安静舒适的地方',
    tip2: '保持自然坐姿，放松肩膀',
    tip3: '闭上眼睛，专注呼吸节奏',
    tip4: '不必强求，循序渐进',
    tip5: '每天练习5-10分钟即可见效',
    completed: '🎉 练习完成！',
    completedMsg: '完成了 {cycles} 个呼吸周期，做得很好！',
    currentPhase: '当前阶段',
    remaining: '剩余时间',
    minutes: '分钟',
    seconds: '秒',
    customPattern: '自定义模式',
    inhaleTime: '吸气时长',
    holdTime: '屏息时长',
    exhaleTime: '呼气时长',
    holdExhaleTime: '呼后屏息',
    secondsUnit: '秒',
    apply: '应用',
    history: '练习记录',
    noHistory: '暂无练习记录',
    streak: '连续天数',
    day: '天',
  },
  en: {
    title: 'Breathing Exercise',
    subtitle: 'Follow the rhythm, relax your body and mind 🌿',
    selectPattern: 'Select Pattern',
    patterns: {
      box: 'Box Breathing',
      boxDesc: '4-4-4-4 · Focus & Balance',
      relaxing: '4-7-8 Relaxing',
      relaxingDesc: '4-7-8 · Deep Relaxation & Sleep',
      energizing: 'Energizing Breath',
      energizingDesc: '6-2-6-2 · Boost Energy',
      equal: 'Equal Breathing',
      equalDesc: '4-4 · Beginner Basics',
      deep: 'Deep Belly Breath',
      deepDesc: '5-7 · Ease Anxiety',
    },
    phases: {
      inhale: 'Inhale',
      hold: 'Hold',
      exhale: 'Exhale',
      holdExhale: 'Hold',
    },
    phaseHints: {
      inhale: 'Breathe in slowly...',
      hold: 'Hold gently...',
      exhale: 'Release slowly...',
      holdExhale: 'Hold gently...',
    },
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    stop: 'Stop',
    session: 'Session',
    cycles: 'Cycles',
    todayCycles: 'Today\'s Practice',
    totalMinutes: 'Total Minutes',
    settings: 'Settings',
    sessionDuration: 'Target Duration',
    sound: 'Sound Cue',
    soundOn: 'On',
    soundOff: 'Off',
    vibration: 'Vibration Guide',
    min1: '1 min',
    min3: '3 min',
    min5: '5 min',
    min10: '10 min',
    min15: '15 min',
    unlimited: 'Unlimited',
    benefits: 'Benefits of Breathing',
    benefit1: '🫁 Improves lung capacity & breathing efficiency',
    benefit2: '😌 Lowers cortisol, reduces anxiety & stress',
    benefit3: '🧘 Activates parasympathetic system, promotes relaxation',
    benefit4: '💡 Increases blood oxygen, enhances focus',
    benefit5: '😴 Improves sleep quality, aids falling asleep',
    benefit6: '❤️ Regulates heart rate, stabilizes blood pressure',
    tips: 'Tips',
    tip1: 'Find a quiet and comfortable place',
    tip2: 'Sit naturally, relax your shoulders',
    tip3: 'Close your eyes, focus on the rhythm',
    tip4: 'Don\'t force it, progress gradually',
    tip5: '5-10 minutes daily can make a difference',
    completed: '🎉 Session Complete!',
    completedMsg: 'Completed {cycles} breathing cycles. Great job!',
    currentPhase: 'Current Phase',
    remaining: 'Remaining',
    minutes: 'min',
    seconds: 'sec',
    customPattern: 'Custom Pattern',
    inhaleTime: 'Inhale Duration',
    holdTime: 'Hold Duration',
    exhaleTime: 'Exhale Duration',
    holdExhaleTime: 'Hold After Exhale',
    secondsUnit: 'sec',
    apply: 'Apply',
    history: 'Practice History',
    noHistory: 'No practice history yet',
    streak: 'Streak',
    day: 'days',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: string) => computed(() => {
  const keys = key.split('.');
  let result: any = labels[lang.value];
  for (const k of keys) {
    result = result?.[k];
  }
  return result ?? key;
});

// ===================== Types =====================
interface BreathingPattern {
  id: string;
  nameKey: string;
  descKey: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdExhale: number;
  color: string;
  icon: string;
}

interface PhaseInfo {
  key: 'inhale' | 'hold' | 'exhale' | 'holdExhale';
  duration: number;
}

interface PracticeRecord {
  date: string;
  cycles: number;
  duration: number;
  pattern: string;
}

// ===================== Patterns =====================
const patterns: BreathingPattern[] = [
  { id: 'box', nameKey: 'patterns.box', descKey: 'patterns.boxDesc', inhale: 4, hold: 4, exhale: 4, holdExhale: 4, color: '#38bdf8', icon: '🟦' },
  { id: 'relaxing', nameKey: 'patterns.relaxing', descKey: 'patterns.relaxingDesc', inhale: 4, hold: 7, exhale: 8, holdExhale: 0, color: '#a78bfa', icon: '🟪' },
  { id: 'energizing', nameKey: 'patterns.energizing', descKey: 'patterns.energizingDesc', inhale: 6, hold: 2, exhale: 6, holdExhale: 2, color: '#fbbf24', icon: '🟨' },
  { id: 'equal', nameKey: 'patterns.equal', descKey: 'patterns.equalDesc', inhale: 4, hold: 0, exhale: 4, holdExhale: 0, color: '#34d399', icon: '🟩' },
  { id: 'deep', nameKey: 'patterns.deep', descKey: 'patterns.deepDesc', inhale: 5, hold: 0, exhale: 7, holdExhale: 0, color: '#f472b6', icon: '🩷' },
];

// ===================== State =====================
const selectedPatternId = useStorage<string>('breathing-pattern', 'box');
const targetDuration = useStorage<number>('breathing-duration', 0); // 0 = unlimited
const soundEnabled = useStorage<boolean>('breathing-sound', true);
const vibrationEnabled = useStorage<boolean>('breathing-vibration', false);
const practiceHistory = useStorage<PracticeRecord[]>('breathing-history', []);

const isRunning = ref(false);
const isPaused = ref(false);
const currentPhaseIndex = ref(0);
const phaseElapsed = ref(0);
const completedCycles = ref(0);
const sessionStartTime = ref(0);
const sessionElapsed = ref(0);
const showSettings = ref(false);
const showCustomPattern = ref(false);

// Custom pattern
const customInhale = ref(4);
const customHold = ref(4);
const customExhale = ref(4);
const customHoldExhale = ref(0);

// ===================== Computed =====================
const selectedPattern = computed(() => {
  if (selectedPatternId.value === 'custom') {
    return {
      id: 'custom',
      nameKey: 'customPattern',
      descKey: 'customPattern',
      inhale: customInhale.value,
      hold: customHold.value,
      exhale: customExhale.value,
      holdExhale: customHoldExhale.value,
      color: '#fb923c',
      icon: '🟧',
    };
  }
  return patterns.find(p => p.id === selectedPatternId.value) || patterns[0];
});

const currentPhases = computed((): PhaseInfo[] => {
  const p = selectedPattern.value;
  const phases: PhaseInfo[] = [];
  phases.push({ key: 'inhale', duration: p.inhale });
  if (p.hold > 0) phases.push({ key: 'hold', duration: p.hold });
  phases.push({ key: 'exhale', duration: p.exhale });
  if (p.holdExhale > 0) phases.push({ key: 'holdExhale', duration: p.holdExhale });
  return phases;
});

const currentPhase = computed((): PhaseInfo => {
  return currentPhases.value[currentPhaseIndex.value] || { key: 'inhale', duration: 4 };
});

const currentPhaseProgress = computed(() => {
  if (currentPhase.value.duration <= 0) return 1;
  return Math.min(1, phaseElapsed.value / currentPhase.value.duration);
});

const currentPhaseRemaining = computed(() => {
  return Math.max(0, currentPhase.value.duration - phaseElapsed.value);
});

const totalCycleDuration = computed(() => {
  return currentPhases.value.reduce((sum, p) => sum + p.duration, 0);
});

const sessionRemaining = computed(() => {
  if (targetDuration.value <= 0) return -1;
  return Math.max(0, targetDuration.value * 60 - sessionElapsed.value);
});

const sessionRemainingDisplay = computed(() => {
  const sec = sessionRemaining.value;
  if (sec < 0) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});

const patternColor = computed(() => selectedPattern.value.color);

// Animation
const breathCircleScale = computed(() => {
  if (!isRunning.value) return 0.6;
  const phase = currentPhase.value.key;
  const progress = currentPhaseProgress.value;
  if (phase === 'inhale') {
    return 0.6 + 0.4 * progress;
  } else if (phase === 'hold' || phase === 'holdExhale') {
    return phase === 'hold' ? 1.0 : 0.2 + 0.0 * progress;
  } else {
    return 1.0 - 0.8 * progress;
  }
});

const breathCircleOpacity = computed(() => {
  if (!isRunning.value) return 0.4;
  const phase = currentPhase.value.key;
  const progress = currentPhaseProgress.value;
  if (phase === 'inhale') {
    return 0.5 + 0.5 * progress;
  } else if (phase === 'hold') {
    return 1.0;
  } else if (phase === 'exhale') {
    return 1.0 - 0.5 * progress;
  } else {
    return 0.5;
  }
});

// Ring animation for active phase indicator
const ringProgress = computed(() => {
  if (!isRunning.value) return 0;
  return currentPhaseProgress.value * 100;
});

// Today's stats
const todayStr = computed(() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});

const todayRecords = computed(() => {
  return practiceHistory.value.filter(r => r.date === todayStr.value);
});

const todayCycles = computed(() => {
  return todayRecords.value.reduce((sum, r) => sum + r.cycles, 0);
});

const todayMinutes = computed(() => {
  return Math.round(todayRecords.value.reduce((sum, r) => sum + r.duration, 0) / 60);
});

// Streak
const streak = computed(() => {
  const dates = [...new Set(practiceHistory.value.map(r => r.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let count = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dates.includes(ds)) {
      count++;
    } else {
      break;
    }
  }
  return count;
});

// ===================== Timer Logic =====================
let timerInterval: ReturnType<typeof setInterval> | null = null;
const TICK_MS = 100;

const startBreathing = () => {
  isRunning.value = true;
  isPaused.value = false;
  currentPhaseIndex.value = 0;
  phaseElapsed.value = 0;
  completedCycles.value = 0;
  sessionStartTime.value = Date.now();
  sessionElapsed.value = 0;

  timerInterval = setInterval(() => {
    if (isPaused.value) return;

    phaseElapsed.value += TICK_MS / 1000;
    sessionElapsed.value = Math.floor((Date.now() - sessionStartTime.value) / 1000);

    if (phaseElapsed.value >= currentPhase.value.duration) {
      // Phase transition sound
      playTransitionSound();

      // Move to next phase
      const nextIndex = currentPhaseIndex.value + 1;
      if (nextIndex >= currentPhases.value.length) {
        // Completed a cycle
        completedCycles.value++;
        currentPhaseIndex.value = 0;
      } else {
        currentPhaseIndex.value = nextIndex;
      }
      phaseElapsed.value = 0;

      // Check session duration
      if (targetDuration.value > 0 && sessionElapsed.value >= targetDuration.value * 60) {
        stopBreathing(true);
      }
    }
  }, TICK_MS);
};

const pauseBreathing = () => {
  isPaused.value = true;
};

const resumeBreathing = () => {
  isPaused.value = false;
  sessionStartTime.value = Date.now() - sessionElapsed.value * 1000;
};

const stopBreathing = (completed = false) => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (completedCycles.value > 0) {
    practiceHistory.value.push({
      date: todayStr.value,
      cycles: completedCycles.value,
      duration: sessionElapsed.value,
      pattern: selectedPattern.value.id,
    });
    // Keep last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    practiceHistory.value = practiceHistory.value.filter(r => r.date >= cutoffStr);
  }

  isRunning.value = false;
  isPaused.value = false;
  currentPhaseIndex.value = 0;
  phaseElapsed.value = 0;
};

// ===================== Sound =====================
const playTransitionSound = () => {
  if (!soundEnabled.value) return;
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = currentPhase.value.key === 'inhale' ? 440 : 330;
    oscillator.type = 'sine';
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch {}
};

// ===================== Duration Options =====================
const durationOptions = computed(() => [
  { label: t('unlimited').value, value: 0 },
  { label: t('min1').value, value: 1 },
  { label: t('min3').value, value: 3 },
  { label: t('min5').value, value: 5 },
  { label: t('min10').value, value: 10 },
  { label: t('min15').value, value: 15 },
]);

// ===================== Lifecycle =====================
onMounted(() => {
  // Clean up on mount
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
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

      <!-- Main Breathing Circle -->
      <c-card mb-4>
        <div flex flex-col items-center justify-center py-6>
          <!-- Breathing Circle -->
          <div relative w-64 h-64 flex items-center justify-center>
            <!-- Outer glow -->
            <div absolute w-64 h-64 rounded-full :style="{
              background: `radial-gradient(circle, ${patternColor}20 0%, transparent 70%)`,
              transform: `scale(${isRunning ? 1.2 + breathCircleScale.value * 0.3 : 1})`,
              transition: 'transform 1s ease-in-out, opacity 0.5s',
            }" />

            <!-- Progress ring -->
            <svg absolute w-64 h-64 viewBox="0 0 256 256" :style="{ transform: 'rotate(-90deg)' }">
              <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4" />
              <circle cx="128" cy="128" r="120" fill="none" :stroke="patternColor" stroke-width="4"
                stroke-linecap="round"
                :stroke-dasharray="`${2 * Math.PI * 120}`"
                :stroke-dashoffset="`${2 * Math.PI * 120 * (1 - ringProgress / 100)}`"
                :style="{ transition: 'stroke-dashoffset 0.1s linear' }"
              />
            </svg>

            <!-- Inner breathing circle -->
            <div relative w-40 h-40 rounded-full flex items-center justify-center :style="{
              background: `radial-gradient(circle at 40% 40%, ${patternColor}40, ${patternColor}15)`,
              border: `2px solid ${patternColor}60`,
              transform: `scale(${breathCircleScale.value})`,
              opacity: breathCircleOpacity.value,
              transition: 'transform 1s ease-in-out, opacity 1s ease-in-out, background 0.5s, border-color 0.5s',
              boxShadow: `0 0 40px ${patternColor}25, inset 0 0 30px ${patternColor}15`,
            }">
              <!-- Inner inner glow -->
              <div w-24 h-24 rounded-full :style="{
                background: `radial-gradient(circle at 35% 35%, ${patternColor}50, ${patternColor}20)`,
                animation: isRunning && !isPaused ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              }" />
            </div>

            <!-- Phase text overlay -->
            <div absolute text-center z-10>
              <div v-if="isRunning" text-2xl font-bold :style="{ color: patternColor }">
                {{ t(`phases.${currentPhase.key}`).value }}
              </div>
              <div v-if="isRunning" text-4xl font-bold mt-2 style="color: rgba(255,255,255,0.9)">
                {{ Math.ceil(currentPhaseRemaining) }}
              </div>
              <div v-if="!isRunning" text-xl font-bold :style="{ color: patternColor }">
                {{ selectedPattern.icon }} {{ t(selectedPattern.nameKey).value }}
              </div>
              <div v-if="!isRunning" text-sm op-50 mt-1>
                {{ t(selectedPattern.descKey).value }}
              </div>
            </div>
          </div>

          <!-- Phase hint -->
          <div v-if="isRunning" mt-4 text-sm op-60 text-center>
            {{ t(`phaseHints.${currentPhase.key}`).value }}
          </div>

          <!-- Session info -->
          <div v-if="isRunning" mt-6 grid grid-cols-3 gap-4 w-full max-w-sm>
            <div text-center>
              <div text-xs op-50>{{ t('cycles').value }}</div>
              <div text-2xl font-bold :style="{ color: patternColor }">{{ completedCycles }}</div>
            </div>
            <div text-center>
              <div text-xs op-50>{{ t('session').value }}</div>
              <div text-2xl font-bold style="color: rgba(255,255,255,0.8)">
                {{ Math.floor(sessionElapsed / 60) }}:{{ String(sessionElapsed % 60).padStart(2, '0') }}
              </div>
            </div>
            <div text-center>
              <div text-xs op-50>{{ t('remaining').value }}</div>
              <div text-2xl font-bold style="color: rgba(255,255,255,0.8)">
                {{ sessionRemainingDisplay || '∞' }}
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div mt-6 flex gap-3>
            <n-button v-if="!isRunning" type="primary" size="large" round
              :style="{ background: patternColor, border: 'none', minWidth: '140px', fontSize: '16px', fontWeight: 'bold' }"
              @click="startBreathing">
              🌬️ {{ t('start').value }}
            </n-button>
            <template v-else>
              <n-button v-if="!isPaused" size="large" round
                :style="{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24', minWidth: '100px' }"
                @click="pauseBreathing">
                ⏸️ {{ t('pause').value }}
              </n-button>
              <n-button v-else size="large" round
                :style="{ background: `${patternColor}25`, border: `1px solid ${patternColor}60`, color: patternColor, minWidth: '100px' }"
                @click="resumeBreathing">
                ▶️ {{ t('resume').value }}
              </n-button>
              <n-button size="large" round type="error"
                :style="{ minWidth: '100px' }"
                @click="stopBreathing(false)">
                ⏹️ {{ t('stop').value }}
              </n-button>
            </template>
          </div>
        </div>
      </c-card>

      <!-- Pattern Selection (only when not running) -->
      <c-card v-if="!isRunning" mb-4>
        <div text-lg font-bold mb-4>{{ t('selectPattern').value }}</div>
        <div grid grid-cols-1 gap-3>
          <div v-for="pattern in patterns" :key="pattern.id"
            p-4 rounded-xl cursor-pointer transition-all-300
            :style="{
              background: selectedPatternId === pattern.id ? `${pattern.color}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedPatternId === pattern.id ? pattern.color + '60' : 'rgba(255,255,255,0.08)'}`,
            }"
            @click="selectedPatternId = pattern.id"
            @mouseenter="($event.currentTarget as HTMLElement).style.borderColor = pattern.color + '80'"
            @mouseleave="($event.currentTarget as HTMLElement).style.borderColor = selectedPatternId === pattern.id ? pattern.color + '60' : 'rgba(255,255,255,0.08)'"
          >
            <div flex items-center gap-3>
              <div text-2xl>{{ pattern.icon }}</div>
              <div flex-1>
                <div font-bold :style="{ color: selectedPatternId === pattern.id ? pattern.color : 'rgba(255,255,255,0.85)' }">
                  {{ t(pattern.nameKey).value }}
                </div>
                <div text-sm op-50>{{ t(pattern.descKey).value }}</div>
              </div>
              <div v-if="selectedPatternId === pattern.id" text-xl :style="{ color: patternColor }">✓</div>
            </div>
            <!-- Phase duration bars -->
            <div mt-3 flex gap-1>
              <div v-if="pattern.inhale > 0" flex items-center gap-1 px-2 py-1 rounded-md text-xs
                :style="{ background: `${pattern.color}20`, color: pattern.color }">
                ↑{{ pattern.inhale }}s
              </div>
              <div v-if="pattern.hold > 0" flex items-center gap-1 px-2 py-1 rounded-md text-xs
                :style="{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }">
                ⏸{{ pattern.hold }}s
              </div>
              <div v-if="pattern.exhale > 0" flex items-center gap-1 px-2 py-1 rounded-md text-xs
                :style="{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }">
                ↓{{ pattern.exhale }}s
              </div>
              <div v-if="pattern.holdExhale > 0" flex items-center gap-1 px-2 py-1 rounded-md text-xs
                :style="{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }">
                ⏸{{ pattern.holdExhale }}s
              </div>
            </div>
          </div>

          <!-- Custom Pattern -->
          <div p-4 rounded-xl cursor-pointer transition-all-300
            :style="{
              background: selectedPatternId === 'custom' ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedPatternId === 'custom' ? 'rgba(251,146,60,0.5)' : 'rgba(255,255,255,0.08)'}`,
            }"
            @click="showCustomPattern = !showCustomPattern; selectedPatternId = 'custom'">
            <div flex items-center gap-3>
              <div text-2xl>🟧</div>
              <div flex-1>
                <div font-bold :style="{ color: selectedPatternId === 'custom' ? '#fb923c' : 'rgba(255,255,255,0.85)' }">
                  {{ t('customPattern').value }}
                </div>
                <div text-sm op-50>{{ customInhale }}-{{ customHold }}-{{ customExhale }}-{{ customHoldExhale }}</div>
              </div>
              <div text-sm :style="{ transform: showCustomPattern ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }">▼</div>
            </div>
          </div>

          <!-- Custom pattern inputs -->
          <div v-if="showCustomPattern" p-4 rounded-xl style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08)">
            <div grid grid-cols-2 gap-3>
              <div>
                <div text-sm op-60 mb-1>{{ t('inhaleTime').value }}</div>
                <n-input-number v-model:value="customInhale" :min="1" :max="30" size="small" style="width: 100%">
                  <template #suffix>{{ t('secondsUnit').value }}</template>
                </n-input-number>
              </div>
              <div>
                <div text-sm op-60 mb-1>{{ t('holdTime').value }}</div>
                <n-input-number v-model:value="customHold" :min="0" :max="30" size="small" style="width: 100%">
                  <template #suffix>{{ t('secondsUnit').value }}</template>
                </n-input-number>
              </div>
              <div>
                <div text-sm op-60 mb-1>{{ t('exhaleTime').value }}</div>
                <n-input-number v-model:value="customExhale" :min="1" :max="30" size="small" style="width: 100%">
                  <template #suffix>{{ t('secondsUnit').value }}</template>
                </n-input-number>
              </div>
              <div>
                <div text-sm op-60 mb-1>{{ t('holdExhaleTime').value }}</div>
                <n-input-number v-model:value="customHoldExhale" :min="0" :max="30" size="small" style="width: 100%">
                  <template #suffix>{{ t('secondsUnit').value }}</template>
                </n-input-number>
              </div>
            </div>
            <n-button mt-3 size="small" type="primary" round @click="selectedPatternId = 'custom'">
              ✅ {{ t('apply').value }}
            </n-button>
          </div>
        </div>
      </c-card>

      <!-- Today Stats -->
      <c-card mb-4>
        <div grid grid-cols-3 gap-3>
          <div p-3 rounded-lg text-center :style="{ background: `${patternColor}15`, border: `1px solid ${patternColor}30` }">
            <div text-xs op-50>{{ t('todayCycles').value }}</div>
            <div text-2xl font-bold :style="{ color: patternColor }">{{ todayCycles }}</div>
          </div>
          <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05)); border: 1px solid rgba(34,197,94,0.3)">
            <div text-xs op-50>{{ t('totalMinutes').value }}</div>
            <div text-2xl font-bold text-green-400>{{ todayMinutes }}</div>
          </div>
          <div p-3 rounded-lg text-center style="background: linear-gradient(135deg, rgba(251,146,60,0.15), rgba(251,146,60,0.05)); border: 1px solid rgba(251,146,60,0.3)">
            <div text-xs op-50>{{ t('streak').value }}</div>
            <div text-2xl font-bold text-orange-400>{{ streak }}<span text-sm ml-1>{{ t('day').value }}</span></div>
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
          <!-- Duration -->
          <div mb-4>
            <div text-sm font-bold mb-2>{{ t('sessionDuration').value }}</div>
            <div flex flex-wrap gap-2>
              <n-button v-for="opt in durationOptions" :key="opt.value" size="medium" round
                :type="targetDuration === opt.value ? 'primary' : 'default'"
                @click="targetDuration = opt.value">
                {{ opt.label }}
              </n-button>
            </div>
          </div>
          <!-- Sound -->
          <div mb-4>
            <div text-sm font-bold mb-2>{{ t('sound').value }}</div>
            <n-switch :value="soundEnabled" @update:value="soundEnabled = $event" size="large">
              <template #checked>{{ t('soundOn').value }}</template>
              <template #unchecked>{{ t('soundOff').value }}</template>
            </n-switch>
          </div>
          <!-- Vibration -->
          <div>
            <div text-sm font-bold mb-2>{{ t('vibration').value }}</div>
            <n-switch :value="vibrationEnabled" @update:value="vibrationEnabled = $event" size="large" />
          </div>
        </div>
      </c-card>

      <!-- Benefits -->
      <c-card mb-4>
        <div text-lg font-bold mb-3>🌿 {{ t('benefits').value }}</div>
        <div grid grid-cols-1 gap-2>
          <div v-for="i in 6" :key="i" flex items-center gap-2 p-2 rounded-lg
            style="background: rgba(255,255,255,0.02)">
            <div text-base>{{ t(`benefit${i}`).value }}</div>
          </div>
        </div>
      </c-card>

      <!-- Tips -->
      <c-card mb-4>
        <div flex items-center gap-3>
          <div text-3xl>💡</div>
          <div>
            <div text-sm op-60>{{ t('tips').value }}</div>
            <div text-base font-bold mt-1>{{ t(`tip${(new Date().getDay() % 5) + 1}`).value }}</div>
          </div>
        </div>
      </c-card>

    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}
</style>
