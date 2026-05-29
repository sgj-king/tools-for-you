<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import {
  NButton,
  NInputNumber,
  NGrid,
  NGi,
  NSelect,
  NIcon,
  NTabPane,
  NTabs,
  NTooltip,
  NRadioGroup,
  NRadio,
  NScrollbar,
} from 'naive-ui';
import { Copy, Refresh, Run, InfoCircle } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '配速计算器',
    subtitle: '计算跑步/骑行配速，支持时间/距离/配速互算、比赛预测、分段配速表',
    // Tabs
    paceCalc: '配速计算',
    racePredict: '比赛预测',
    splitTable: '分段配速',
    // Mode
    mode: '计算模式',
    paceFromTime: '已知距离和时间 → 配速',
    timeFromPace: '已知距离和配速 → 时间',
    distanceFromPace: '已知配速和时间 → 距离',
    // Inputs
    distance: '距离',
    hours: '时',
    minutes: '分',
    seconds: '秒',
    paceMin: '配速（分）',
    paceSec: '配速（秒）',
    time: '完成时间',
    pace: '配速',
    speed: '速度',
    perKm: '/公里',
    perMile: '/英里',
    km: '公里',
    mile: '英里',
    kmh: '公里/小时',
    mph: '英里/小时',
    distanceUnit: '距离单位',
    paceUnit: '配速单位',
    // Results
    result: '计算结果',
    yourPace: '你的配速',
    yourTime: '完成时间',
    yourDistance: '完成距离',
    yourSpeed: '你的速度',
    // Race Predict
    raceDistance: '比赛距离',
    recentTime: '近期完赛时间',
    recentDistance: '近期比赛距离',
    predictResult: '预测完赛时间',
    predictPace: '预测配速',
    race5k: '5公里',
    race10k: '10公里',
    raceHalf: '半程马拉松',
    raceFull: '全程马拉松',
    raceCustom: '自定义',
    customDistance: '自定义距离(km)',
    predictNote: '预测基于 Riegel 公式：T₂ = T₁ × (D₂/D₁)^1.06，仅供参考',
    // Splits
    splitEvery: '分段间隔',
    split1km: '每1公里',
    split5km: '每5公里',
    split1mile: '每1英里',
    split: '分段',
    splitDistance: '分段距离',
    splitTime: '累计时间',
    splitPace: '分段配速',
    total: '总计',
    // Preset distances
    presetDistances: '快捷距离',
    // Tips
    tips: '跑步配速参考',
    beginner: '初学者',
    intermediate: '进阶者',
    advanced: '进阶跑者',
    elite: '精英跑者',
    easyPace: '轻松跑',
    tempoPace: '节奏跑',
    intervalPace: '间歇跑',
    referenceNote: '以上配速仅供参考，实际配速受个人体能、天气、地形等因素影响',
    // Actions
    copy: '复制',
    copied: '已复制！',
    reset: '重置',
    // Format
    format: '格式',
    paceFormat: '{min}\'{sec}"',
  },
  en: {
    title: 'Pace Calculator',
    subtitle: 'Calculate running/cycling pace, time-distance-pace conversion, race prediction, and split tables',
    // Tabs
    paceCalc: 'Pace Calculator',
    racePredict: 'Race Prediction',
    splitTable: 'Splits Table',
    // Mode
    mode: 'Calculation Mode',
    paceFromTime: 'Distance + Time → Pace',
    timeFromPace: 'Distance + Pace → Time',
    distanceFromPace: 'Pace + Time → Distance',
    // Inputs
    distance: 'Distance',
    hours: 'Hr',
    minutes: 'Min',
    seconds: 'Sec',
    paceMin: 'Pace (min)',
    paceSec: 'Pace (sec)',
    time: 'Finish Time',
    pace: 'Pace',
    speed: 'Speed',
    perKm: '/km',
    perMile: '/mile',
    km: 'km',
    mile: 'mile',
    kmh: 'km/h',
    mph: 'mph',
    distanceUnit: 'Distance Unit',
    paceUnit: 'Pace Unit',
    // Results
    result: 'Result',
    yourPace: 'Your Pace',
    yourTime: 'Finish Time',
    yourDistance: 'Distance',
    yourSpeed: 'Your Speed',
    // Race Predict
    raceDistance: 'Race Distance',
    recentTime: 'Recent Finish Time',
    recentDistance: 'Recent Race Distance',
    predictResult: 'Predicted Finish Time',
    predictPace: 'Predicted Pace',
    race5k: '5K',
    race10k: '10K',
    raceHalf: 'Half Marathon',
    raceFull: 'Marathon',
    raceCustom: 'Custom',
    customDistance: 'Custom Distance (km)',
    predictNote: 'Prediction based on Riegel formula: T₂ = T₁ × (D₂/D₁)^1.06, for reference only',
    // Splits
    splitEvery: 'Split Interval',
    split1km: 'Every 1 km',
    split5km: 'Every 5 km',
    split1mile: 'Every 1 mile',
    split: 'Split',
    splitDistance: 'Split Distance',
    splitTime: 'Cumulative Time',
    splitPace: 'Split Pace',
    total: 'Total',
    // Preset distances
    presetDistances: 'Quick Distances',
    // Tips
    tips: 'Pace Reference',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced Runner',
    elite: 'Elite',
    easyPace: 'Easy Run',
    tempoPace: 'Tempo Run',
    intervalPace: 'Interval Run',
    referenceNote: 'Paces are for reference only. Actual pace depends on fitness, weather, terrain, etc.',
    // Actions
    copy: 'Copy',
    copied: 'Copied!',
    reset: 'Reset',
    // Format
    format: 'Format',
    paceFormat: '{min}\':{sec}"',
  },
};

