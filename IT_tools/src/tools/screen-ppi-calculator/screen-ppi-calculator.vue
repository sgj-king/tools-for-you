<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NInputNumber, NGrid, NGi, NSwitch, NIcon, NSelect } from 'naive-ui';
import { Copy, Refresh } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '屏幕 PPI 计算器',
    subtitle: '计算屏幕像素密度(PPI)、物理尺寸和缩放比，选购显示器/笔记本/手机必备',
    resolution: '分辨率',
    width: '宽度 (px)',
    height: '高度 (px)',
    diagonal: '对角线尺寸',
    diagonalInch: '英寸',
    diagonalCm: '厘米',
    unit: '单位',
    result: '计算结果',
    ppi: 'PPI',
    ppiDesc: '每英寸像素数',
    physicalWidth: '物理宽度',
    physicalHeight: '物理高度',
    pixelSize: '像素尺寸',
    totalPixels: '总像素数',
    aspectRatio: '宽高比',
    retinaStatus: 'Retina 等级',
    retinaLow: '普通屏',
    retinaMedium: '高清屏',
    retinaHigh: 'Retina 屏',
    retinaUltra: '超视网膜屏',
    retinaLowDesc: '像素可见，文字有锯齿感',
    retinaMediumDesc: '像素较密，日常使用足够',
    retinaHighDesc: '像素不可见，文字锐利清晰',
    retinaUltraDesc: '极致细腻，专业级显示',
    scalingFactor: '缩放倍率建议',
    scalingDesc: '系统推荐的UI缩放倍率',
    compareTitle: '常见设备对比',
    compareNote: '你的屏幕与常见设备的PPI对比',
    whatIsPPI: '什么是 PPI？',
    ppiExplain: 'PPI（Pixels Per Inch）表示每英寸长度内的像素数量，是衡量屏幕清晰度的核心指标。PPI越高，屏幕显示越细腻，像素越不可见。一般认为超过 300 PPI 时，人眼在正常距离下已无法分辨单个像素（即"视网膜屏"）。',
    formula: '计算公式',
    formulaContent: 'PPI = √(宽² + 高²) / 对角线尺寸(英寸)',
    usage: '使用说明',
    step1: '输入屏幕分辨率（宽度和高度的像素数）',
    step2: '输入屏幕对角线尺寸',
    step3: '查看PPI、物理尺寸和Retina等级',
    notice: '注意',
    noticeContent: 'PPI仅反映像素密度，实际显示效果还受面板类型、色彩准确度、观视距离等影响。手机/平板的正常观看距离比显示器近，因此手机需要更高PPI才能达到相同的视觉清晰度。',
    copied: '已复制！',
    reset: '重置',
    inputWidth: '宽度像素',
    inputHeight: '高度像素',
    inputDiagonal: '对角线尺寸',
    mm: '毫米',
    um: '微米',
    mp: '百万像素',
    vs: 'vs',
    yourScreen: '你的屏幕',
    quickPresets: '快捷预设',
    presetCategory: '设备类型',
    phone: '手机',
    tablet: '平板',
    laptop: '笔记本',
    monitor: '显示器',
    tv: '电视',
  },
  en: {
    title: 'Screen PPI Calculator',
    subtitle: 'Calculate screen pixel density (PPI), physical dimensions & scaling — essential for choosing displays',
    resolution: 'Resolution',
    width: 'Width (px)',
    height: 'Height (px)',
    diagonal: 'Diagonal Size',
    diagonalInch: 'inches',
    diagonalCm: 'cm',
    unit: 'Unit',
    result: 'Results',
    ppi: 'PPI',
    ppiDesc: 'Pixels Per Inch',
    physicalWidth: 'Physical Width',
    physicalHeight: 'Physical Height',
    pixelSize: 'Pixel Size',
    totalPixels: 'Total Pixels',
    aspectRatio: 'Aspect Ratio',
    retinaStatus: 'Retina Level',
    retinaLow: 'Standard',
    retinaMedium: 'HD',
    retinaHigh: 'Retina',
    retinaUltra: 'Super Retina',
    retinaLowDesc: 'Pixels visible, text may appear jagged',
    retinaMediumDesc: 'Dense pixels, fine for daily use',
    retinaHighDesc: 'Pixels invisible, sharp & crisp text',
    retinaUltraDesc: 'Ultra fine, professional-grade display',
    scalingFactor: 'Scaling Factor',
    scalingDesc: 'Recommended UI scaling multiplier',
    compareTitle: 'Device Comparison',
    compareNote: 'Your screen vs. popular devices',
    whatIsPPI: 'What is PPI?',
    ppiExplain: 'PPI (Pixels Per Inch) measures how many pixels fit in one inch of screen. Higher PPI means sharper display with invisible pixels. Generally, 300+ PPI makes individual pixels indistinguishable to the human eye at normal viewing distance (a "Retina" display).',
    formula: 'Formula',
    formulaContent: 'PPI = √(width² + height²) / diagonal (inches)',
    usage: 'How to Use',
    step1: 'Enter screen resolution (width & height in pixels)',
    step2: 'Enter diagonal screen size',
    step3: 'View PPI, physical dimensions & Retina level',
    notice: 'Notice',
    noticeContent: 'PPI only reflects pixel density. Actual display quality also depends on panel type, color accuracy, and viewing distance. Phones/tablets are viewed closer than monitors, so they need higher PPI for equivalent perceived sharpness.',
    copied: 'Copied!',
    reset: 'Reset',
    inputWidth: 'Width pixels',
    inputHeight: 'Height pixels',
    inputDiagonal: 'Diagonal size',
    mm: 'mm',
    um: 'μm',
    mp: 'MP',
    vs: 'vs',
    yourScreen: 'Your Screen',
    quickPresets: 'Quick Presets',
    presetCategory: 'Device Type',
    phone: 'Phone',
    tablet: 'Tablet',
    laptop: 'Laptop',
    monitor: 'Monitor',
    tv: 'TV',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Input state
const resWidth = ref<number | null>(null);
const resHeight = ref<number | null>(null);
const diagonalSize = ref<number | null>(null);
const diagonalUnit = ref<'inch' | 'cm'>('inch');

// Preset devices
const devicePresets = computed(() => [
  { name: 'iPhone 16 Pro', w: 1206, h: 2622, d: 6.3, category: 'phone', ppi: 460 },
  { name: 'iPhone 16', w: 1179, h: 2556, d: 6.1, category: 'phone', ppi: 460 },
  { name: 'Samsung S24', w: 1080, h: 2340, d: 6.2, category: 'phone', ppi: 425 },
  { name: 'Pixel 9 Pro', w: 1280, h: 2856, d: 6.3, category: 'phone', ppi: 495 },
  { name: 'iPad Pro 13"', w: 2048, h: 2732, d: 13, category: 'tablet', ppi: 264 },
  { name: 'iPad Air M2', w: 1640, h: 2360, d: 11, category: 'tablet', ppi: 264 },
  { name: 'MacBook Pro 16"', w: 3456, h: 2234, d: 16.2, category: 'laptop', ppi: 254 },
  { name: 'MacBook Air 15"', w: 2880, h: 1864, d: 15.3, category: 'laptop', ppi: 224 },
  { name: 'MacBook Air 13"', w: 2560, h: 1664, d: 13.6, category: 'laptop', ppi: 227 },
  { name: 'Dell U2723QE', w: 3840, h: 2160, d: 27, category: 'monitor', ppi: 163 },
  { name: 'LG 27GP950', w: 3840, h: 2160, d: 27, category: 'monitor', ppi: 163 },
  { name: 'Samsung G9 49"', w: 5120, h: 1440, d: 49, category: 'monitor', ppi: 109 },
  { name: 'Dell S2421HN', w: 1920, h: 1080, d: 24, category: 'monitor', ppi: 92 },
  { name: 'LG C3 65"', w: 3840, h: 2160, d: 65, category: 'tv', ppi: 68 },
]);

// Selected preset filter
const presetFilter = ref<string>('all');

const filteredPresets = computed(() => {
  if (presetFilter.value === 'all') return devicePresets.value;
  return devicePresets.value.filter(d => d.category === presetFilter.value);
});

// GCD for aspect ratio
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Get retina level
function getRetinaLevel(ppi: number) {
  if (ppi < 120) return { key: 'retinaLow' as const, color: '#94a3b8', icon: '📱', gradient: 'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(100,116,139,0.08))', border: 'rgba(148,163,184,0.3)' };
  if (ppi < 200) return { key: 'retinaMedium' as const, color: '#22c55e', icon: '🖥️', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))', border: 'rgba(34,197,94,0.3)' };
  if (ppi < 350) return { key: 'retinaHigh' as const, color: '#3b82f6', icon: '✨', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))', border: 'rgba(59,130,246,0.3)' };
  return { key: 'retinaUltra' as const, color: '#a855f7', icon: '💎', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.08))', border: 'rgba(168,85,247,0.3)' };
}

