<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { useStorage } from '@vueuse/core';
import {
  NButton, NSelect, NSlider, NSwitch, NIcon, NTooltip, NInputGroup,
  NColorPicker, NInput, NInputNumber, NTabPane, NTabs, NTag, NScrollbar,
} from 'naive-ui';
import { Copy, Refresh, Trash, Plus, Download, ChevronDown, Sun, Code } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: 'CSS渐变生成器',
    subtitle: '可视化创建精美CSS渐变，实时预览，一键复制代码',
    type: '渐变类型',
    linear: '线性渐变',
    radial: '径向渐变',
    conic: '锥形渐变',
    angle: '角度',
    position: '位置',
    center: '居中',
    topLeft: '左上',
    topRight: '右上',
    bottomLeft: '左下',
    bottomRight: '右下',
    custom: '自定义',
    posX: 'X位置',
    posY: 'Y位置',
    colors: '色标',
    addStop: '添加色标',
    removeStop: '删除',
    code: 'CSS代码',
    copyCode: '复制代码',
    copied: '已复制！',
    presets: '预设渐变',
    random: '随机渐变',
    reset: '重置',
    preview: '预览',
    fullPreview: '全屏预览',
    size: '尺寸',
    width: '宽度',
    height: '高度',
    repeat: '重复渐变',
    repeatOn: '开',
    repeatOff: '关',
    exportPNG: '导出PNG',
    cssOutput: 'CSS输出',
    sizeInfo: '调整预览区域大小',
    sunset: '日落',
    ocean: '海洋',
    forest: '森林',
    aurora: '极光',
    flame: '火焰',
    candy: '糖果',
    midnight: '午夜',
    meadow: '草地',
    peach: '蜜桃',
    lavender: '薰衣草',
    cosmic: '星空',
    mint: '薄荷',
    rain: '彩虹雨',
    desert: '沙漠',
    coral: '珊瑚',
    color: '颜色',
    stopPosition: '位置',
    previewText: '文字预览',
    noTextPreview: '无文字',
    lightText: '浅色文字',
    darkText: '深色文字',
  },
  en: {
    title: 'CSS Gradient Generator',
    subtitle: 'Visually create stunning CSS gradients with live preview and one-click code copy',
    type: 'Gradient Type',
    linear: 'Linear',
    radial: 'Radial',
    conic: 'Conic',
    angle: 'Angle',
    position: 'Position',
    center: 'Center',
    topLeft: 'Top Left',
    topRight: 'Top Right',
    bottomLeft: 'Bottom Left',
    bottomRight: 'Bottom Right',
    custom: 'Custom',
    posX: 'X Position',
    posY: 'Y Position',
    colors: 'Color Stops',
    addStop: 'Add Stop',
    removeStop: 'Remove',
    code: 'CSS Code',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    presets: 'Presets',
    random: 'Random',
    reset: 'Reset',
    preview: 'Preview',
    fullPreview: 'Full Preview',
    size: 'Size',
    width: 'Width',
    height: 'Height',
    repeat: 'Repeating',
    repeatOn: 'On',
    repeatOff: 'Off',
    exportPNG: 'Export PNG',
    cssOutput: 'CSS Output',
    sizeInfo: 'Adjust preview size',
    sunset: 'Sunset',
    ocean: 'Ocean',
    forest: 'Forest',
    aurora: 'Aurora',
    flame: 'Flame',
    candy: 'Candy',
    midnight: 'Midnight',
    meadow: 'Meadow',
    peach: 'Peach',
    lavender: 'Lavender',
    cosmic: 'Cosmic',
    mint: 'Mint',
    rain: 'Rainbow',
    desert: 'Desert',
    coral: 'Coral',
    color: 'Color',
    stopPosition: 'Position',
    previewText: 'Text Preview',
    noTextPreview: 'None',
    lightText: 'Light Text',
    darkText: 'Dark Text',
  },
};

const lang = useStorage<'zh' | 'en'>('gradient-gen-lang', 'zh');
const t = (key: keyof typeof labels.zh) => labels[lang.value][key];

// ===================== State =====================
type GradientType = 'linear' | 'radial' | 'conic';

interface ColorStop {
  color: string;
  position: number;
  id: number;
}

let stopIdCounter = 0;
const nextId = () => ++stopIdCounter;

