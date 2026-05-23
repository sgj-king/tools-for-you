<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue';
import { useStorage } from '@vueuse/core';
import { NButton, NSlider, NSelect, NIcon, NTooltip, NColorPicker, NInputNumber, NSwitch, NScrollbar, NTabPane, NTabs } from 'naive-ui';
import { Copy, Refresh, Trash, Plus, Download, Code, Sun, Moon, Square } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: 'CSS阴影生成器',
    subtitle: '可视化创建精美CSS盒阴影，多层叠加，实时预览，一键复制',
    layers: '阴影层',
    addLayer: '添加阴影层',
    removeLayer: '删除',
    offsetX: '水平偏移',
    offsetY: '垂直偏移',
    blur: '模糊半径',
    spread: '扩展半径',
    color: '颜色',
    opacity: '透明度',
    inset: '内阴影',
    preview: '预览',
    code: 'CSS代码',
    copyCode: '复制代码',
    copied: '已复制！',
    presets: '预设效果',
    random: '随机生成',
    reset: '重置',
    previewShape: '预览形状',
    shapeSquare: '方形',
    shapeRounded: '圆角',
    shapeCircle: '圆形',
    shapeCard: '卡片',
    previewBackground: '预览背景',
    bgDark: '深色',
    bgLight: '浅色',
    bgGradient: '渐变',
    textColor: '文字颜色',
    lightText: '浅色',
    darkText: '深色',
    layerName: '阴影层',
    inner: '内',
    outer: '外',
    boxModel: '元素属性',
    elementSize: '元素大小',
    borderRadius: '圆角',
    elementColor: '元素颜色',
    exportPNG: '导出PNG',
    output: '代码输出',
    multiLayerTip: '可叠加多个阴影层，营造更丰富的光影效果',
    presetSoft: '柔和阴影',
    presetHard: '硬阴影',
    presetNeon: '霓虹发光',
    presetLayered: '层叠阴影',
    presetInset: '内凹效果',
    presetGlow: '外发光',
    presetFloat: '悬浮效果',
    presetDeep: '深度阴影',
    presetGlass: '毛玻璃',
    presetWarm: '暖光',
    presetCold: '冷光',
    presetRetro: '复古',
    presetCyber: '赛博朋克',
    presetDream: '梦幻',
    presetMinimal: '极简',
    presetBold: '立体感',
    presetFlat: '扁平阴影',
    noLayers: '点击上方按钮添加阴影层',
  },
  en: {
    title: 'CSS Box Shadow Generator',
    subtitle: 'Visually create stunning CSS box shadows with multi-layer support and live preview',
    layers: 'Shadow Layers',
    addLayer: 'Add Shadow Layer',
    removeLayer: 'Remove',
    offsetX: 'Offset X',
    offsetY: 'Offset Y',
    blur: 'Blur Radius',
    spread: 'Spread Radius',
    color: 'Color',
    opacity: 'Opacity',
    inset: 'Inset',
    preview: 'Preview',
    code: 'CSS Code',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    presets: 'Presets',
    random: 'Random',
    reset: 'Reset',
    previewShape: 'Preview Shape',
    shapeSquare: 'Square',
    shapeRounded: 'Rounded',
    shapeCircle: 'Circle',
    shapeCard: 'Card',
    previewBackground: 'Preview Background',
    bgDark: 'Dark',
    bgLight: 'Light',
    bgGradient: 'Gradient',
    textColor: 'Text Color',
    lightText: 'Light',
    darkText: 'Dark',
    layerName: 'Layer',
    inner: 'Inner',
    outer: 'Outer',
    boxModel: 'Element Properties',
    elementSize: 'Size',
    borderRadius: 'Border Radius',
    elementColor: 'Element Color',
    exportPNG: 'Export PNG',
    output: 'Code Output',
    multiLayerTip: 'Stack multiple shadow layers for richer lighting effects',
    presetSoft: 'Soft Shadow',
    presetHard: 'Hard Shadow',
    presetNeon: 'Neon Glow',
    presetLayered: 'Layered',
    presetInset: 'Inset',
    presetGlow: 'Outer Glow',
    presetFloat: 'Floating',
    presetDeep: 'Deep Shadow',
    presetGlass: 'Glassmorphism',
    presetWarm: 'Warm Glow',
    presetCold: 'Cold Light',
    presetRetro: 'Retro',
    presetCyber: 'Cyberpunk',
    presetDream: 'Dreamy',
    presetMinimal: 'Minimal',
    presetBold: 'Bold 3D',
    presetFlat: 'Flat Shadow',
    noLayers: 'Click the button above to add shadow layers',
  },
};