// Main calculation
const result = computed(() => {
  if (!resWidth.value || !resHeight.value || !diagonalSize.value) return null;

  const w = resWidth.value;
  const h = resHeight.value;
  const diagInch = diagonalUnit.value === 'cm' ? diagonalSize.value / 2.54 : diagonalSize.value;

  const ppi = Math.sqrt(w * w + h * h) / diagInch;
  const physicalWidthInch = w / ppi;
  const physicalHeightInch = h / ppi;
  const physicalWidthMm = physicalWidthInch * 25.4;
  const physicalHeightMm = physicalHeightInch * 25.4;
  const pixelSizeMm = 25.4 / ppi;
  const pixelSizeUm = pixelSizeMm * 1000;
  const totalPixels = w * h;
  const totalMP = totalPixels / 1_000_000;

  const g = gcd(w, h);
  const arW = w / g;
  const arH = h / g;

  const retinaLevel = getRetinaLevel(ppi);

  // Suggested scaling factor
  let scalingFactor: number;
  if (ppi < 100) scalingFactor = 1;
  else if (ppi < 150) scalingFactor = 1.25;
  else if (ppi < 200) scalingFactor = 1.5;
  else if (ppi < 280) scalingFactor = 2;
  else if (ppi < 400) scalingFactor = 3;
  else scalingFactor = 3;

  return {
    ppi: Math.round(ppi * 10) / 10,
    ppiRounded: Math.round(ppi),
    physicalWidthMm: Math.round(physicalWidthMm * 10) / 10,
    physicalHeightMm: Math.round(physicalHeightMm * 10) / 10,
    pixelSizeMm: Math.round(pixelSizeMm * 1000) / 1000,
    pixelSizeUm: Math.round(pixelSizeUm * 10) / 10,
    totalMP: Math.round(totalMP * 10) / 10,
    totalPixels,
    arW,
    arH,
    retinaLevel,
    scalingFactor,
    diagInch: Math.round(diagInch * 100) / 100,
  };
});

