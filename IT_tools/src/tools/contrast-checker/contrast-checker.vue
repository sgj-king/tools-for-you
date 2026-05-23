<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import {
  NButton,
  NColorPicker,
  NInput,
  NSlider,
  NIcon,
  NTabPane,
  NTabs,
  NSwitch,
  NTooltip,
} from 'naive-ui';
import { Copy, Refresh, ArrowsHorizontal, Sun, Moon, Check, AlertCircle, InfoCircle } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '颜色对比度检查器',
    subtitle: '检查颜色组合是否符合WCAG无障碍标准，让设计对每个人都友好',
    foreground: '前景色（文字）',
    background: '背景色',
    contrastRatio: '对比度',
    ratio: '比率',
    wcagAA: 'WCAG AA 标准',
    wcagAAA: 'WCAG AAA 标准',
    normalText: '普通文字',
    largeText: '大号文字',
    pass: '通过',
    fail: '不通过',
    swap: '交换颜色',
    copyRatio: '复制对比度',
    copied: '已复制！',
    presetPairs: '常用配色',
    customInput: '自定义输入',
    hexInput: 'HEX 输入',
    preview: '实时预览',
    lightPreview: '浅色预览',
    darkPreview: '深色预览',
    howItWorks: '工作原理',
    howItWorksDesc: 'WCAG对比度比率衡量前景色和背景色之间的亮度差异。比率范围从1:1（无对比）到21:1（最大对比，黑底白字）。',
    aaNormalReq: 'AA级普通文字要求对比度 ≥ 4.5:1',
    aaLargeReq: 'AA级大号文字要求对比度 ≥ 3:1',
    aaaNormalReq: 'AAA级普通文字要求对比度 ≥ 7:1',
    aaaLargeReq: 'AAA级大号文字要求对比度 ≥ 4.5:1',
    largeTextNote: '大号文字指 ≥18pt 或 ≥14pt 加粗的文字',
    suggestions: '改进建议',
    suggestionDarken: '尝试加深前景色以提高对比度',
    suggestionLighten: '尝试提亮前景色以提高对比度',
    suggestionChangeBg: '更换背景色可能获得更好的对比度',
    meetsAll: '✨ 完美！当前配色满足所有WCAG标准',
    history: '检查历史',
    clearHistory: '清除',
    noHistory: '暂无历史记录',
    accessibilityLevel: '无障碍等级',
    levelExcellent: '优秀',
    levelGood: '良好',
    levelFair: '一般',
    levelPoor: '较差',
  },
  en: {
    title: 'Color Contrast Checker',
    subtitle: 'Check if your color combinations meet WCAG accessibility standards for inclusive design',
    foreground: 'Foreground (Text)',
    background: 'Background',
    contrastRatio: 'Contrast Ratio',
    ratio: 'Ratio',
    wcagAA: 'WCAG AA Standard',
    wcagAAA: 'WCAG AAA Standard',
    normalText: 'Normal Text',
    largeText: 'Large Text',
    pass: 'Pass',
    fail: 'Fail',
    swap: 'Swap Colors',
    copyRatio: 'Copy Ratio',
    copied: 'Copied!',
    presetPairs: 'Preset Pairs',
    customInput: 'Custom Input',
    hexInput: 'HEX Input',
    preview: 'Live Preview',
    lightPreview: 'Light Preview',
    darkPreview: 'Dark Preview',
    howItWorks: 'How It Works',
    howItWorksDesc: 'WCAG contrast ratio measures the luminance difference between foreground and background colors. Ratio ranges from 1:1 (no contrast) to 21:1 (max contrast, black on white).',
    aaNormalReq: 'AA normal text requires ratio ≥ 4.5:1',
    aaLargeReq: 'AA large text requires ratio ≥ 3:1',
    aaaNormalReq: 'AAA normal text requires ratio ≥ 7:1',
    aaaLargeReq: 'AAA large text requires ratio ≥ 4.5:1',
    largeTextNote: 'Large text means ≥18pt or ≥14pt bold',
    suggestions: 'Suggestions',
    suggestionDarken: 'Try darkening the foreground color to improve contrast',
    suggestionLighten: 'Try lightening the foreground color to improve contrast',
    suggestionChangeBg: 'Changing the background color may yield better contrast',
    meetsAll: '✨ Perfect! Current colors meet all WCAG standards',
    history: 'History',
    clearHistory: 'Clear',
    noHistory: 'No history yet',
    accessibilityLevel: 'Accessibility Level',
    levelExcellent: 'Excellent',
    levelGood: 'Good',
    levelFair: 'Fair',
    levelPoor: 'Poor',
  },
};