const lang = useStorage<'zh' | 'en'>('pace-calculator-lang', 'zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Common State =====================
const distanceUnit = ref<'km' | 'mile'>('km');
const paceUnit = ref<'perKm' | 'perMile'>('perKm');
const activeTab = ref('pace');

// ===================== Pace Calculator State =====================
const calcMode = ref<'paceFromTime' | 'timeFromPace' | 'distanceFromPace'>('paceFromTime');
const inputDistance = ref<number | null>(null);
const inputHours = ref(0);
const inputMinutes = ref(0);
const inputSeconds = ref(0);
const inputPaceMin = ref<number | null>(null);
const inputPaceSec = ref<number | null>(0);

// Preset distances
const presetDistances = computed(() => [
  { label: '5K', value: 5 },
  { label: '10K', value: 10 },
  { label: lang.value === 'zh' ? '半马' : 'Half', value: 21.0975 },
  { label: lang.value === 'zh' ? '全马' : 'Full', value: 42.195 },
]);

function setPresetDistance(km: number) {
  inputDistance.value = km;
  if (distanceUnit.value === 'mile') {
    inputDistance.value = +(km / 1.60934).toFixed(4);
  }
}

// Convert input distance to km
function distanceToKm(d: number): number {
  return distanceUnit.value === 'mile' ? d * 1.60934 : d;
}

// Convert km to display distance
function kmToDisplay(km: number): number {
  return distanceUnit.value === 'mile' ? km / 1.60934 : km;
}

// Time to seconds
function timeToSeconds(h: number, m: number, s: number): number {
  return h * 3600 + m * 60 + s;
}

// Seconds to {h, m, s}
function secondsToTime(sec: number): { h: number; m: number; s: number } {
  const h = Math.floor(sec / 3600);
  const remainder = sec % 3600;
  const m = Math.floor(remainder / 60);
  const s = Math.round(remainder % 60);
  return { h, m, s };
}

// Pace in sec/km
function paceToSecPerKm(min: number, sec: number): number {
  const totalSec = min * 60 + sec;
  if (paceUnit.value === 'perMile') return totalSec / 1.60934;
  return totalSec;
}

// sec/km to display pace
function secPerKmToPace(secPerKm: number): { min: number; sec: number } {
  let displaySec = secPerKm;
  if (paceUnit.value === 'perMile') displaySec *= 1.60934;
  const min = Math.floor(displaySec / 60);
  const sec = Math.round(displaySec % 60);
  return { min, sec };
}

// ===================== Pace Calc Computed =====================
const paceResult = computed(() => {
  if (calcMode.value === 'paceFromTime') {
    if (!inputDistance.value || inputDistance.value <= 0) return null;
    const totalSec = timeToSeconds(inputHours.value, inputMinutes.value, inputSeconds.value);
    if (totalSec <= 0) return null;
    const distKm = distanceToKm(inputDistance.value);
    const secPerKm = totalSec / distKm;
    const pace = secPerKmToPace(secPerKm);
    const speedKmh = distKm / (totalSec / 3600);
    return {
      type: 'pace' as const,
      pace,
      secPerKm,
      speedKmh,
      speedMph: speedKmh / 1.60934,
      totalSeconds: totalSec,
      distanceKm: distKm,
    };
  }
  if (calcMode.value === 'timeFromPace') {
    if (!inputDistance.value || inputDistance.value <= 0) return null;
    if (inputPaceMin.value === null || inputPaceMin.value < 0) return null;
    const secPerKm = paceToSecPerKm(inputPaceMin.value, inputPaceSec.value || 0);
    const distKm = distanceToKm(inputDistance.value);
    const totalSec = secPerKm * distKm;
    const time = secondsToTime(totalSec);
    const speedKmh = distKm / (totalSec / 3600);
    return {
      type: 'time' as const,
      time,
      totalSeconds: totalSec,
      speedKmh,
      speedMph: speedKmh / 1.60934,
      secPerKm,
      distanceKm: distKm,
    };
  }
  // distanceFromPace
  if (inputPaceMin.value === null || inputPaceMin.value < 0) return null;
  const totalSec = timeToSeconds(inputHours.value, inputMinutes.value, inputSeconds.value);
  if (totalSec <= 0) return null;
  const secPerKm2 = paceToSecPerKm(inputPaceMin.value, inputPaceSec.value || 0);
  if (secPerKm2 <= 0) return null;
  const distKm2 = totalSec / secPerKm2;
  const speedKmh2 = distKm2 / (totalSec / 3600);
  return {
    type: 'distance' as const,
    distanceKm: distKm2,
    distanceDisplay: kmToDisplay(distKm2),
    speedKmh: speedKmh2,
    speedMph: speedKmh2 / 1.60934,
    secPerKm: secPerKm2,
    totalSeconds: totalSec,
  };
});

// ===================== Race Prediction State =====================
const recentHours = ref(0);
const recentMinutes = ref(0);
const recentSeconds = ref(0);
const recentDistanceKm = ref<number | null>(10);
const targetRace = ref<'5k' | '10k' | 'half' | 'full' | 'custom'>('half');
const customRaceKm = ref<number | null>(null);

const raceDistanceMap: Record<string, number> = {
  '5k': 5,
  '10k': 10,
  half: 21.0975,
  full: 42.195,
};

const targetDistanceKm = computed(() => {
  if (targetRace.value === 'custom') return customRaceKm.value || 0;
  return raceDistanceMap[targetRace.value] || 0;
});

const racePrediction = computed(() => {
  if (!recentDistanceKm.value || recentDistanceKm.value <= 0) return null;
  if (!targetDistanceKm.value || targetDistanceKm.value <= 0) return null;
  const t1 = timeToSeconds(recentHours.value, recentMinutes.value, recentSeconds.value);
  if (t1 <= 0) return null;
  const d1 = recentDistanceKm.value;
  const d2 = targetDistanceKm.value;
  // Riegel formula: T2 = T1 × (D2/D1)^1.06
  const t2 = t1 * Math.pow(d2 / d1, 1.06);
  const time = secondsToTime(t2);
  const secPerKm = t2 / d2;
  const pace = secPerKmToPace(secPerKm);
  return { time, totalSeconds: t2, pace, secPerKm, distance: d2 };
});

// ===================== Splits Table State =====================
const splitInterval = ref<'1km' | '5km' | '1mile'>('1km');
const splitPaceMin = ref<number | null>(5);
const splitPaceSec = ref<number | null>(30);
const splitTotalDistance = ref<number | null>(10);

const splitData = computed(() => {
  if (splitPaceMin.value === null || splitTotalDistance.value === null || splitTotalDistance.value <= 0) return [];
  const secPerKm = paceToSecPerKm(splitPaceMin.value, splitPaceSec.value || 0);
  if (secPerKm <= 0) return [];
  const totalKm = distanceToKm(splitTotalDistance.value);

  let intervalKm: number;
  let intervalLabel: string;
  switch (splitInterval.value) {
    case '1km':
      intervalKm = 1;
      intervalLabel = '1 km';
      break;
    case '5km':
      intervalKm = 5;
      intervalLabel = '5 km';
      break;
    case '1mile':
      intervalKm = 1.60934;
      intervalLabel = '1 mile';
      break;
    default:
      intervalKm = 1;
      intervalLabel = '1 km';
  }

  const splits: { label: string; distance: number; cumulativeTime: number; splitPace: string }[] = [];
  let cumulativeDistance = 0;
  let num = 1;

  while (cumulativeDistance < totalKm) {
    const remaining = totalKm - cumulativeDistance;
    const thisInterval = Math.min(intervalKm, remaining);
    const cumulativeTime = cumulativeDistance * secPerKm + thisInterval * secPerKm;
    cumulativeDistance += thisInterval;

    const displayDist = distanceUnit.value === 'mile' ? cumulativeDistance / 1.60934 : cumulativeDistance;
    const paceDisplay = secPerKmToPace(secPerKm);

    const time = secondsToTime(cumulativeTime);
    const timeStr = time.h > 0
      ? `${time.h}:${String(time.m).padStart(2, '0')}:${String(time.s).padStart(2, '0')}`
      : `${time.m}:${String(time.s).padStart(2, '0')}`;

    const distLabel = distanceUnit.value === 'mile'
      ? `${displayDist.toFixed(2)} mi`
      : `${displayDist.toFixed(2)} km`;

    splits.push({
      label: `#${num}`,
      distance: cumulativeDistance,
      cumulativeTime,
      splitPace: `${paceDisplay.min}'${String(paceDisplay.sec).padStart(2, '0')}"`,
    });

    // Store formatted strings
    splits[splits.length - 1].label = `#${num}  ${distLabel}`;
    splits[splits.length - 1].splitPace = `${timeStr}  |  ${paceDisplay.min}'${String(paceDisplay.sec).padStart(2, '0')}"`;

    num++;
  }

  return splits;
});

// ===================== Pace Reference =====================
const paceReference = computed(() => [
  {
    level: labels[lang.value].beginner,
    easy: '7:00-7:30',
    tempo: '6:00-6:30',
    interval: '5:30-6:00',
  },
  {
    level: labels[lang.value].intermediate,
    easy: '6:00-6:30',
    tempo: '5:00-5:30',
    interval: '4:30-5:00',
  },
  {
    level: labels[lang.value].advanced,
    easy: '5:00-5:30',
    tempo: '4:15-4:45',
    interval: '3:45-4:15',
  },
  {
    level: labels[lang.value].elite,
    easy: '4:15-4:45',
    tempo: '3:30-3:50',
    interval: '3:10-3:30',
  },
]);

// ===================== Format Helpers =====================
function formatTime(h: number, m: number, s: number): string {
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(min: number, sec: number): string {
  return `${min}'${String(sec).padStart(2, '0')}"`;
}

function formatPaceWithUnit(min: number, sec: number): string {
  const unit = paceUnit.value === 'perKm'
    ? (lang.value === 'zh' ? '/公里' : '/km')
    : (lang.value === 'zh' ? '/英里' : '/mile');
  return `${min}'${String(sec).padStart(2, '0')}"${unit}`;
}

// ===================== Copy =====================
const copied = ref(false);
function copyResult() {
  if (!paceResult.value) return;
  let text = '';
  const r = paceResult.value;
  if (r.type === 'pace') {
    text = `${formatPaceWithUnit(r.pace.min, r.pace.sec)} | ${r.speedKmh.toFixed(1)} km/h`;
  } else if (r.type === 'time') {
    text = `${formatTime(r.time.h, r.time.m, r.time.s)} | ${r.speedKmh.toFixed(1)} km/h`;
  } else {
    text = `${r.distanceKm.toFixed(2)} km | ${r.speedKmh.toFixed(1)} km/h`;
  }
  navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

function copyRacePrediction() {
  if (!racePrediction.value) return;
  const r = racePrediction.value;
  const text = `${formatTime(r.time.h, r.time.m, r.time.s)} | ${formatPace(r.pace.min, r.pace.sec)}/km`;
  navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

// ===================== Reset =====================
function resetPaceCalc() {
  inputDistance.value = null;
  inputHours.value = 0;
  inputMinutes.value = 0;
  inputSeconds.value = 0;
  inputPaceMin.value = null;
  inputPaceSec.value = 0;
}

function resetRacePredict() {
  recentHours.value = 0;
  recentMinutes.value = 0;
  recentSeconds.value = 0;
  recentDistanceKm.value = 10;
  targetRace.value = 'half';
  customRaceKm.value = null;
}
</script>

<template>
  <div class="pace-calculator">
    <!-- Header -->
    <div class="tool-header">
      <div class="header-left">
        <n-icon size="28" color="#7c3aed"><Run /></n-icon>
        <div>
          <h2 class="tool-title">{{ t('title').value }}</h2>
          <p class="tool-subtitle">{{ t('subtitle').value }}</p>
        </div>
      </div>
      <div class="header-right">
        <n-button
          size="small"
          :type="lang === 'zh' ? 'primary' : 'default'"
          @click="lang = 'zh'"
          round
        >中</n-button>
        <n-button
          size="small"
          :type="lang === 'en' ? 'primary' : 'default'"
          @click="lang = 'en'"
          round
        >EN</n-button>
      </div>
    </div>

    <!-- Tabs -->
    <n-tabs v-model:value="activeTab" type="segment" animated class="main-tabs">
      <!-- ========== Tab 1: Pace Calculator ========== -->
      <n-tab-pane name="pace" :tab="t('paceCalc').value">
        <!-- Mode selector -->
        <div class="mode-selector">
          <n-radio-group v-model:value="calcMode" size="small">
            <n-radio value="paceFromTime">{{ t('paceFromTime').value }}</n-radio>
            <n-radio value="timeFromPace">{{ t('timeFromPace').value }}</n-radio>
            <n-radio value="distanceFromPace">{{ t('distanceFromPace').value }}</n-radio>
          </n-radio-group>
        </div>

        <!-- Quick distance presets -->
        <div class="preset-row" v-if="calcMode !== 'distanceFromPace'">
          <span class="preset-label">{{ t('presetDistances').value }}：</span>
          <n-button
            v-for="p in presetDistances"
            :key="p.value"
            size="tiny"
            round
            :type="inputDistance === (distanceUnit === 'mile' ? +(p.value / 1.60934).toFixed(4) : p.value) ? 'primary' : 'default'"
            @click="setPresetDistance(p.value)"
          >{{ p.label }}</n-button>
        </div>

        <!-- Input area -->
        <div class="input-grid">
          <!-- Distance input -->
          <div class="input-section" v-if="calcMode !== 'distanceFromPace'">
            <label class="input-label">{{ t('distance').value }}</label>
            <div class="input-row">
              <n-input-number
                v-model:value="inputDistance"
                :placeholder="t('distance').value"
                :min="0"
                :step="0.1"
                class="input-field"
                clearable
              />
              <n-select
                v-model:value="distanceUnit"
                :options="[
                  { label: t('km').value, value: 'km' },
                  { label: t('mile').value, value: 'mile' },
                ]"
                class="unit-select"
                size="small"
              />
            </div>
          </div>

          <!-- Time input -->
          <div class="input-section" v-if="calcMode !== 'timeFromPace'">
            <label class="input-label">{{ t('time').value }}</label>
            <div class="time-inputs">
              <div class="time-group">
                <n-input-number v-model:value="inputHours" :min="0" :max="99" size="small" class="time-field" />
                <span class="time-label">{{ t('hours').value }}</span>
              </div>
              <div class="time-group">
                <n-input-number v-model:value="inputMinutes" :min="0" :max="59" size="small" class="time-field" />
                <span class="time-label">{{ t('minutes').value }}</span>
              </div>
              <div class="time-group">
                <n-input-number v-model:value="inputSeconds" :min="0" :max="59" size="small" class="time-field" />
                <span class="time-label">{{ t('seconds').value }}</span>
              </div>
            </div>
          </div>

          <!-- Pace input -->
          <div class="input-section" v-if="calcMode !== 'paceFromTime'">
            <label class="input-label">{{ t('pace').value }}</label>
            <div class="pace-inputs">
              <div class="time-group">
                <n-input-number v-model:value="inputPaceMin" :min="0" :max="59" size="small" class="time-field" placeholder="min" />
                <span class="time-label">{{ t('minutes').value }}</span>
              </div>
              <div class="time-group">
                <n-input-number v-model:value="inputPaceSec" :min="0" :max="59" size="small" class="time-field" placeholder="sec" />
                <span class="time-label">{{ t('seconds').value }}</span>
              </div>
              <n-select
                v-model:value="paceUnit"
                :options="[
                  { label: t('perKm').value, value: 'perKm' },
                  { label: t('perMile').value, value: 'perMile' },
                ]"
                class="unit-select pace-unit-select"
                size="small"
              />
            </div>
          </div>
        </div>

        <!-- Result -->
        <div class="result-card" v-if="paceResult">
          <div class="result-header">
            <span class="result-title">{{ t('result').value }}</span>
            <div class="result-actions">
              <n-button size="tiny" round @click="copyResult" :type="copied ? 'success' : 'default'">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ copied ? t('copied').value : t('copy').value }}
              </n-button>
              <n-button size="tiny" round @click="resetPaceCalc">
                <template #icon><n-icon><Refresh /></n-icon></template>
                {{ t('reset').value }}
              </n-button>
            </div>
          </div>

          <div class="result-values">
            <!-- Pace result -->
            <div class="result-item" v-if="paceResult.type === 'pace'">
              <div class="result-label">{{ t('yourPace').value }}</div>
              <div class="result-value highlight">
                {{ formatPaceWithUnit(paceResult.pace.min, paceResult.pace.sec) }}
              </div>
            </div>

            <!-- Time result -->
            <div class="result-item" v-if="paceResult.type === 'time'">
              <div class="result-label">{{ t('yourTime').value }}</div>
              <div class="result-value highlight">
                {{ formatTime(paceResult.time.h, paceResult.time.m, paceResult.time.s) }}
              </div>
            </div>

            <!-- Distance result -->
            <div class="result-item" v-if="paceResult.type === 'distance'">
              <div class="result-label">{{ t('yourDistance').value }}</div>
              <div class="result-value highlight">
                {{ paceResult.distanceKm.toFixed(2) }} km
                <span class="sub-value">/ {{ paceResult.distanceDisplay.toFixed(2) }} {{ distanceUnit === 'mile' ? 'mi' : 'km' }}</span>
              </div>
            </div>

            <!-- Speed -->
            <div class="result-item">
              <div class="result-label">{{ t('yourSpeed').value }}</div>
              <div class="result-value">
                {{ paceResult.speedKmh.toFixed(1) }} km/h
                <span class="sub-value">/ {{ paceResult.speedMph.toFixed(1) }} mph</span>
              </div>
            </div>

            <!-- Cross info -->
            <div class="result-item" v-if="paceResult.type === 'pace'">
              <div class="result-label">{{ t('speed').value }}</div>
              <div class="result-value">
                {{ paceResult.speedKmh.toFixed(1) }} km/h
                <span class="sub-value">/ {{ paceResult.speedMph.toFixed(1) }} mph</span>
              </div>
            </div>

            <div class="result-item" v-if="paceResult.type !== 'pace'">
              <div class="result-label">{{ t('pace').value }}</div>
              <div class="result-value">
                {{ formatPaceWithUnit(secPerKmToPace(paceResult.secPerKm).min, secPerKmToPace(paceResult.secPerKm).sec) }}
              </div>
            </div>
          </div>
        </div>

        <!-- No result hint -->
        <div class="no-result" v-else>
          <span>🏃 {{ lang === 'zh' ? '输入距离和时间开始计算' : 'Enter distance and time to calculate' }}</span>
        </div>
      </n-tab-pane>

      <!-- ========== Tab 2: Race Prediction ========== -->
      <n-tab-pane name="race" :tab="t('racePredict').value">
        <div class="input-grid">
          <!-- Recent race -->
          <div class="input-section">
            <label class="input-label">{{ t('recentDistance').value }}</label>
            <div class="input-row">
              <n-input-number
                v-model:value="recentDistanceKm"
                :min="0"
                :step="0.1"
                class="input-field"
                placeholder="km"
              />
              <span class="unit-label">km</span>
            </div>
          </div>

          <div class="input-section">
            <label class="input-label">{{ t('recentTime').value }}</label>
            <div class="time-inputs">
              <div class="time-group">
                <n-input-number v-model:value="recentHours" :min="0" :max="99" size="small" class="time-field" />
                <span class="time-label">{{ t('hours').value }}</span>
              </div>
              <div class="time-group">
                <n-input-number v-model:value="recentMinutes" :min="0" :max="59" size="small" class="time-field" />
                <span class="time-label">{{ t('minutes').value }}</span>
              </div>
              <div class="time-group">
                <n-input-number v-model:value="recentSeconds" :min="0" :max="59" size="small" class="time-field" />
                <span class="time-label">{{ t('seconds').value }}</span>
              </div>
            </div>
          </div>

          <!-- Target race -->
          <div class="input-section">
            <label class="input-label">{{ t('raceDistance').value }}</label>
            <div class="race-buttons">
              <n-button
                v-for="r in [
                  { key: '5k', label: t('race5k').value },
                  { key: '10k', label: t('race10k').value },
                  { key: 'half', label: t('raceHalf').value },
                  { key: 'full', label: t('raceFull').value },
                  { key: 'custom', label: t('raceCustom').value },
                ]"
                :key="r.key"
                size="small"
                round
                :type="targetRace === r.key ? 'primary' : 'default'"
                @click="targetRace = r.key as any"
              >{{ r.label }}</n-button>
            </div>
            <n-input-number
              v-if="targetRace === 'custom'"
              v-model:value="customRaceKm"
              :min="0"
              :step="0.1"
              :placeholder="t('customDistance').value"
              class="input-field custom-input"
              size="small"
            />
          </div>
        </div>

        <!-- Prediction Result -->
        <div class="result-card" v-if="racePrediction">
          <div class="result-header">
            <span class="result-title">{{ t('predictResult').value }}</span>
            <div class="result-actions">
              <n-button size="tiny" round @click="copyRacePrediction" :type="copied ? 'success' : 'default'">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ copied ? t('copied').value : t('copy').value }}
              </n-button>
              <n-button size="tiny" round @click="resetRacePredict">
                <template #icon><n-icon><Refresh /></n-icon></template>
                {{ t('reset').value }}
              </n-button>
            </div>
          </div>
          <div class="result-values">
            <div class="result-item">
              <div class="result-label">{{ t('predictResult').value }}</div>
              <div class="result-value highlight">
                {{ formatTime(racePrediction.time.h, racePrediction.time.m, racePrediction.time.s) }}
              </div>
            </div>
            <div class="result-item">
              <div class="result-label">{{ t('predictPace').value }}</div>
              <div class="result-value highlight">
                {{ formatPaceWithUnit(racePrediction.pace.min, racePrediction.pace.sec) }}
              </div>
            </div>
          </div>
          <div class="predict-note">
            <n-icon size="14"><InfoCircle /></n-icon>
            {{ t('predictNote').value }}
          </div>
        </div>
        <div class="no-result" v-else>
          <span>🏆 {{ lang === 'zh' ? '输入近期比赛成绩进行预测' : 'Enter recent race result to predict' }}</span>
        </div>
      </n-tab-pane>

      <!-- ========== Tab 3: Splits Table ========== -->
      <n-tab-pane name="splits" :tab="t('splitTable').value">
        <div class="input-grid">
          <div class="input-section">
            <label class="input-label">{{ t('pace').value }}</label>
            <div class="pace-inputs">
              <div class="time-group">
                <n-input-number v-model:value="splitPaceMin" :min="0" :max="59" size="small" class="time-field" />
                <span class="time-label">{{ t('minutes').value }}</span>
              </div>
              <div class="time-group">
                <n-input-number v-model:value="splitPaceSec" :min="0" :max="59" size="small" class="time-field" />
                <span class="time-label">{{ t('seconds').value }}</span>
              </div>
            </div>
          </div>

          <div class="input-section">
            <label class="input-label">{{ t('distance').value }}</label>
            <div class="input-row">
              <n-input-number
                v-model:value="splitTotalDistance"
                :min="0"
                :step="0.1"
                class="input-field"
                :placeholder="t('distance').value"
              />
              <n-select
                v-model:value="distanceUnit"
                :options="[
                  { label: t('km').value, value: 'km' },
                  { label: t('mile').value, value: 'mile' },
                ]"
                class="unit-select"
                size="small"
              />
            </div>
          </div>

          <div class="input-section">
            <label class="input-label">{{ t('splitEvery').value }}</label>
            <div class="race-buttons">
              <n-button
                v-for="s in [
                  { key: '1km', label: t('split1km').value },
                  { key: '5km', label: t('split5km').value },
                  { key: '1mile', label: t('split1mile').value },
                ]"
                :key="s.key"
                size="small"
                round
                :type="splitInterval === s.key ? 'primary' : 'default'"
                @click="splitInterval = s.key as any"
              >{{ s.label }}</n-button>
            </div>
          </div>
        </div>

        <!-- Splits Table -->
        <div class="splits-table" v-if="splitData.length > 0">
          <div class="split-header">
            <span>{{ t('split').value }}</span>
            <span>{{ t('splitTime').value }} / {{ t('splitPace').value }}</span>
          </div>
          <div class="split-row" v-for="(s, i) in splitData" :key="i"
               :class="{ 'even-row': i % 2 === 0 }">
            <span class="split-label">{{ s.label }}</span>
            <span class="split-value">{{ s.splitPace }}</span>
          </div>
        </div>
        <div class="no-result" v-else>
          <span>📊 {{ lang === 'zh' ? '输入配速和距离生成分段表' : 'Enter pace and distance for splits' }}</span>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- Pace Reference -->
    <div class="reference-section">
      <h3 class="section-title">🏃‍♂️ {{ t('tips').value }}</h3>
      <div class="reference-table">
        <div class="ref-header">
          <span>{{ lang === 'zh' ? '水平' : 'Level' }}</span>
          <span>{{ t('easyPace').value }}</span>
          <span>{{ t('tempoPace').value }}</span>
          <span>{{ t('intervalPace').value }}</span>
        </div>
        <div class="ref-row" v-for="(r, i) in paceReference" :key="i" :class="{ 'even-row': i % 2 === 0 }">
          <span class="ref-level">{{ r.level }}</span>
          <span>{{ r.easy }}</span>
          <span>{{ r.tempo }}</span>
          <span>{{ r.interval }}</span>
        </div>
      </div>
      <p class="ref-note">{{ t('referenceNote').value }}</p>
    </div>
  </div>