// Apply preset
function applyPreset(preset: { w: number; h: number; d: number }) {
  resWidth.value = preset.w;
  resHeight.value = preset.h;
  diagonalSize.value = preset.d;
  diagonalUnit.value = 'inch';
}

// Reset
function resetForm() {
  resWidth.value = null;
  resHeight.value = null;
  diagonalSize.value = null;
  diagonalUnit.value = 'inch';
  presetFilter.value = 'all';
}

// Copy
const justCopied = ref(false);
function copyResult() {
  if (!result.value) return;
  const r = result.value;
  const text = lang.value === 'zh'
    ? `PPI: ${r.ppi} | 分辨率: ${resWidth.value}×${resHeight.value} | 对角线: ${r.diagInch}" | 物理尺寸: ${r.physicalWidthMm}×${r.physicalHeightMm}mm | 像素尺寸: ${r.pixelSizeMm}mm | 宽高比: ${r.arW}:${r.arH}`
    : `PPI: ${r.ppi} | Resolution: ${resWidth.value}×${resHeight.value} | Diagonal: ${r.diagInch}" | Physical: ${r.physicalWidthMm}×${r.physicalHeightMm}mm | Pixel: ${r.pixelSizeMm}mm | Aspect: ${r.arW}:${r.arH}`;
  navigator.clipboard.writeText(text);
  justCopied.value = true;
  setTimeout(() => { justCopied.value = false; }, 1500);
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

      <n-grid :cols="24" :x-gap="16" responsive="screen" item-responsive>
        <!-- Left: Input -->
        <n-gi span="24 m:10">
          <c-card mb-4>
            <div text-lg font-bold mb-4>🖥️ {{ t('title').value }}</div>

            <!-- Resolution -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('resolution').value }}</div>
              <n-grid :cols="2" :x-gap="10">
                <n-gi>
                  <n-input-number
                    v-model:value="resWidth"
                    :min="1"
                    :max="15360"
                    :step="1"
                    size="large"
                    :placeholder="t('inputWidth').value"
                    style="width: 100%"
                  >
                    <template #suffix>px</template>
                  </n-input-number>
                </n-gi>
                <n-gi>
                  <n-input-number
                    v-model:value="resHeight"
                    :min="1"
                    :max="8640"
                    :step="1"
                    size="large"
                    :placeholder="t('inputHeight').value"
                    style="width: 100%"
                  >
                    <template #suffix>px</template>
                  </n-input-number>
                </n-gi>
              </n-grid>
            </div>

            <!-- Diagonal Size -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('diagonal').value }}</div>
              <n-grid :cols="16" :x-gap="10">
                <n-gi span="10">
                  <n-input-number
                    v-model:value="diagonalSize"
                    :min="0.1"
                    :max="200"
                    :step="0.1"
                    size="large"
                    :placeholder="t('inputDiagonal').value"
                    style="width: 100%"
                  />
                </n-gi>
                <n-gi span="6">
                  <n-button-group style="width: 100%; height: 100%">
                    <n-button
                      :type="diagonalUnit === 'inch' ? 'primary' : 'default'"
                      style="flex: 1"
                      size="large"
                      @click="diagonalUnit = 'inch'"
                    >
                      "
                    </n-button>
                    <n-button
                      :type="diagonalUnit === 'cm' ? 'primary' : 'default'"
                      style="flex: 1"
                      size="large"
                      @click="diagonalUnit = 'cm'"
                    >
                      cm
                    </n-button>
                  </n-button-group>
                </n-gi>
              </n-grid>
            </div>

            <!-- Quick Presets -->
            <div mb-2>
              <div mb-2 text-sm op-70>⚡ {{ t('quickPresets').value }}</div>
              <!-- Filter -->
              <div flex gap-2 mb-2 flex-wrap>
                <n-button
                  v-for="cat in ['all', 'phone', 'tablet', 'laptop', 'monitor', 'tv']"
                  :key="cat"
                  :type="presetFilter === cat ? 'primary' : 'default'"
                  size="tiny"
                  round
                  @click="presetFilter = cat"
                >
                  {{ t((cat === 'all' ? 'presetCategory' : cat) as any).value || cat }}
                </n-button>
              </div>
              <!-- Preset list -->
              <div flex flex-col gap-1.5 max-h-64 overflow-y-auto>
                <div
                  v-for="device in filteredPresets"
                  :key="device.name"
                  flex justify-between items-center p-2 px-3 rounded-lg cursor-pointer transition-all
                  style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);"
                  hover="border-blue-500/30 bg-blue-500/5"
                  @click="applyPreset(device)"
                >
                  <span text-xs op-80>{{ device.name }}</span>
                  <span text-xs op-40 font-mono>{{ device.w }}×{{ device.h }} {{ device.d }}"</span>
                </div>
              </div>
            </div>

            <!-- Reset -->
            <div flex justify-center mt-4>
              <n-button quaternary round @click="resetForm">
                <template #icon><n-icon><Refresh /></n-icon></template>
                {{ t('reset').value }}
              </n-button>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Results -->
        <n-gi span="24 m:14">
          <!-- Result Card -->
          <c-card v-if="result" mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('result').value }}</div>

            <!-- PPI Big Number -->
            <div text-center mb-6>
              <div text-6xl font-bold :style="{ color: result.retinaLevel.color }">
                {{ result.ppiRounded }}
              </div>
              <div mt-1 text-lg :style="{ color: result.retinaLevel.color }">
                {{ result.retinaLevel.icon }} {{ t('ppi').value }}
              </div>
              <div text-xs op-40 mt-1>{{ t('ppiDesc').value }}</div>
            </div>

            <!-- Retina Level Card -->
            <div p-4 rounded-xl mb-4 :style="{ background: result.retinaLevel.gradient, border: `1px solid ${result.retinaLevel.border}` }">
              <div flex justify-between items-center>
                <div>
                  <div text-sm font-bold :style="{ color: result.retinaLevel.color }">
                    {{ result.retinaLevel.icon }} {{ t(result.retinaLevel.key).value }}
                  </div>
                  <div text-xs op-60 mt-1>{{ t((result.retinaLevel.key + 'Desc') as any).value }}</div>
                </div>
                <div text-right>
                  <div text-xs op-50>{{ t('scalingFactor').value }}</div>
                  <div text-xl font-bold>{{ result.scalingFactor }}×</div>
                </div>
              </div>
            </div>

            <!-- Detail Grid -->
            <n-grid :cols="2" :x-gap="12" :y-gap="12" mb-4>
              <n-gi>
                <div p-3 rounded-xl text-center style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);">
                  <div text-xs text-blue-400 mb-1>{{ t('physicalWidth').value }}</div>
                  <div text-xl font-bold>{{ result.physicalWidthMm }}</div>
                  <div text-xs op-40>{{ t('mm').value }}</div>
                </div>
              </n-gi>
              <n-gi>
                <div p-3 rounded-xl text-center style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.15);">
                  <div text-xs text-purple-400 mb-1>{{ t('physicalHeight').value }}</div>
                  <div text-xl font-bold>{{ result.physicalHeightMm }}</div>
                  <div text-xs op-40>{{ t('mm').value }}</div>
                </div>
              </n-gi>
              <n-gi>
                <div p-3 rounded-xl text-center style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);">
                  <div text-xs text-green-400 mb-1>{{ t('pixelSize').value }}</div>
                  <div text-xl font-bold>{{ result.pixelSizeMm }}</div>
                  <div text-xs op-40>{{ t('mm').value }} ({{ result.pixelSizeUm }} {{ t('um').value }})</div>
                </div>
              </n-gi>
              <n-gi>
                <div p-3 rounded-xl text-center style="background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.15);">
                  <div text-xs text-orange-400 mb-1>{{ t('totalPixels').value }}</div>
                  <div text-xl font-bold>{{ result.totalMP }}</div>
                  <div text-xs op-40>{{ t('mp').value }}</div>
                </div>
              </n-gi>
            </n-grid>

            <!-- Aspect Ratio -->
            <div p-3 rounded-xl mb-4 text-center style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
              <div text-xs op-50 mb-1>{{ t('aspectRatio').value }}</div>
              <div text-2xl font-bold font-mono>{{ result.arW }} : {{ result.arH }}</div>
            </div>

            <!-- Device Comparison Bar -->
            <div mb-4>
              <div text-sm font-bold mb-3>📊 {{ t('compareTitle').value }}</div>
              <div text-xs op-50 mb-2>{{ t('compareNote').value }}</div>

              <!-- PPI Scale Visualization -->
              <div relative h-6 rounded-full overflow-hidden mb-2 style="background: rgba(255,255,255,0.05);">
                <div absolute inset-0 rounded-full style="background: linear-gradient(to right, #94a3b8 0%, #94a3b8 18%, #22c55e 18%, #22c55e 30%, #3b82f6 30%, #3b82f6 54%, #a855f7 54%, #a855f7 100%);" />
                <!-- User indicator -->
                <div
                  absolute top="-2px" h-7 w-2 bg-white rounded-full shadow-lg
                  :style="{
                    left: `calc(${Math.min(98, Math.max(2, (result.ppi / 5) * 1))}% - 4px)`,
                    transition: 'left 0.3s ease',
                    boxShadow: '0 0 12px rgba(255,255,255,0.6)',
                  }"
                />
              </div>
              <div flex justify-between text-xs op-40>
                <span>0</span>
                <span>120</span>
                <span>200</span>
                <span>350</span>
                <span>500+</span>
              </div>

              <!-- Comparison items -->
              <div flex flex-col gap-1.5 mt-3>
                <!-- Your screen -->
                <div
                  flex justify-between items-center p-2 px-3 rounded-lg
                  style="background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06)); border: 1px solid rgba(59,130,246,0.25);"
                >
                  <span text-xs font-bold text-blue-400>📍 {{ t('yourScreen').value }}</span>
                  <span text-sm font-bold>{{ result.ppi }} PPI</span>
                </div>
                <div
                  v-for="device in devicePresets.filter(d => Math.abs(d.ppi - result.ppi) > 5).slice(0, 5)"
                  :key="device.name"
                  flex justify-between items-center p-2 px-3 rounded-lg
                  style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);"
                >
                  <span text-xs op-70>{{ device.name }}</span>
                  <div flex items-center gap-2>
                    <span text-xs :style="{ color: device.ppi > result.ppi ? '#22c55e' : '#f97316', fontWeight: 'bold' }">
                      {{ device.ppi > result.ppi ? '+' : '' }}{{ device.ppi - result.ppi }}
                    </span>
                    <span text-xs font-mono op-50>{{ device.ppi }} PPI</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Copy -->
            <div flex justify-center>
              <n-button size="small" round quaternary @click="copyResult">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ justCopied ? t('copied').value : t('ppi').value }}
              </n-button>
            </div>
          </c-card>

          <!-- Empty State -->
          <c-card v-else mb-4>
            <div text-center py-8>
              <div text-4xl mb-3>🖥️</div>
              <div text-sm op-50>{{ lang === 'zh' ? '输入分辨率和对角线尺寸开始计算' : 'Enter resolution & diagonal to calculate' }}</div>
            </div>
          </c-card>

          <!-- Info Cards -->
          <n-grid :cols="24" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
            <n-gi span="24 m:12">
              <c-card>
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <div text-sm op-70 mb-2>📐 {{ t('whatIsPPI').value }}</div>
                  <div text-xs leading-relaxed op-60>{{ t('ppiExplain').value }}</div>
                </div>
              </c-card>
            </n-gi>
            <n-gi span="24 m:12">
              <c-card>
                <div p-3 rounded-lg style="background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15);">
                  <div text-sm text-blue-400 mb-2>🧮 {{ t('formula').value }}</div>
                  <div text-sm font-mono op-80>{{ t('formulaContent').value }}</div>
                </div>
              </c-card>
            </n-gi>
          </n-grid>

          <!-- Usage -->
          <c-card mb-4>
            <div text-sm font-bold mb-3>📖 {{ t('usage').value }}</div>
            <div flex flex-col gap-2>
              <div v-for="(step, i) in [t('step1'), t('step2'), t('step3')]" :key="i" flex items-center gap-2 text-xs op-70>
                <span inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold style="background: rgba(59,130,246,0.15); color: #60a5fa;">{{ i + 1 }}</span>
                {{ step.value }}
              </div>
            </div>
          </c-card>

          <!-- Notice -->
          <c-card>
            <div p-3 rounded-lg style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
              <div text-sm text-amber-400 mb-1>⚠️ {{ t('notice').value }}</div>
              <div text-xs op-70>{{ t('noticeContent').value }}</div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
</style>