const lang = useStorage<'zh' | 'en'>('contrast-lang', 'zh');
const t = (key: keyof typeof labels.zh) => labels[lang.value][key];

// ===================== State =====================
const fgColor = useStorage('contrast-fg', '#1a1a2e');
const bgColor = useStorage('contrast-bg', '#ffffff');
const copied = ref(false);

interface HistoryItem {
  fg: string;
  bg: string;
  ratio: number;
  time: number;
}
const history = useStorage<HistoryItem[]>('contrast-history', []);

// ===================== Contrast Calculation =====================
// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// Relative luminance per WCAG 2.1
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Contrast ratio per WCAG 2.1
function contrastRatio(fg: string, bg: string): number {
  const [fr, fg2, fb] = hexToRgb(fg);
  const [br, bg2, bb] = hexToRgb(bg);
  const l1 = relativeLuminance(fr, fg2, fb);
  const l2 = relativeLuminance(br, bg2, bb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Calculate
const ratio = computed(() => contrastRatio(fgColor.value, bgColor.value));
const ratioDisplay = computed(() => ratio.value.toFixed(2));
const ratioFormatted = computed(() => `${ratioDisplay.value}:1`);

// WCAG checks
const aaNormal = computed(() => ratio.value >= 4.5);
const aaLarge = computed(() => ratio.value >= 3);
const aaaNormal = computed(() => ratio.value >= 7);
const aaaLarge = computed(() => ratio.value >= 4.5);

// Accessibility level
const accessLevel = computed(() => {
  if (ratio.value >= 7) return { key: 'levelExcellent', color: '#22c55e', percent: 100 };
  if (ratio.value >= 4.5) return { key: 'levelGood', color: '#3b82f6', percent: 75 };
  if (ratio.value >= 3) return { key: 'levelFair', color: '#f59e0b', percent: 45 };
  return { key: 'levelPoor', color: '#ef4444', percent: 20 };
});

// Suggestions
const suggestions = computed(() => {
  const items: string[] = [];
  if (ratio.value < 4.5) {
    const [fr, fg2, fb] = hexToRgb(fgColor.value);
    const [br, bg2, bb] = hexToRgb(bgColor.value);
    const fgLum = relativeLuminance(fr, fg2, fb);
    const bgLum = relativeLuminance(br, bg2, bb);
    if (bgLum > fgLum) {
      items.push(t('suggestionDarken'));
    } else {
      items.push(t('suggestionLighten'));
    }
    items.push(t('suggestionChangeBg'));
  }
  return items;
});

// ===================== Actions =====================
function swapColors() {
  const tmp = fgColor.value;
  fgColor.value = bgColor.value;
  bgColor.value = tmp;
}

async function copyRatio() {
  try {
    await navigator.clipboard.writeText(ratioFormatted.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = ratioFormatted.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

function addToHistory() {
  const item: HistoryItem = {
    fg: fgColor.value,
    bg: bgColor.value,
    ratio: ratio.value,
    time: Date.now(),
  };
  history.value = [item, ...history.value].slice(0, 20);
}

function clearHistory() {
  history.value = [];
}

function loadFromHistory(item: HistoryItem) {
  fgColor.value = item.fg;
  bgColor.value = item.bg;
}

// Auto-add to history on significant change
watch([fgColor, bgColor], () => {
  // Debounce: only add after a pause
}, { deep: true });

let historyTimer: ReturnType<typeof setTimeout> | null = null;
watch([fgColor, bgColor], () => {
  if (historyTimer) clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    // Don't add if last item is the same
    const last = history.value[0];
    if (!last || last.fg !== fgColor.value || last.bg !== bgColor.value) {
      addToHistory();
    }
  }, 1500);
});

// ===================== Preset Color Pairs =====================
interface PresetPair {
  nameZh: string;
  nameEn: string;
  fg: string;
  bg: string;
}

const presetPairs: PresetPair[] = [
  { nameZh: '经典黑白', nameEn: 'Classic B&W', fg: '#000000', bg: '#ffffff' },
  { nameZh: '深蓝白底', nameEn: 'Navy on White', fg: '#1a365d', bg: '#ffffff' },
  { nameZh: '白字深底', nameEn: 'White on Dark', fg: '#ffffff', bg: '#1a1a2e' },
  { nameZh: '绿字深底', nameEn: 'Green on Dark', fg: '#00ff41', bg: '#0d1117' },
  { nameZh: '橙字白底', nameEn: 'Orange on White', fg: '#c05621', bg: '#ffffff' },
  { nameZh: '红字深底', nameEn: 'Red on Dark', fg: '#fc5c65', bg: '#2d3436' },
  { nameZh: '浅灰深底', nameEn: 'Light Gray on Dark', fg: '#b2bec3', bg: '#2d3436' },
  { nameZh: '紫字白底', nameEn: 'Purple on White', fg: '#6c3483', bg: '#ffffff' },
  { nameZh: '低对比灰', nameEn: 'Low Contrast Gray', fg: '#a0a0a0', bg: '#ffffff' },
  { nameZh: '警告黄黑', nameEn: 'Warning Yellow/Black', fg: '#1a1a1a', bg: '#ffd700' },
  { nameZh: '薄荷绿深底', nameEn: 'Mint on Dark', fg: '#00b894', bg: '#0a0a0a' },
  { nameZh: '粉字白底', nameEn: 'Pink on White', fg: '#d63384', bg: '#ffffff' },
];

function applyPreset(pair: PresetPair) {
  fgColor.value = pair.fg;
  bgColor.value = pair.bg;
}

// ===================== Helpers =====================
function hexInputValid(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

const fgHexInput = computed({
  get: () => fgColor.value,
  set: (v: string) => { if (hexInputValid(v)) fgColor.value = v; },
});

const bgHexInput = computed({
  get: () => bgColor.value,
  set: (v: string) => { if (hexInputValid(v)) bgColor.value = v; },
});

// Ratio bar gradient
const ratioBarStyle = computed(() => {
  const pct = Math.min(100, (ratio.value / 21) * 100);
  return {
    width: `${pct}%`,
    background: accessLevel.value.color,
    transition: 'width 0.4s ease, background 0.3s ease',
  };
});
</script>

<template>
  <div class="contrast-checker">
    <!-- Header -->
    <div class="cc-header">
      <div class="cc-header-left">
        <h2 class="cc-title">{{ t('title') }}</h2>
        <p class="cc-subtitle">{{ t('subtitle') }}</p>
      </div>
      <div class="cc-header-right">
        <n-button size="small" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
          {{ lang === 'zh' ? 'EN' : '中文' }}
        </n-button>
      </div>
    </div>

    <div class="cc-layout">
      <!-- Left: Controls -->
      <div class="cc-controls">
        <!-- Foreground Color -->
        <div class="cc-section">
          <div class="cc-section-title">{{ t('foreground') }}</div>
          <div class="cc-color-row">
            <n-color-picker
              v-model:value="fgColor"
              :modes="['hex']"
              :swatches="[]"
              :show-alpha="false"
              size="large"
              class="cc-color-picker"
            />
            <n-input
              v-model:value="fgHexInput"
              size="large"
              placeholder="#000000"
              class="cc-hex-input"
            >
              <template #prefix>
                <span class="cc-hex-prefix">#</span>
              </template>
            </n-input>
          </div>
          <!-- Quick shade buttons for foreground -->
          <div class="cc-shade-row">
            <div
              v-for="shade in ['#ffffff', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#1f2937', '#000000']"
              :key="shade"
              class="cc-shade-swatch"
              :style="{ background: shade }"
              @click="fgColor = shade"
            />
          </div>
        </div>

        <!-- Background Color -->
        <div class="cc-section">
          <div class="cc-section-title">{{ t('background') }}</div>
          <div class="cc-color-row">
            <n-color-picker
              v-model:value="bgColor"
              :modes="['hex']"
              :swatches="[]"
              :show-alpha="false"
              size="large"
              class="cc-color-picker"
            />
            <n-input
              v-model:value="bgHexInput"
              size="large"
              placeholder="#ffffff"
              class="cc-hex-input"
            >
              <template #prefix>
                <span class="cc-hex-prefix">#</span>
              </template>
            </n-input>
          </div>
          <div class="cc-shade-row">
            <div
              v-for="shade in ['#ffffff', '#fef3c7', '#d1fae5', '#dbeafe', '#fce7f3', '#e5e7eb', '#000000']"
              :key="shade"
              class="cc-shade-swatch"
              :style="{ background: shade }"
              @click="bgColor = shade"
            />
          </div>
        </div>

        <!-- Swap Button -->
        <div class="cc-actions-row">
          <n-button size="small" @click="swapColors" class="cc-swap-btn">
            <template #icon><n-icon :component="ArrowsHorizontal" size="18" /></template>
            {{ t('swap') }}
          </n-button>
          <n-button size="small" type="primary" @click="copyRatio">
            <template #icon><n-icon :component="Copy" size="16" /></template>
            {{ copied ? t('copied') : t('copyRatio') }}
          </n-button>
        </div>

        <!-- Preset Pairs -->
        <div class="cc-section">
          <div class="cc-section-title">{{ t('presetPairs') }}</div>
          <div class="cc-presets-grid">
            <div
              v-for="pair in presetPairs"
              :key="pair.fg + pair.bg"
              class="cc-preset-card"
              @click="applyPreset(pair)"
            >
              <div
                class="cc-preset-preview"
                :style="{ backgroundColor: pair.bg, color: pair.fg }"
              >
                Aa
              </div>
              <span class="cc-preset-name">
                {{ lang === 'zh' ? pair.nameZh : pair.nameEn }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Results & Preview -->
      <div class="cc-results">
        <!-- Contrast Ratio Display -->
        <div class="cc-ratio-card">
          <div class="cc-ratio-label">{{ t('contrastRatio') }}</div>
          <div class="cc-ratio-big" :style="{ color: accessLevel.color }">
            {{ ratioDisplay }}
            <span class="cc-ratio-unit">:1</span>
          </div>
          <!-- Ratio bar -->
          <div class="cc-ratio-bar-bg">
            <div class="cc-ratio-bar-fill" :style="ratioBarStyle" />
            <!-- Markers -->
            <div class="cc-ratio-marker" style="left: 14.28%">
              <span class="cc-ratio-marker-label">3</span>
            </div>
            <div class="cc-ratio-marker" style="left: 21.42%">
              <span class="cc-ratio-marker-label">4.5</span>
            </div>
            <div class="cc-ratio-marker" style="left: 33.33%">
              <span class="cc-ratio-marker-label">7</span>
            </div>
            <div class="cc-ratio-marker" style="left: 100%">
              <span class="cc-ratio-marker-label">21</span>
            </div>
          </div>
          <!-- Accessibility Level -->
          <div class="cc-level-badge" :style="{ background: accessLevel.color + '20', borderColor: accessLevel.color + '50', color: accessLevel.color }">
            {{ t(accessLevel.key as keyof typeof labels.zh) }}
          </div>
        </div>

        <!-- WCAG Results -->
        <div class="cc-wcag-card">
          <!-- AA -->
          <div class="cc-wcag-section">
            <div class="cc-wcag-title">{{ t('wcagAA') }}</div>
            <div class="cc-wcag-items">
              <div class="cc-wcag-item" :class="aaNormal ? 'cc-pass' : 'cc-fail'">
                <n-icon :component="aaNormal ? Check : AlertCircle" size="18" />
                <span>{{ t('normalText') }} (≥ 4.5:1)</span>
                <span class="cc-wcag-result">{{ aaNormal ? t('pass') : t('fail') }}</span>
              </div>
              <div class="cc-wcag-item" :class="aaLarge ? 'cc-pass' : 'cc-fail'">
                <n-icon :component="aaLarge ? Check : AlertCircle" size="18" />
                <span>{{ t('largeText') }} (≥ 3:1)</span>
                <span class="cc-wcag-result">{{ aaLarge ? t('pass') : t('fail') }}</span>
              </div>
            </div>
          </div>
          <!-- AAA -->
          <div class="cc-wcag-section">
            <div class="cc-wcag-title">{{ t('wcagAAA') }}</div>
            <div class="cc-wcag-items">
              <div class="cc-wcag-item" :class="aaaNormal ? 'cc-pass' : 'cc-fail'">
                <n-icon :component="aaaNormal ? Check : AlertCircle" size="18" />
                <span>{{ t('normalText') }} (≥ 7:1)</span>
                <span class="cc-wcag-result">{{ aaaNormal ? t('pass') : t('fail') }}</span>
              </div>
              <div class="cc-wcag-item" :class="aaaLarge ? 'cc-pass' : 'cc-fail'">
                <n-icon :component="aaaLarge ? Check : AlertCircle" size="18" />
                <span>{{ t('largeText') }} (≥ 4.5:1)</span>
                <span class="cc-wcag-result">{{ aaaLarge ? t('pass') : t('fail') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="cc-preview-card">
          <div class="cc-section-title">{{ t('preview') }}</div>
          <!-- Normal text preview -->
          <div
            class="cc-preview-normal"
            :style="{ backgroundColor: bgColor, color: fgColor }"
          >
            <div class="cc-preview-heading">{{ lang === 'zh' ? '大号文字示例' : 'Large Text Example' }}</div>
            <div class="cc-preview-body">{{ lang === 'zh' ? '这是一段普通文字示例，用于检查前景色与背景色的对比度是否满足阅读需求。良好的对比度可以让所有用户，包括视力障碍者，都能轻松阅读内容。' : 'This is a sample of normal text to check if the contrast between foreground and background colors meets readability requirements. Good contrast ensures all users, including those with visual impairments, can easily read content.' }}</div>
            <div class="cc-preview-small">{{ lang === 'zh' ? '小号文字 — 更需要高对比度' : 'Small text — needs even higher contrast' }}</div>
            <div class="cc-preview-link">{{ lang === 'zh' ? '这是链接文字示例' : 'This is a link text example' }}</div>
          </div>
        </div>

        <!-- Suggestions -->
        <div v-if="suggestions.length > 0" class="cc-suggest-card">
          <div class="cc-section-title">{{ t('suggestions') }}</div>
          <div class="cc-suggest-list">
            <div v-for="(s, i) in suggestions" :key="i" class="cc-suggest-item">
              <n-icon :component="InfoCircle" size="16" class="cc-suggest-icon" />
              <span>{{ s }}</span>
            </div>
          </div>
        </div>
        <div v-else class="cc-suggest-card cc-suggest-perfect">
          {{ t('meetsAll') }}
        </div>

        <!-- How It Works -->
        <div class="cc-info-card">
          <div class="cc-section-title">{{ t('howItWorks') }}</div>
          <p class="cc-info-desc">{{ t('howItWorksDesc') }}</p>
          <div class="cc-info-grid">
            <div class="cc-info-item">
              <span class="cc-info-dot" style="background: #3b82f6" />
              {{ t('aaNormalReq') }}
            </div>
            <div class="cc-info-item">
              <span class="cc-info-dot" style="background: #3b82f6" />
              {{ t('aaLargeReq') }}
            </div>
            <div class="cc-info-item">
              <span class="cc-info-dot" style="background: #8b5cf6" />
              {{ t('aaaNormalReq') }}
            </div>
            <div class="cc-info-item">
              <span class="cc-info-dot" style="background: #8b5cf6" />
              {{ t('aaaLargeReq') }}
            </div>
          </div>
          <p class="cc-info-note">{{ t('largeTextNote') }}</p>
        </div>

        <!-- History -->
        <div class="cc-history-card">
          <div class="cc-history-header">
            <span class="cc-section-title" style="margin-bottom:0">{{ t('history') }}</span>
            <n-button v-if="history.length > 0" size="tiny" quaternary type="error" @click="clearHistory">
              {{ t('clearHistory') }}
            </n-button>
          </div>
          <div v-if="history.length === 0" class="cc-history-empty">
            {{ t('noHistory') }}
          </div>
          <div v-else class="cc-history-list">
            <div
              v-for="(item, i) in history.slice(0, 8)"
              :key="i"
              class="cc-history-item"
              @click="loadFromHistory(item)"
            >
              <div class="cc-history-swatch" :style="{ background: item.bg }">
                <div class="cc-history-text" :style="{ color: item.fg }">Aa</div>
              </div>
              <div class="cc-history-info">
                <span class="cc-history-ratio" :style="{ color: item.ratio >= 4.5 ? '#22c55e' : item.ratio >= 3 ? '#f59e0b' : '#ef4444' }">
                  {{ item.ratio.toFixed(1) }}:1
                </span>
                <span class="cc-history-colors">{{ item.fg }} / {{ item.bg }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrast-checker {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 8px;
}

/* Header */
.cc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.cc-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--n-text-color);
}
.cc-subtitle {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--n-text-color-3);
}

/* Layout */
.cc-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* Controls */
.cc-controls {
  width: 360px;
  min-width: 300px;
  flex-shrink: 0;
}
.cc-section {
  margin-bottom: 18px;
}
.cc-section-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Color row */
.cc-color-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.cc-color-picker {
  flex-shrink: 0;
}
.cc-hex-input {
  flex: 1;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
}
.cc-hex-prefix {
  font-weight: 600;
  color: var(--n-text-color-3);
}

/* Shade swatches */
.cc-shade-row {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}
.cc-shade-swatch {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid var(--n-border-color);
  transition: all 0.2s ease;
}
.cc-shade-swatch:hover {
  transform: scale(1.15);
  border-color: var(--n-primary-color);
}

/* Actions */
.cc-actions-row {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}
.cc-actions-row .n-button {
  flex: 1;
}
.cc-swap-btn {
  transition: transform 0.3s ease;
}
.cc-swap-btn:hover {
  transform: rotate(180deg);
}

/* Presets grid */
.cc-presets-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.cc-preset-card {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.25s ease;
  border: 1px solid var(--n-border-color);
}
.cc-preset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--n-primary-color);
}
.cc-preset-card:active {
  transform: scale(0.97);
}
.cc-preset-preview {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
}
.cc-preset-name {
  display: block;
  text-align: center;
  font-size: 0.65rem;
  padding: 4px 2px;
  color: var(--n-text-color-3);
  background: var(--n-color-embedded);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Results area */
.cc-results {
  flex: 1;
  min-width: 0;
}

/* Ratio card */
.cc-ratio-card {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-bottom: 16px;
}
.cc-ratio-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--n-text-color-2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.cc-ratio-big {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}
.cc-ratio-unit {
  font-size: 1.5rem;
  font-weight: 400;
  opacity: 0.6;
}

/* Ratio bar */
.cc-ratio-bar-bg {
  height: 10px;
  background: var(--n-color-embedded-hover, rgba(255, 255, 255, 0.06));
  border-radius: 5px;
  position: relative;
  margin: 16px 0;
  overflow: visible;
}
.cc-ratio-bar-fill {
  height: 100%;
  border-radius: 5px;
}
.cc-ratio-marker {
  position: absolute;
  top: -2px;
  width: 1px;
  height: 14px;
  background: var(--n-text-color-3);
  opacity: 0.4;
  transform: translateX(-50%);
}
.cc-ratio-marker-label {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  color: var(--n-text-color-3);
  opacity: 0.6;
  white-space: nowrap;
}

/* Level badge */
.cc-level-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid;
  margin-top: 4px;
}

/* WCAG card */
.cc-wcag-card {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.cc-wcag-section {
  margin-bottom: 16px;
}
.cc-wcag-section:last-child {
  margin-bottom: 0;
}
.cc-wcag-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--n-text-color);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--n-border-color);
}
.cc-wcag-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cc-wcag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  transition: background 0.2s ease;
}
.cc-wcag-item.cc-pass {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}
.cc-wcag-item.cc-fail {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.cc-wcag-item span {
  flex: 1;
}
.cc-wcag-result {
  flex: none !important;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Preview card */
.cc-preview-card {
  margin-bottom: 16px;
}
.cc-preview-normal {
  border-radius: 16px;
  padding: 28px 24px;
  border: 1px solid var(--n-border-color);
}
.cc-preview-heading {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.cc-preview-body {
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 12px;
}
.cc-preview-small {
  font-size: 0.75rem;
  line-height: 1.5;
  margin-bottom: 10px;
  opacity: 0.85;
}
.cc-preview-link {
  font-size: 0.9rem;
  text-decoration: underline;
  cursor: pointer;
}

/* Suggestions */
.cc-suggest-card {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.cc-suggest-perfect {
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  color: #22c55e;
  padding: 20px;
}
.cc-suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cc-suggest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--n-text-color-2);
}
.cc-suggest-icon {
  color: #f59e0b;
  flex-shrink: 0;
}

/* Info card */
.cc-info-card {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.cc-info-desc {
  font-size: 0.82rem;
  color: var(--n-text-color-3);
  line-height: 1.6;
  margin: 0 0 12px;
}
.cc-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}
.cc-info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--n-text-color-2);
}
.cc-info-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.cc-info-note {
  font-size: 0.72rem;
  color: var(--n-text-color-3);
  margin: 0;
  font-style: italic;
}

/* History */
.cc-history-card {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 12px;
  padding: 16px;
}
.cc-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.cc-history-empty {
  text-align: center;
  font-size: 0.82rem;
  color: var(--n-text-color-3);
  padding: 16px;
}
.cc-history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.cc-history-item {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--n-border-color);
  transition: all 0.2s ease;
}
.cc-history-item:hover {
  border-color: var(--n-primary-color);
  transform: translateY(-1px);
}
.cc-history-swatch {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cc-history-text {
  font-size: 0.9rem;
  font-weight: 700;
}
.cc-history-info {
  padding: 4px 8px;
  background: var(--n-color-embedded-hover, rgba(255, 255, 255, 0.03));
  display: flex;
  align-items: center;
  gap: 6px;
}
.cc-history-ratio {
  font-size: 0.72rem;
  font-weight: 700;
}
.cc-history-colors {
  font-size: 0.6rem;
  color: var(--n-text-color-3);
  font-family: 'Fira Code', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .cc-layout {
    flex-direction: column;
  }
  .cc-controls {
    width: 100%;
    min-width: 0;
  }
  .cc-presets-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .cc-info-grid {
    grid-template-columns: 1fr;
  }
  .cc-ratio-big {
    font-size: 3rem;
  }
}
</style>