</template>

<style scoped>
.pace-calculator {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #7c3aed, #a855f7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tool-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #a1a1aa;
}

.header-right {
  display: flex;
  gap: 6px;
}

.main-tabs {
  margin-bottom: 20px;
}

.mode-selector {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(124, 58, 237, 0.08);
  border-radius: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.preset-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 13px;
  color: #a1a1aa;
  white-space: nowrap;
}

.input-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-bottom: 20px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: #d4d4d8;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-field {
  flex: 1;
}

.unit-select {
  width: 90px;
  flex-shrink: 0;
}

.unit-label {
  font-size: 13px;
  color: #a1a1aa;
  flex-shrink: 0;
}

.time-inputs,
.pace-inputs {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.time-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-field {
  width: 72px;
}

.time-label {
  font-size: 12px;
  color: #71717a;
}

.pace-unit-select {
  width: 90px;
}

.race-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.custom-input {
  margin-top: 8px;
  max-width: 200px;
}

/* Result Card */
.result-card {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(168, 85, 247, 0.06));
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: #c084fc;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.result-values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-label {
  font-size: 12px;
  color: #71717a;
}

.result-value {
  font-size: 20px;
  font-weight: 700;
  color: #e4e4e7;
}

.result-value.highlight {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 26px;
}

.sub-value {
  font-size: 13px;
  font-weight: 400;
  color: #71717a;
  margin-left: 6px;
}