const gradientType = useStorage<GradientType>('gradient-type', 'linear');
const angle = useStorage('gradient-angle', 135);
const repeating = useStorage('gradient-repeat', false);
const previewWidth = useStorage('gradient-preview-w', 480);
const previewHeight = useStorage('gradient-preview-h', 280);
const textPreview = useStorage<'none' | 'light' | 'dark'>('gradient-text-preview', 'none');

// Position for radial/conic
const positionPreset = useStorage('gradient-pos-preset', 'center');
const customPosX = useStorage('gradient-pos-x', 50);
const customPosY = useStorage('gradient-pos-y', 50);

const colorStops = useStorage<ColorStop[]>('gradient-stops', [
  { color: '#ff6b6b', position: 0, id: nextId() },
  { color: '#feca57', position: 50, id: nextId() },
  { color: '#48dbfb', position: 100, id: nextId() },
]);

const copied = ref(false);
const showFullPreview = ref(false);
const activeTab = useStorage('gradient-tab', 'editor');

// ===================== Position =====================
const positionOptions = computed(() => [
  { label: t('center'), value: 'center' },
  { label: t('topLeft'), value: 'topLeft' },
  { label: t('topRight'), value: 'topRight' },
  { label: t('bottomLeft'), value: 'bottomLeft' },
  { label: t('bottomRight'), value: 'bottomRight' },
  { label: t('custom'), value: 'custom' },
]);

const positionMap: Record<string, string> = {
  center: '50% 50%',
  topLeft: '0% 0%',
  topRight: '100% 0%',
  bottomLeft: '0% 100%',
  bottomRight: '100% 100%',
  custom: `${customPosX.value}% ${customPosY.value}%`,
};

const positionCSS = computed(() => positionMap[positionPreset.value] || '50% 50%');

// ===================== Gradient CSS =====================
const sortedStops = computed(() =>
  [...colorStops.value].sort((a, b) => a.position - b.position),
);

const stopsCSS = computed(() =>
  sortedStops.value.map(s => `${s.color} ${s.position}%`).join(', '),
);

const gradientCSS = computed(() => {
  const prefix = repeating.value ? 'repeating-' : '';
  if (gradientType.value === 'linear') {
    return `${prefix}linear-gradient(${angle.value}deg, ${stopsCSS.value})`;
  }
  if (gradientType.value === 'radial') {
    return `${prefix}radial-gradient(circle at ${positionCSS.value}, ${stopsCSS.value})`;
  }
  return `${prefix}conic-gradient(from ${angle.value}deg at ${positionCSS.value}, ${stopsCSS.value})`;
});

const fullCSS = computed(() => `background: ${gradientCSS.value};`);

// ===================== Presets =====================
interface PresetDef {
  nameKey: keyof typeof labels.zh;
  type: GradientType;
  angle: number;
  stops: { color: string; position: number }[];
  repeating?: boolean;
}

const presetDefs: PresetDef[] = [
  { nameKey: 'sunset', type: 'linear', angle: 135, stops: [{ color: '#f093fb', position: 0 }, { color: '#f5576c', position: 50 }, { color: '#ff9a76', position: 100 }] },
  { nameKey: 'ocean', type: 'linear', angle: 180, stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 50 }, { color: '#00c6fb', position: 100 }] },
  { nameKey: 'forest', type: 'linear', angle: 135, stops: [{ color: '#0ba360', position: 0 }, { color: '#3cba92', position: 50 }, { color: '#30dd8a', position: 100 }] },
  { nameKey: 'aurora', type: 'linear', angle: 45, stops: [{ color: '#00c6ff', position: 0 }, { color: '#0072ff', position: 30 }, { color: '#7b2ff7', position: 60 }, { color: '#ff6fd8', position: 100 }] },
  { nameKey: 'flame', type: 'linear', angle: 0, stops: [{ color: '#f12711', position: 0 }, { color: '#f5af19', position: 100 }] },
  { nameKey: 'candy', type: 'linear', angle: 90, stops: [{ color: '#fc5c7d', position: 0 }, { color: '#6a82fb', position: 50 }, { color: '#fc5c7d', position: 100 }] },
  { nameKey: 'midnight', type: 'linear', angle: 180, stops: [{ color: '#0f0c29', position: 0 }, { color: '#302b63', position: 50 }, { color: '#24243e', position: 100 }] },
  { nameKey: 'meadow', type: 'linear', angle: 135, stops: [{ color: '#a8e063', position: 0 }, { color: '#56ab2f', position: 100 }] },
  { nameKey: 'peach', type: 'radial', angle: 0, stops: [{ color: '#ffecd2', position: 0 }, { color: '#fcb69f', position: 100 }] },
  { nameKey: 'lavender', type: 'linear', angle: 135, stops: [{ color: '#e8c5e5', position: 0 }, { color: '#9876d4', position: 50 }, { color: '#6c3fb5', position: 100 }] },
  { nameKey: 'cosmic', type: 'conic', angle: 0, stops: [{ color: '#0f0c29', position: 0 }, { color: '#302b63', position: 25 }, { color: '#24243e', position: 50 }, { color: '#7b2ff7', position: 75 }, { color: '#0f0c29', position: 100 }] },
  { nameKey: 'mint', type: 'linear', angle: 135, stops: [{ color: '#c6ffdd', position: 0 }, { color: '#fbd786', position: 50 }, { color: '#f7797d', position: 100 }] },
  { nameKey: 'rain', type: 'linear', angle: 90, stops: [{ color: '#ff0844', position: 0 }, { color: '#ffb199', position: 17 }, { color: '#fbd786', position: 33 }, { color: '#c6ffdd', position: 50 }, { color: '#48dbfb', position: 67 }, { color: '#667eea', position: 83 }, { color: '#764ba2', position: 100 }] },
  { nameKey: 'desert', type: 'linear', angle: 180, stops: [{ color: '#c2956b', position: 0 }, { color: '#e8b87e', position: 40 }, { color: '#f7d794', position: 70 }, { color: '#f5e6ca', position: 100 }] },
  { nameKey: 'coral', type: 'radial', angle: 0, stops: [{ color: '#ff9a9e', position: 0 }, { color: '#fecfef', position: 50 }, { color: '#fdfcfb', position: 100 }] },
];