const lang = useStorage('it-tools-language', 'zh');
const t = computed(() => (lang.value === 'en' ? labels.en : labels.zh));

// ===================== Shadow Layer =====================
interface ShadowLayer {
  id: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

let layerIdCounter = 0;
function createLayer(overrides: Partial<ShadowLayer> = {}): ShadowLayer {
  layerIdCounter++;
  return {
    id: `layer-${layerIdCounter}`,
    offsetX: 0,
    offsetY: 4,
    blur: 12,
    spread: 0,
    color: '#000000',
    opacity: 0.15,
    inset: false,
    ...overrides,
  };
}

const shadowLayers = useStorage<ShadowLayer[]>('box-shadow-layers', [createLayer({ offsetX: 0, offsetY: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.15 })]);

// ===================== Preview Options =====================
const previewShape = useStorage<'square' | 'rounded' | 'circle' | 'card'>('box-shadow-shape', 'card');
const previewBg = useStorage<'dark' | 'light' | 'gradient'>('box-shadow-bg', 'dark');
const elementSize = useStorage('box-shadow-element-size', 180);
const elementRadius = useStorage('box-shadow-radius', 16);
const elementColor = useStorage('box-shadow-element-color', '#1e293b');

// ===================== Computed =====================
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function layerToCSS(layer: ShadowLayer): string {
  const colorStr = hexToRgba(layer.color, layer.opacity);
  const insetStr = layer.inset ? 'inset ' : '';
  return `${insetStr}${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${colorStr}`;
}

const boxShadowCSS = computed(() => {
  if (shadowLayers.value.length === 0) return 'none';
  return shadowLayers.value.map(layerToCSS).join(',\n    ');
});

const fullCSSCode = computed(() => {
  const lines = [`box-shadow:\n    ${boxShadowCSS.value};`];
  if (previewShape.value === 'rounded' || previewShape.value === 'card') {
    lines.push(`border-radius: ${elementRadius.value}px;`);
  }
  if (previewShape.value === 'circle') {
    lines.push('border-radius: 50%;');
  }
  return lines.join('\n');
});

const previewElementStyle = computed(() => {
  const style: Record<string, string> = {
    width: `${elementSize.value}px`,
    height: `${elementSize.value}px`,
    backgroundColor: elementColor.value,
    boxShadow: shadowLayers.value.map(layerToCSS).join(', '),
    transition: 'box-shadow 0.3s ease, border-radius 0.3s ease',
  };

  if (previewShape.value === 'rounded') {
    style.borderRadius = `${elementRadius.value}px`;
  } else if (previewShape.value === 'circle') {
    style.borderRadius = '50%';
  } else if (previewShape.value === 'card') {
    style.borderRadius = `${elementRadius.value}px`;
  }

  return style;
});

const previewBgStyle = computed(() => {
  if (previewBg.value === 'dark') return { background: '#0f172a' };
  if (previewBg.value === 'light') return { background: '#f1f5f9' };
  return { background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #042f2e 100%)' };
});

// ===================== Actions =====================
function addLayer() {
  shadowLayers.value.push(createLayer({ offsetX: 0, offsetY: 8, blur: 24, spread: 0, color: '#000000', opacity: 0.1 }));
}

function removeLayer(id: string) {
  shadowLayers.value = shadowLayers.value.filter(l => l.id !== id);
}

function copyCode() {
  navigator.clipboard.writeText(fullCSSCode.value);
  justCopied.value = true;
  setTimeout(() => { justCopied.value = false; }, 1500);
}

const justCopied = ref(false);

function resetAll() {
  shadowLayers.value = [createLayer({ offsetX: 0, offsetY: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.15 })];
  previewShape.value = 'card';
  previewBg.value = 'dark';
  elementSize.value = 180;
  elementRadius.value = 16;
  elementColor.value = '#1e293b';
}

function randomShadow() {
  const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  const rand = (min: number, max: number) => Math.round(Math.random() * (max - min) + min);

  const layerCount = rand(1, 3);
  shadowLayers.value = Array.from({ length: layerCount }, (_, i) =>
    createLayer({
      offsetX: rand(-20, 20),
      offsetY: rand(-10, 30),
      blur: rand(4, 60),
      spread: rand(-5, 10),
      color: i === 0 ? '#000000' : randomHex(),
      opacity: parseFloat((Math.random() * 0.4 + 0.05).toFixed(2)),
      inset: Math.random() > 0.8,
    })
  );
}

// ===================== Presets =====================
interface PresetConfig {
  layers: Partial<ShadowLayer>[];
  shape?: 'square' | 'rounded' | 'circle' | 'card';
  radius?: number;
  elementColor?: string;
}

const presets: { nameZh: string; nameEn: string; key: string; config: PresetConfig }[] = [
  {
    key: 'presetSoft', nameZh: '柔和阴影', nameEn: 'Soft Shadow',
    config: { layers: [{ offsetX: 0, offsetY: 2, blur: 8, spread: 0, color: '#000000', opacity: 0.08 }, { offsetX: 0, offsetY: 4, blur: 16, spread: 0, color: '#000000', opacity: 0.06 }], shape: 'card', radius: 12 },
  },
  {
    key: 'presetHard', nameZh: '硬阴影', nameEn: 'Hard Shadow',
    config: { layers: [{ offsetX: 4, offsetY: 4, blur: 0, spread: 0, color: '#000000', opacity: 0.25 }], shape: 'rounded', radius: 0 },
  },
  {
    key: 'presetNeon', nameZh: '霓虹发光', nameEn: 'Neon Glow',
    config: { layers: [{ offsetX: 0, offsetY: 0, blur: 10, spread: 2, color: '#00ffff', opacity: 0.6 }, { offsetX: 0, offsetY: 0, blur: 30, spread: 5, color: '#00ffff', opacity: 0.3 }], shape: 'card', radius: 16, elementColor: '#0a0a2e' },
  },
  {
    key: 'presetLayered', nameZh: '层叠阴影', nameEn: 'Layered',
    config: { layers: [{ offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: '#000000', opacity: 0.06 }, { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.06 }, { offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: '#000000', opacity: 0.06 }, { offsetX: 0, offsetY: 8, blur: 16, spread: 0, color: '#000000', opacity: 0.06 }], shape: 'card', radius: 12 },
  },
  {
    key: 'presetInset', nameZh: '内凹效果', nameEn: 'Inset',
    config: { layers: [{ offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: '#000000', opacity: 0.3, inset: true }, { offsetX: 0, offsetY: -1, blur: 2, spread: 0, color: '#ffffff', opacity: 0.1, inset: true }], shape: 'card', radius: 12 },
  },
  {
    key: 'presetGlow', nameZh: '外发光', nameEn: 'Outer Glow',
    config: { layers: [{ offsetX: 0, offsetY: 0, blur: 20, spread: 4, color: '#a855f7', opacity: 0.5 }, { offsetX: 0, offsetY: 0, blur: 40, spread: 8, color: '#a855f7', opacity: 0.2 }], shape: 'card', radius: 16 },
  },
  {
    key: 'presetFloat', nameZh: '悬浮效果', nameEn: 'Floating',
    config: { layers: [{ offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: '#000000', opacity: 0.1 }, { offsetX: 0, offsetY: 10, blur: 30, spread: -5, color: '#000000', opacity: 0.15 }], shape: 'card', radius: 16 },
  },
  {
    key: 'presetDeep', nameZh: '深度阴影', nameEn: 'Deep Shadow',
    config: { layers: [{ offsetX: 0, offsetY: 20, blur: 40, spread: -10, color: '#000000', opacity: 0.3 }], shape: 'card', radius: 20 },
  },
  {
    key: 'presetGlass', nameZh: '毛玻璃', nameEn: 'Glassmorphism',
    config: { layers: [{ offsetX: 0, offsetY: 8, blur: 32, spread: 0, color: '#000000', opacity: 0.12 }, { offsetX: 0, offsetY: 2, blur: 6, spread: 0, color: '#ffffff', opacity: 0.05, inset: true }], shape: 'card', radius: 24, elementColor: 'rgba(255,255,255,0.08)' },
  },
  {
    key: 'presetWarm', nameZh: '暖光', nameEn: 'Warm Glow',
    config: { layers: [{ offsetX: 0, offsetY: 0, blur: 30, spread: 5, color: '#f97316', opacity: 0.35 }, { offsetX: 0, offsetY: 4, blur: 10, spread: 0, color: '#000000', opacity: 0.1 }], shape: 'card', radius: 16 },
  },
  {
    key: 'presetCold', nameZh: '冷光', nameEn: 'Cold Light',
    config: { layers: [{ offsetX: 0, offsetY: 0, blur: 30, spread: 5, color: '#3b82f6', opacity: 0.35 }, { offsetX: 0, offsetY: 4, blur: 10, spread: 0, color: '#000000', opacity: 0.1 }], shape: 'card', radius: 16 },
  },
  {
    key: 'presetCyber', nameZh: '赛博朋克', nameEn: 'Cyberpunk',
    config: { layers: [{ offsetX: -3, offsetY: -3, blur: 8, spread: 0, color: '#ff00ff', opacity: 0.5 }, { offsetX: 3, offsetY: 3, blur: 8, spread: 0, color: '#00ffff', opacity: 0.5 }], shape: 'card', radius: 4, elementColor: '#0a0a0a' },
  },
  {
    key: 'presetDream', nameZh: '梦幻', nameEn: 'Dreamy',
    config: { layers: [{ offsetX: 0, offsetY: 0, blur: 40, spread: 10, color: '#ec4899', opacity: 0.25 }, { offsetX: 0, offsetY: 0, blur: 20, spread: 4, color: '#8b5cf6', opacity: 0.2 }], shape: 'card', radius: 24 },
  },
  {
    key: 'presetMinimal', nameZh: '极简', nameEn: 'Minimal',
    config: { layers: [{ offsetX: 0, offsetY: 1, blur: 3, spread: 0, color: '#000000', opacity: 0.1 }], shape: 'card', radius: 8 },
  },
  {
    key: 'presetBold', nameZh: '立体感', nameEn: 'Bold 3D',
    config: { layers: [{ offsetX: 6, offsetY: 6, blur: 0, spread: 0, color: '#1e293b', opacity: 0.8 }], shape: 'card', radius: 4 },
  },
  {
    key: 'presetFlat', nameZh: '扁平阴影', nameEn: 'Flat Shadow',
    config: { layers: [{ offsetX: 8, offsetY: 8, blur: 0, spread: 0, color: '#6366f1', opacity: 0.4 }], shape: 'card', radius: 8 },
  },
  {
    key: 'presetRetro', nameZh: '复古', nameEn: 'Retro',
    config: { layers: [{ offsetX: 3, offsetY: 3, blur: 0, spread: 0, color: '#fbbf24', opacity: 1 }, { offsetX: 6, offsetY: 6, blur: 0, spread: 0, color: '#f97316', opacity: 1 }], shape: 'card', radius: 0 },
  },
];

function applyPreset(preset: { config: PresetConfig }) {
  const { layers, shape, radius, elementColor: elColor } = preset.config;
  shadowLayers.value = layers.map(l => createLayer(l));
  if (shape) previewShape.value = shape;
  if (radius !== undefined) elementRadius.value = radius;
  if (elColor) elementColor.value = elColor;
}

// ===================== Export PNG =====================
async function exportPNG() {
  const previewEl = document.querySelector('.bsg-preview-element') as HTMLElement;
  if (!previewEl) return;

  const canvas = document.createElement('canvas');
  const scale = 2;
  const padding = 60;
  const w = (elementSize.value + padding * 2) * scale;
  const h = (elementSize.value + padding * 2) * scale;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Background
  if (previewBg.value === 'dark') {
    ctx.fillStyle = '#0f172a';
  } else if (previewBg.value === 'light') {
    ctx.fillStyle = '#f1f5f9';
  } else {
    const grd = ctx.createLinearGradient(0, 0, w / scale, h / scale);
    grd.addColorStop(0, '#1e1b4b');
    grd.addColorStop(0.5, '#0f172a');
    grd.addColorStop(1, '#042f2e');
    ctx.fillStyle = grd;
  }
  ctx.fillRect(0, 0, w / scale, h / scale);

  // Element
  const ex = padding;
  const ey = padding;
  const ew = elementSize.value;
  const eh = elementSize.value;

  ctx.save();
  ctx.shadowColor = 'transparent';

  // Draw shadow layers manually
  for (const layer of shadowLayers.value) {
    ctx.save();
    const colorStr = hexToRgba(layer.color, layer.opacity);
    ctx.shadowColor = colorStr;
    ctx.shadowBlur = layer.blur;
    ctx.shadowOffsetX = layer.offsetX;
    ctx.shadowOffsetY = layer.offsetY;

    const r = previewShape.value === 'circle' ? ew / 2 : (previewShape.value === 'square' ? 0 : elementRadius.value);
    ctx.beginPath();
    ctx.roundRect(ex, ey, ew, eh, r);
    ctx.fillStyle = 'transparent';
    ctx.fill();
    ctx.restore();
  }

  // Draw element
  const r = previewShape.value === 'circle' ? ew / 2 : (previewShape.value === 'square' ? 0 : elementRadius.value);
  ctx.beginPath();
  ctx.roundRect(ex, ey, ew, eh, r);
  ctx.fillStyle = elementColor.value;
  ctx.fill();

  ctx.restore();

  const link = document.createElement('a');
  link.download = 'box-shadow-preview.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1100px">
      <!-- Header -->
      <div class="bsg-header">
        <div class="bsg-title">{{ t.title }}</div>
        <div class="bsg-subtitle">{{ t.subtitle }}</div>
      </div>

      <div class="bsg-layout">
        <!-- Left: Controls -->
        <div class="bsg-controls">
          <!-- Shadow Layers -->
          <c-card mb-4>
            <div class="bsg-section-header">
              <div class="bsg-section-title">
                <span>🎭</span> {{ t.layers }}
              </div>
              <n-button size="small" type="primary" @click="addLayer">
                <template #icon><n-icon><Plus /></n-icon></template>
                {{ t.addLayer }}
              </n-button>
            </div>
            <div class="bsg-tip">{{ t.multiLayerTip }}</div>

            <NScrollbar style="max-height: 420px">
              <div class="bsg-layers-list">
                <div
                  v-for="(layer, index) in shadowLayers"
                  :key="layer.id"
                  class="bsg-layer-card"
                >
                  <div class="bsg-layer-header">
                    <div class="bsg-layer-badge">
                      {{ t.layerName }} {{ index + 1 }}
                      <span :class="layer.inset ? 'bsg-inner-tag' : 'bsg-outer-tag'">
                        {{ layer.inset ? t.inner : t.outer }}
                      </span>
                    </div>
                    <n-button v-if="shadowLayers.length > 1" size="tiny" quaternary type="error" @click="removeLayer(layer.id)">
                      <template #icon><n-icon><Trash /></n-icon></template>
                    </n-button>
                  </div>

                  <!-- Offset X -->
                  <div class="bsg-control-row">
                    <div class="bsg-control-label">{{ t.offsetX }}</div>
                    <div class="bsg-control-input">
                      <NSlider v-model:value="layer.offsetX" :min="-60" :max="60" :step="1" />
                      <span class="bsg-val">{{ layer.offsetX }}px</span>
                    </div>
                  </div>
                  <!-- Offset Y -->
                  <div class="bsg-control-row">
                    <div class="bsg-control-label">{{ t.offsetY }}</div>
                    <div class="bsg-control-input">
                      <NSlider v-model:value="layer.offsetY" :min="-60" :max="60" :step="1" />
                      <span class="bsg-val">{{ layer.offsetY }}px</span>
                    </div>
                  </div>
                  <!-- Blur -->
                  <div class="bsg-control-row">
                    <div class="bsg-control-label">{{ t.blur }}</div>
                    <div class="bsg-control-input">
                      <NSlider v-model:value="layer.blur" :min="0" :max="100" :step="1" />
                      <span class="bsg-val">{{ layer.blur }}px</span>
                    </div>
                  </div>
                  <!-- Spread -->
                  <div class="bsg-control-row">
                    <div class="bsg-control-label">{{ t.spread }}</div>
                    <div class="bsg-control-input">
                      <NSlider v-model:value="layer.spread" :min="-30" :max="30" :step="1" />
                      <span class="bsg-val">{{ layer.spread }}px</span>
                    </div>
                  </div>
                  <!-- Color + Opacity row -->
                  <div class="bsg-control-row bsg-row-compact">
                    <div class="bsg-control-label">{{ t.color }}</div>
                    <div class="bsg-color-row">
                      <NColorPicker v-model:value="layer.color" :modes="['hex']" size="small" :swatches="['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#00ffff','#a855f7']" />
                      <NInputNumber v-model:value="layer.opacity" :min="0" :max="1" :step="0.01" size="small" style="width: 80px" />
                    </div>
                  </div>
                  <!-- Inset toggle -->
                  <div class="bsg-control-row bsg-row-compact">
                    <div class="bsg-control-label">{{ t.inset }}</div>
                    <NSwitch v-model:value="layer.inset" size="small" />
                  </div>
                </div>

                <div v-if="shadowLayers.length === 0" class="bsg-empty">
                  {{ t.noLayers }}
                </div>
              </div>
            </NScrollbar>
          </c-card>

          <!-- Element Properties -->
          <c-card mb-4>
            <div class="bsg-section-header">
              <div class="bsg-section-title">
                <span>📦</span> {{ t.boxModel }}
              </div>
            </div>

            <!-- Size -->
            <div class="bsg-control-row">
              <div class="bsg-control-label">{{ t.elementSize }}</div>
              <div class="bsg-control-input">
                <NSlider v-model:value="elementSize" :min="80" :max="320" :step="2" />
                <span class="bsg-val">{{ elementSize }}px</span>
              </div>
            </div>
            <!-- Border Radius -->
            <div v-if="previewShape !== 'circle' && previewShape !== 'square'" class="bsg-control-row">
              <div class="bsg-control-label">{{ t.borderRadius }}</div>
              <div class="bsg-control-input">
                <NSlider v-model:value="elementRadius" :min="0" :max="80" :step="1" />
                <span class="bsg-val">{{ elementRadius }}px</span>
              </div>
            </div>
            <!-- Element Color -->
            <div class="bsg-control-row bsg-row-compact">
              <div class="bsg-control-label">{{ t.elementColor }}</div>
              <NColorPicker v-model:value="elementColor" :modes="['hex']" size="small" :swatches="['#1e293b','#0f172a','#ffffff','#f8fafc','#6366f1','#8b5cf6','#ec4899','#0a0a2e','rgba(255,255,255,0.08)']" />
            </div>
          </c-card>

          <!-- Action Buttons -->
          <div class="bsg-action-bar">
            <n-button size="small" @click="randomShadow">
              <template #icon><n-icon><Refresh /></n-icon></template>
              {{ t.random }}
            </n-button>
            <n-button size="small" @click="resetAll">
              {{ t.reset }}
            </n-button>
          </div>
        </div>

        <!-- Right: Preview + Code -->
        <div class="bsg-preview-col">
          <!-- Preview Options -->
          <c-card mb-4>
            <div class="bsg-preview-options">
              <div class="bsg-preview-opt-group">
                <span class="bsg-opt-label">{{ t.previewShape }}</span>
                <n-button-group size="small">
                  <n-button :type="previewShape === 'square' ? 'primary' : 'default'" @click="previewShape = 'square'">{{ t.shapeSquare }}</n-button>
                  <n-button :type="previewShape === 'rounded' ? 'primary' : 'default'" @click="previewShape = 'rounded'">{{ t.shapeRounded }}</n-button>
                  <n-button :type="previewShape === 'circle' ? 'primary' : 'default'" @click="previewShape = 'circle'">{{ t.shapeCircle }}</n-button>
                  <n-button :type="previewShape === 'card' ? 'primary' : 'default'" @click="previewShape = 'card'">{{ t.shapeCard }}</n-button>
                </n-button-group>
              </div>
              <div class="bsg-preview-opt-group">
                <span class="bsg-opt-label">{{ t.previewBackground }}</span>
                <n-button-group size="small">
                  <n-button :type="previewBg === 'dark' ? 'primary' : 'default'" @click="previewBg = 'dark'">{{ t.bgDark }}</n-button>
                  <n-button :type="previewBg === 'light' ? 'primary' : 'default'" @click="previewBg = 'light'">{{ t.bgLight }}</n-button>
                  <n-button :type="previewBg === 'gradient' ? 'primary' : 'default'" @click="previewBg = 'gradient'">{{ t.bgGradient }}</n-button>
                </n-button-group>
              </div>
            </div>
          </c-card>

          <!-- Live Preview -->
          <c-card mb-4>
            <div class="bsg-section-title" mb-3>
              <span>👁️</span> {{ t.preview }}
            </div>
            <div class="bsg-preview-area" :style="previewBgStyle">
              <div class="bsg-preview-element" :style="previewElementStyle" />
            </div>
          </c-card>

          <!-- CSS Code Output -->
          <c-card mb-4>
            <div class="bsg-code-header">
              <div class="bsg-section-title">
                <span>💻</span> {{ t.output }}
              </div>
              <div class="bsg-code-actions">
                <n-button size="small" :type="justCopied ? 'success' : 'primary'" @click="copyCode">
                  <template #icon><n-icon><Copy /></n-icon></template>
                  {{ justCopied ? t.copied : t.copyCode }}
                </n-button>
                <n-button size="small" @click="exportPNG">
                  <template #icon><n-icon><Download /></n-icon></template>
                  {{ t.exportPNG }}
                </n-button>
              </div>
            </div>
            <div class="bsg-code-block">
              <code>{{ fullCSSCode }}</code>
            </div>
          </c-card>

          <!-- Presets -->
          <c-card>
            <div class="bsg-section-title" mb-3>
              <span>✨</span> {{ t.presets }}
            </div>
            <div class="bsg-presets-grid">
              <div
                v-for="preset in presets"
                :key="preset.key"
                class="bsg-preset-card"
                @click="applyPreset(preset)"
              >
                <div
                  class="bsg-preset-preview"
                  :style="{
                    boxShadow: preset.config.layers.map(l => {
                      const c = l.color || '#000000';
                      const a = l.opacity || 0.15;
                      const r = parseInt(c.slice(1,3),16);
                      const g = parseInt(c.slice(3,5),16);
                      const b = parseInt(c.slice(5,7),16);
                      return `${l.inset ? 'inset ' : ''}${l.offsetX || 0}px ${l.offsetY || 0}px ${l.blur || 0}px ${l.spread || 0}px rgba(${r},${g},${b},${a})`;
                    }).join(', '),
                    borderRadius: (preset.config.shape === 'circle' ? '50%' : preset.config.shape === 'square' ? '0' : (preset.config.radius || 12) + 'px'),
                  }"
                />
                <span class="bsg-preset-name">{{ lang === 'en' ? preset.nameEn : preset.nameZh }}</span>
              </div>
            </div>
          </c-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bsg-header {
  text-align: center;
  margin-bottom: 20px;
}
.bsg-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--n-text-color);
  margin-bottom: 4px;
}
.bsg-subtitle {
  font-size: 0.85rem;
  color: var(--n-text-color-3);
}
.bsg-layout {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}
.bsg-controls {
  flex: 0 0 380px;
  min-width: 320px;
}
.bsg-preview-col {
  flex: 1;
  min-width: 0;
}