.no-result {
  text-align: center;
  padding: 40px 20px;
  color: #52525b;
  font-size: 14px;
}

.predict-note {
  margin-top: 12px;
  font-size: 12px;
  color: #71717a;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Splits Table */
.splits-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.15);
  margin-bottom: 20px;
}

.split-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(124, 58, 237, 0.15);
  font-size: 12px;
  font-weight: 600;
  color: #c084fc;
}

.split-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
  transition: background 0.15s;
}

.split-row:hover {
  background: rgba(124, 58, 237, 0.06);
}

.even-row {
  background: rgba(255, 255, 255, 0.02);
}

.split-label {
  color: #a1a1aa;
  font-weight: 500;
}

.split-value {
  color: #e4e4e7;
  font-family: 'Courier New', monospace;
}

/* Reference Section */
.reference-section {
  margin-top: 28px;
  padding: 20px;
  background: rgba(124, 58, 237, 0.06);
  border-radius: 16px;
  border: 1px solid rgba(124, 58, 237, 0.1);
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #d4d4d8;
}

.reference-table {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.12);
}

.ref-header {
  display: grid;
  grid-template-columns: 100px 1fr 1fr 1fr;
  padding: 10px 16px;
  background: rgba(124, 58, 237, 0.15);
  font-size: 12px;
  font-weight: 600;
  color: #c084fc;
}

.ref-row {
  display: grid;
  grid-template-columns: 100px 1fr 1fr 1fr;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 13px;
  color: #d4d4d8;
}

.ref-row.even-row {
  background: rgba(255, 255, 255, 0.02);
}

.ref-level {
  font-weight: 600;
  color: #a855f7;
}

.ref-note {
  margin: 12px 0 0;
  font-size: 12px;
  color: #71717a;
}

/* Responsive */
@media (max-width: 640px) {
  .pace-calculator {
    padding: 12px;
  }

  .tool-title {
    font-size: 18px;
  }

  .result-values {
    grid-template-columns: 1fr;
  }

  .time-inputs,
  .pace-inputs {
    gap: 6px;
  }

  .time-field {
    width: 58px;
  }

  .ref-header,
  .ref-row {
    grid-template-columns: 80px 1fr 1fr 1fr;
    font-size: 11px;
    padding: 6px 10px;
  }

  .mode-selector {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