function applyPreset(preset: PresetDef) {
  gradientType.value = preset.type;
  angle.value = preset.angle;
  repeating.value = preset.repeating || false;
  positionPreset.value = 'center';
  colorStops.value = preset.stops.map(s => ({ ...s, id: nextId() }));
}

// ===================== Actions =====================
function addColorStop() {
  const positions = colorStops.value.map(s => s.position).sort((a, b) => a - b);
  let newPos = 50;
  // Find the largest gap
  let maxGap = 0;
  let gapStart = 0;
  for (let i = 0; i < positions.length - 1; i++) {
    const gap = positions[i + 1] - positions[i];
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = positions[i];
    }
  }
  if (positions.length >= 2) {
    newPos = Math.round(gapStart + maxGap / 2);
  }
  // Random color near the middle of the gradient
  const randomHue = Math.floor(Math.random() * 360);
  const hex = hslToHex(randomHue, 70, 60);
  colorStops.value.push({ color: hex, position: newPos, id: nextId() });
}

function removeColorStop(id: number) {
  if (colorStops.value.length <= 2) return;
  colorStops.value = colorStops.value.filter(s => s.id !== id);
  // Normalize positions to 0-100
  const sorted = [...colorStops.value].sort((a, b) => a.position - b.position);
  if (sorted.length > 0) {
    sorted[0].position = 0;
    sorted[sorted.length - 1].position = 100;
  }
  colorStops.value = sorted;
}

function randomGradient() {
  const types: GradientType[] = ['linear', 'radial', 'conic'];
  gradientType.value = types[Math.floor(Math.random() * types.length)];
  angle.value = Math.floor(Math.random() * 360);
  const numStops = 2 + Math.floor(Math.random() * 3);
  const stops: ColorStop[] = [];
  for (let i = 0; i < numStops; i++) {
    stops.push({
      color: hslToHex(Math.floor(Math.random() * 360), 50 + Math.floor(Math.random() * 40), 40 + Math.floor(Math.random() * 30)),
      position: Math.round((i / (numStops - 1)) * 100),
      id: nextId(),
    });
  }
  colorStops.value = stops;
  repeating.value = false;
}

function resetGradient() {
  gradientType.value = 'linear';
  angle.value = 135;
  repeating.value = false;
  positionPreset.value = 'center';
  customPosX.value = 50;
  customPosY.value = 50;
  colorStops.value = [
    { color: '#ff6b6b', position: 0, id: nextId() },
    { color: '#feca57', position: 50, id: nextId() },
    { color: '#48dbfb', position: 100, id: nextId() },
  ];
}