/* Section headers */
.bsg-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.bsg-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--n-text-color-2);
}
.bsg-tip {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
  margin-bottom: 10px;
  line-height: 1.4;
}

/* Layer cards */
.bsg-layers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bsg-layer-card {
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  padding: 12px;
  transition: border-color 0.2s;
}
.bsg-layer-card:hover {
  border-color: var(--n-primary-color);
}
.bsg-layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.bsg-layer-badge {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--n-text-color-2);
  display: flex;
  align-items: center;
  gap: 6px;
}
.bsg-inner-tag {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  font-weight: 600;
}
.bsg-outer-tag {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-weight: 600;
}

/* Control rows */
.bsg-control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.bsg-control-row.bsg-row-compact {
  margin-bottom: 4px;
}
.bsg-control-label {
  flex: 0 0 70px;
  font-size: 0.78rem;
  color: var(--n-text-color-3);
}
.bsg-control-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.bsg-control-input .n-slider {
  flex: 1;
}
.bsg-val {
  font-size: 0.72rem;
  color: var(--n-text-color-3);
  min-width: 52px;
  text-align: right;
  font-family: 'Fira Code', monospace;
}
.bsg-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.bsg-empty {
  text-align: center;
  padding: 24px;
  font-size: 0.82rem;
  color: var(--n-text-color-3);
}