async function copyCSS() {
  try {
    await navigator.clipboard.writeText(fullCSS.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = fullCSS.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

function exportPNG() {
  const canvas = document.createElement('canvas');
  canvas.width = previewWidth.value * 2;
  canvas.height = previewHeight.value * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Create gradient on canvas
  let grad: CanvasGradient;
  const w = canvas.width;
  const h = canvas.height;

  if (gradientType.value === 'linear') {
    const rad = (angle.value * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const len = Math.sqrt(w * w + h * h) / 2;
    const dx = Math.cos(rad) * len;
    const dy = Math.sin(rad) * len;
    grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  } else if (gradientType.value === 'radial') {
    const posStr = positionCSS.value;
    const [px, py] = posStr.replace(/%/g, '').split(' ').map(Number);
    const cx = (px / 100) * w;
    const cy = (py / 100) * h;
    const r = Math.max(w, h);
    grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  } else {
    // conic - approximate with linear for canvas export
    const rad = (angle.value * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const len = Math.sqrt(w * w + h * h) / 2;
    const dx = Math.cos(rad) * len;
    const dy = Math.sin(rad) * len;
    grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  }

  sortedStops.value.forEach(s => {
    grad.addColorStop(s.position / 100, s.color);
  });

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const link = document.createElement('a');
  link.download = 'gradient.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ===================== Helpers =====================
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Angle indicator
const angleStyle = computed(() => ({
  transform: `rotate(${angle.value}deg)`,
}));

// Text preview style
const previewTextStyle = computed(() => {
  if (textPreview.value === 'light') return { color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.4)' };
  if (textPreview.value === 'dark') return { color: '#1a1a2e', textShadow: '0 2px 8px rgba(255,255,255,0.4)' };
  return {};
});
</script>

<template>
  <div class="gradient-generator">
    <!-- Header -->
    <div class="gg-header">
      <div class="gg-header-left">
        <h2 class="gg-title">{{ t('title') }}</h2>
        <p class="gg-subtitle">{{ t('subtitle') }}</p>
      </div>
      <div class="gg-header-right">
        <n-button size="small" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
          {{ lang === 'zh' ? 'EN' : '中文' }}
        </n-button>
      </div>
    </div>

    <div class="gg-layout">
      <!-- Left: Controls -->
      <div class="gg-controls">
        <!-- Gradient Type -->
        <div class="gg-section">
          <div class="gg-section-title">{{ t('type') }}</div>
          <div class="gg-type-tabs">
            <button
              v-for="gt in (['linear', 'radial', 'conic'] as const)"
              :key="gt"
              :class="['gg-type-tab', { active: gradientType === gt }]"
              @click="gradientType = gt"
            >
              {{ t(gt) }}
            </button>
          </div>
        </div>

        <!-- Angle (for linear & conic) -->
        <div v-if="gradientType !== 'radial'" class="gg-section">
          <div class="gg-section-title">{{ t('angle') }}: {{ angle }}°</div>
          <div class="gg-angle-row">
            <div class="gg-angle-dial">
              <div class="gg-angle-arrow" :style="angleStyle">▲</div>
            </div>
            <n-slider v-model:value="angle" :min="0" :max="360" :step="1" class="gg-angle-slider" />
          </div>
        </div>

        <!-- Position (for radial & conic) -->
        <div v-if="gradientType !== 'linear'" class="gg-section">
          <div class="gg-section-title">{{ t('position') }}</div>
          <div class="gg-position-grid">
            <button
              v-for="opt in positionOptions"
              :key="opt.value"
              :class="['gg-pos-btn', { active: positionPreset === opt.value }]"
              @click="positionPreset = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
          <div v-if="positionPreset === 'custom'" class="gg-custom-pos">
            <div class="gg-pos-field">
              <span>{{ t('posX') }}: {{ customPosX }}%</span>
              <n-slider v-model:value="customPosX" :min="0" :max="100" :step="1" />
            </div>
            <div class="gg-pos-field">
              <span>{{ t('posY') }}: {{ customPosY }}%</span>
              <n-slider v-model:value="customPosY" :min="0" :max="100" :step="1" />
            </div>
          </div>
        </div>

        <!-- Repeating -->
        <div class="gg-section gg-row-section">
          <span class="gg-section-title" style="margin-bottom:0">{{ t('repeat') }}</span>
          <n-switch v-model:value="repeating" />
        </div>

        <!-- Color Stops -->
        <div class="gg-section">
          <div class="gg-section-title-row">
            <span class="gg-section-title">{{ t('colors') }}</span>
            <n-button size="tiny" quaternary type="primary" @click="addColorStop">
              <template #icon><n-icon :component="Plus" /></template>
              {{ t('addStop') }}
            </n-button>
          </div>
          <div class="gg-stops-list">
            <div v-for="stop in [...colorStops].sort((a,b) => a.position - b.position)" :key="stop.id" class="gg-stop-item">
              <n-color-picker
                v-model:value="stop.color"
                :modes="['hex']"
                :swatches="[]"
                :show-alpha="false"
                size="small"
                class="gg-stop-color"
              />
              <div class="gg-stop-pos">
                <n-slider v-model:value="stop.position" :min="0" :max="100" :step="1" />
                <span class="gg-stop-pos-val">{{ stop.position }}%</span>
              </div>
              <n-button
                size="tiny"
                quaternary
                type="error"
                :disabled="colorStops.length <= 2"
                @click="removeColorStop(stop.id)"
              >
                <template #icon><n-icon :component="Trash" size="14" /></template>
              </n-button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="gg-actions">
          <n-button size="small" @click="randomGradient">
            <template #icon><n-icon :component="Refresh" size="16" /></template>
            {{ t('random') }}
          </n-button>
          <n-button size="small" @click="resetGradient">
            <template #icon><n-icon :component="Trash" size="16" /></template>
            {{ t('reset') }}
          </n-button>
        </div>

        <!-- Text Preview Toggle -->
        <div class="gg-section">
          <div class="gg-section-title">{{ t('previewText') }}</div>
          <div class="gg-type-tabs">
            <button
              v-for="opt in (['none', 'light', 'dark'] as const)"
              :key="opt"
              :class="['gg-type-tab', { active: textPreview === opt }]"
              @click="textPreview = opt"
            >
              {{ opt === 'none' ? t('noTextPreview') : opt === 'light' ? t('lightText') : t('darkText') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Preview & Code -->
      <div class="gg-preview-area">
        <!-- Preview -->
        <div class="gg-preview-wrapper">
          <div
            class="gg-preview-box"
            :style="{
              background: gradientCSS,
              width: previewWidth + 'px',
              height: previewHeight + 'px',
              maxWidth: '100%',
            }"
          >
            <div v-if="textPreview !== 'none'" class="gg-preview-text" :style="previewTextStyle">
              Aa
            </div>
          </div>
        </div>

        <!-- Preview Size Controls -->
        <div class="gg-size-row">
          <span class="gg-size-label">{{ t('width') }}:</span>
          <n-slider v-model:value="previewWidth" :min="200" :max="800" :step="10" style="flex:1" />
          <span class="gg-size-val">{{ previewWidth }}px</span>
          <span class="gg-size-label" style="margin-left:12px">{{ t('height') }}:</span>
          <n-slider v-model:value="previewHeight" :min="120" :max="600" :step="10" style="flex:1" />
          <span class="gg-size-val">{{ previewHeight }}px</span>
        </div>

        <!-- CSS Code -->
        <div class="gg-code-section">
          <div class="gg-code-header">
            <span class="gg-code-title"><n-icon :component="Code" size="16" /> CSS</span>
            <div class="gg-code-actions">
              <n-button size="tiny" type="primary" @click="copyCSS">
                <template #icon><n-icon :component="Copy" size="14" /></template>
                {{ copied ? t('copied') : t('copyCode') }}
              </n-button>
              <n-button size="tiny" @click="exportPNG">
                <template #icon><n-icon :component="Download" size="14" /></template>
                {{ t('exportPNG') }}
              </n-button>
            </div>
          </div>
          <div class="gg-code-block">
            <code>{{ fullCSS }}</code>
          </div>
        </div>

        <!-- Presets -->
        <div class="gg-section">
          <div class="gg-section-title">{{ t('presets') }}</div>
          <div class="gg-presets-grid">
            <div
              v-for="preset in presetDefs"
              :key="preset.nameKey"
              class="gg-preset-card"
              :style="{
                background: buildPresetCSS(preset),
              }"
              @click="applyPreset(preset)"
            >
              <span class="gg-preset-name">{{ t(preset.nameKey) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function buildPresetCSS(preset: { type: string; angle: number; stops: { color: string; position: number }[]; repeating?: boolean }): string {
  const stopsStr = preset.stops.map(s => `${s.color} ${s.position}%`).join(', ');
  const prefix = preset.repeating ? 'repeating-' : '';
  if (preset.type === 'linear') return `${prefix}linear-gradient(${preset.angle}deg, ${stopsStr})`;
  if (preset.type === 'radial') return `${prefix}radial-gradient(circle at 50% 50%, ${stopsStr})`;
  return `${prefix}conic-gradient(from ${preset.angle}deg at 50% 50%, ${stopsStr})`;
}

export default {
  methods: { buildPresetCSS },
};
</script>

<style scoped>
.gradient-generator {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 8px;
}

.gg-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.gg-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--n-text-color);
}
.gg-subtitle {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--n-text-color-3);
}

.gg-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ===== Controls ===== */
.gg-controls {
  width: 340px;
  min-width: 300px;
  flex-shrink: 0;
}

.gg-section {
  margin-bottom: 18px;
}
.gg-section-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.gg-section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.gg-row-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Type tabs */
.gg-type-tabs {
  display: flex;
  gap: 6px;
  background: var(--n-color-embedded);
  border-radius: 10px;
  padding: 3px;
}
.gg-type-tab {
  flex: 1;
  padding: 7px 0;
  border: none;
  background: transparent;
  color: var(--n-text-color-3);
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.gg-type-tab:hover {
  color: var(--n-text-color-2);
  background: var(--n-color-embedded-hover);
}
.gg-type-tab.active {
  background: var(--n-color-embedded-popover);
  color: var(--n-text-color);
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

/* Angle dial */
.gg-angle-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.gg-angle-dial {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--n-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  background: var(--n-color-embedded);
}
.gg-angle-arrow {
  font-size: 12px;
  color: var(--n-primary-color);
  transition: transform 0.15s ease;
  line-height: 1;
}
.gg-angle-slider {
  flex: 1;
}

/* Position grid */
.gg-position-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.gg-pos-btn {
  padding: 6px 0;
  border: 1px solid var(--n-border-color);
  background: var(--n-color-embedded);
  color: var(--n-text-color-3);
  font-size: 0.78rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.gg-pos-btn:hover {
  border-color: var(--n-primary-color);
  color: var(--n-text-color-2);
}
.gg-pos-btn.active {
  border-color: var(--n-primary-color);
  background: var(--n-primary-color);
  color: #fff;
}
.gg-custom-pos {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gg-pos-field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--n-text-color-3);
}
.gg-pos-field span {
  white-space: nowrap;
  min-width: 70px;
}

/* Color stops */
.gg-stops-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gg-stop-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--n-color-embedded);
  border-radius: 10px;
}
.gg-stop-color {
  width: 36px !important;
  flex-shrink: 0;
}
.gg-stop-pos {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.gg-stop-pos-val {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  min-width: 36px;
  text-align: right;
}

/* Actions */
.gg-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}
.gg-actions .n-button {
  flex: 1;
}

/* ===== Preview Area ===== */
.gg-preview-area {
  flex: 1;
  min-width: 0;
}

.gg-preview-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 14px;
}
.gg-preview-box {
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.06);
  cursor: crosshair;
  transition: box-shadow 0.3s ease;
}
.gg-preview-box:hover {
  box-shadow: 0 8px 36px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.08);
}
.gg-preview-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  font-weight: 800;
  pointer-events: none;
  user-select: none;
}

/* Size row */
.gg-size-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 0 4px;
}
.gg-size-label {
  font-size: 0.78rem;
  color: var(--n-text-color-3);
  white-space: nowrap;
}
.gg-size-val {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  min-width: 48px;
  text-align: right;
}

/* Code section */
.gg-code-section {
  margin-bottom: 18px;
}
.gg-code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.gg-code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--n-text-color-2);
}
.gg-code-actions {
  display: flex;
  gap: 6px;
}
.gg-code-block {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  padding: 14px 16px;
  overflow-x: auto;
  font-family: 'Fira Code', 'JetBrains Mono', 'SF Mono', Menlo, monospace;
  font-size: 0.82rem;
  color: var(--n-primary-color);
  word-break: break-all;
  line-height: 1.6;
}
.gg-code-block code {
  font-family: inherit;
}

/* Presets grid */
.gg-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}
.gg-preset-card {
  height: 64px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}
.gg-preset-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);
}
.gg-preset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
}
.gg-preset-card:active {
  transform: scale(0.97);
}
.gg-preset-name {
  position: relative;
  z-index: 1;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .gg-layout {
    flex-direction: column;
  }
  .gg-controls {
    width: 100%;
    min-width: 0;
  }
  .gg-preview-box {
    width: 100% !important;
  }
}
</style>