/* Action bar */
.bsg-action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

/* Preview options */
.bsg-preview-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.bsg-preview-opt-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bsg-opt-label {
  font-size: 0.78rem;
  color: var(--n-text-color-3);
  white-space: nowrap;
}

/* Preview area */
.bsg-preview-area {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  min-height: 300px;
  transition: background 0.3s ease;
}
.bsg-preview-element {
  transition: box-shadow 0.25s ease, border-radius 0.25s ease;
}

/* Code section */
.bsg-code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.bsg-code-actions {
  display: flex;
  gap: 6px;
}
.bsg-code-block {
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
  white-space: pre-wrap;
}

/* Presets grid */
.bsg-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
}
.bsg-preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  border-radius: 10px;
  cursor: pointer;
  background: var(--n-color-embedded);
  border: 1px solid var(--n-border-color);
  transition: all 0.2s ease;
}
.bsg-preset-card:hover {
  border-color: var(--n-primary-color);
  transform: translateY(-1px);
}
.bsg-preset-card:active {
  transform: scale(0.97);
}
.bsg-preset-preview {
  width: 48px;
  height: 48px;
  background: var(--n-card-color, #1e293b);
  transition: box-shadow 0.25s ease, border-radius 0.25s ease;
}
.bsg-preset-name {
  font-size: 0.68rem;
  color: var(--n-text-color-3);
  text-align: center;
  line-height: 1.2;
}

/* Responsive */
@media (max-width: 768px) {
  .bsg-layout {
    flex-direction: column;
  }
  .bsg-controls {
    flex: none;
    width: 100%;
    min-width: 0;
  }
  .bsg-preview-area {
    padding: 40px 20px;
  }
}
</style>
