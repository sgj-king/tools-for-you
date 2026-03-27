<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useClipboard } from '@vueuse/core';
import { NColorPicker, NButton, NSlider, NInput, NInputGroup, NInputGroupLabel, NTooltip, NTag, NH1 } from 'naive-ui';
import type { Hsl, Rgb } from 'colord';
import { colord, extend } from 'colord';
import cmykPlugin from 'colord/plugins/cmyk';
import hwbPlugin from 'colord/plugins/hwb';
import namesPlugin from 'colord/plugins/names';

extend([cmykPlugin, hwbPlugin, namesPlugin]);

const { copy, copied } = useClipboard();

// 当前颜色状态
const currentColor = ref('#18a058');
const hue = ref(0);
const saturation = ref(100);
const lightness = ref(50);

// 颜色历史记录
const colorHistory = ref<string[]>([]);
const maxHistory = 12;

// 颜色格式计算
const colordColor = computed(() => colord(currentColor.value));
const hexValue = computed(() => colordColor.value.toHex());
const rgbValue = computed(() => colordColor.value.toRgb());
const hslValue = computed(() => colordColor.value.toHsl());
const cmykValue = computed(() => colordColor.value.toCmyk());
const hwbValue = computed(() => colordColor.value.toHwb());

// 格式化输出
const hexString = computed(() => hexValue.value);
const rgbString = computed(() => `rgb(${rgbValue.value.r}, ${rgbValue.value.g}, ${rgbValue.value.b})`);
const rgbaString = computed(() => (alpha: number) => `rgba(${rgbValue.value.r}, ${rgbValue.value.g}, ${rgbValue.value.b}, ${alpha})`);
const hslString = computed(() => `hsl(${Math.round(hslValue.value.h)}, ${Math.round(hslValue.value.s)}%, ${Math.round(hslValue.value.l)}%)`);
const hwbString = computed(() => `hwb(${Math.round(hwbValue.value.h)}, ${Math.round(hwbValue.value.w)}%, ${Math.round(hwbValue.value.b)}%)`);
const cmykString = computed(() => `cmyk(${Math.round(cmykValue.value.c)}%, ${Math.round(cmykValue.value.m)}%, ${Math.round(cmykValue.value.y)}%, ${Math.round(cmykValue.value.k)}%)`);

// 从历史记录选择颜色
function selectFromHistory(color: string) {
  currentColor.value = color;
}

// 添加到历史记录
function addToHistory(color: string) {
  const hex = colord(color).toHex();
  const existingIndex = colorHistory.value.indexOf(hex);
  if (existingIndex > -1) {
    colorHistory.value.splice(existingIndex, 1);
  }
  colorHistory.value.unshift(hex);
  if (colorHistory.value.length > maxHistory) {
    colorHistory.value.pop();
  }
  saveHistory();
}

// 复制颜色值
function copyColor(value: string) {
  copy(value);
}

// 保存历史记录到 localStorage
function saveHistory() {
  localStorage.setItem('colorPickerHistory', JSON.stringify(colorHistory.value));
}

// 从 localStorage 加载历史记录
function loadHistory() {
  const saved = localStorage.getItem('colorPickerHistory');
  if (saved) {
    try {
      colorHistory.value = JSON.parse(saved);
    } catch {
      colorHistory.value = [];
    }
  }
}

// 生成随机颜色
function randomColor() {
  const h = Math.random() * 360;
  const s = 50 + Math.random() * 50;
  const l = 40 + Math.random() * 30;
  currentColor.value = colord({ h, s, l } as Hsl).toHex();
}

// 颜色名称
const colorName = computed(() => {
  const name = colordColor.value.toName({ closest: true });
  return name || '未知颜色';
});

onMounted(() => {
  loadHistory();
});

// 监听颜色变化，自动添加到历史记录
watch(currentColor, (newColor) => {
  addToHistory(newColor);
}, { debounce: 500 });
</script>

<template>
  <div class="color-picker-container">
    <!-- 主选择器区域 -->
    <c-card class="main-picker-card">
      <div class="picker-section">
        <!-- 左侧：颜色选择器和预览 -->
        <div class="color-preview-section">
          <n-color-picker
            v-model:value="currentColor"
            :modes="['hex', 'rgb', 'hsl']"
            :show-alpha="true"
            :swatches="colorHistory"
            :actions="['clear']"
            placement="bottom-start"
          />
          
          <!-- 大色块预览 -->
          <div class="color-preview-large" :style="{ backgroundColor: currentColor }">
            <div class="preview-info">
              <span class="hex-label">{{ hexString }}</span>
            </div>
          </div>
          
          <!-- 颜色名称 -->
          <div class="color-name">
            <n-tag type="info" size="small">{{ colorName }}</n-tag>
          </div>
        </div>
        
        <!-- 右侧：快捷操作 -->
        <div class="quick-actions">
          <n-button block @click="randomColor" type="primary" ghost>
            🎲 随机颜色
          </n-button>
        </div>
      </div>
    </c-card>

    <!-- 颜色格式输出 -->
    <c-card title="颜色格式" class="formats-card">
      <div class="formats-grid">
        <!-- HEX -->
        <div class="format-item" @click="copyColor(hexString)">
          <div class="format-label">HEX</div>
          <div class="format-value">{{ hexString }}</div>
          <n-button size="tiny" :type="copied ? 'success' : 'default'" quaternary>
            {{ copied ? '已复制' : '复制' }}
          </n-button>
        </div>
        
        <!-- RGB -->
        <div class="format-item" @click="copyColor(rgbString)">
          <div class="format-label">RGB</div>
          <div class="format-value">{{ rgbString }}</div>
          <n-button size="tiny" quaternary>复制</n-button>
        </div>
        
        <!-- HSL -->
        <div class="format-item" @click="copyColor(hslString)">
          <div class="format-label">HSL</div>
          <div class="format-value">{{ hslString }}</div>
          <n-button size="tiny" quaternary>复制</n-button>
        </div>
        
        <!-- HWB -->
        <div class="format-item" @click="copyColor(hwbString)">
          <div class="format-label">HWB</div>
          <div class="format-value">{{ hwbString }}</div>
          <n-button size="tiny" quaternary>复制</n-button>
        </div>
        
        <!-- CMYK -->
        <div class="format-item" @click="copyColor(cmykString)">
          <div class="format-label">CMYK</div>
          <div class="format-value">{{ cmykString }}</div>
          <n-button size="tiny" quaternary>复制</n-button>
        </div>
        
        <!-- RGB 详细值 -->
        <div class="format-item format-detail">
          <div class="format-label">RGB 值</div>
          <div class="format-value">
            R: {{ rgbValue.r }} | G: {{ rgbValue.g }} | B: {{ rgbValue.b }}
          </div>
        </div>
        
        <!-- HSL 详细值 -->
        <div class="format-item format-detail">
          <div class="format-label">HSL 值</div>
          <div class="format-value">
            H: {{ Math.round(hslValue.h) }}° | S: {{ Math.round(hslValue.s) }}% | L: {{ Math.round(hslValue.l) }}%
          </div>
        </div>
      </div>
    </c-card>

    <!-- 颜色历史 -->
    <c-card title="历史记录" class="history-card" v-if="colorHistory.length > 0">
      <div class="history-grid">
        <div
          v-for="color in colorHistory"
          :key="color"
          class="history-item"
          :style="{ backgroundColor: color }"
          @click="selectFromHistory(color)"
        >
          <n-tooltip trigger="hover">
            <template #trigger>
              <div class="history-item-inner"></div>
            </template>
            {{ color }}
          </n-tooltip>
        </div>
      </div>
    </c-card>

    <!-- 调色板工具 -->
    <c-card title="调色板" class="palette-card">
      <div class="palette-section">
        <!-- 亮度变化 -->
        <div class="palette-row">
          <span class="palette-label">亮度变化</span>
          <div class="palette-colors">
            <div
              v-for="i in 9"
              :key="'l'+i"
              class="palette-color"
              :style="{ backgroundColor: colord(currentColor).lighten((i-5) * 0.1).toHex() }"
              @click="copyColor(colord(currentColor).lighten((i-5) * 0.1).toHex())"
            >
              <n-tooltip trigger="hover">
                <template #trigger>
                  <div class="palette-color-inner"></div>
                </template>
                {{ colord(currentColor).lighten((i-5) * 0.1).toHex() }}
              </n-tooltip>
            </div>
          </div>
        </div>
        
        <!-- 饱和度变化 -->
        <div class="palette-row">
          <span class="palette-label">饱和度变化</span>
          <div class="palette-colors">
            <div
              v-for="i in 9"
              :key="'s'+i"
              class="palette-color"
              :style="{ backgroundColor: colord(currentColor).saturate((i-5) * 0.1).toHex() }"
              @click="copyColor(colord(currentColor).saturate((i-5) * 0.1).toHex())"
            >
              <n-tooltip trigger="hover">
                <template #trigger>
                  <div class="palette-color-inner"></div>
                </template>
                {{ colord(currentColor).saturate((i-5) * 0.1).toHex() }}
              </n-tooltip>
            </div>
          </div>
        </div>
        
        <!-- 色相变化 -->
        <div class="palette-row">
          <span class="palette-label">色相变化</span>
          <div class="palette-colors">
            <div
              v-for="i in 12"
              :key="'h'+i"
              class="palette-color"
              :style="{ backgroundColor: colord(currentColor).rotate(i * 30).toHex() }"
              @click="copyColor(colord(currentColor).rotate(i * 30).toHex())"
            >
              <n-tooltip trigger="hover">
                <template #trigger>
                  <div class="palette-color-inner"></div>
                </template>
                {{ colord(currentColor).rotate(i * 30).toHex() }}
              </n-tooltip>
            </div>
          </div>
        </div>
      </div>
    </c-card>
  </div>
</template>

<style scoped>
.color-picker-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.picker-section {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.color-preview-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.color-preview-large {
  width: 180px;
  height: 120px;
  border-radius: 12px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
}

.color-preview-large:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.preview-info {
  background: rgba(255, 255, 255, 0.95);
  padding: 4px 12px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.hex-label {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.color-name {
  text-align: center;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}

.formats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.format-item {
  background: var(--n-color-hover);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.format-item:hover {
  background: var(--n-color-pressed);
  transform: translateY(-2px);
}

.format-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.format-value {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  word-break: break-all;
}

.format-detail {
  grid-column: span 2;
}

.history-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-item {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.history-item:hover {
  transform: scale(1.1);
  border-color: var(--n-border-color);
}

.history-item-inner {
  width: 100%;
  height: 100%;
}

.palette-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.palette-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.palette-label {
  font-size: 13px;
  color: var(--n-text-color-2);
  min-width: 80px;
}

.palette-colors {
  display: flex;
  gap: 4px;
  flex: 1;
}

.palette-color {
  flex: 1;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.palette-color:hover {
  transform: scale(1.05);
  border-color: var(--n-border-color);
  z-index: 1;
}

.palette-color-inner {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .picker-section {
    flex-direction: column;
    align-items: center;
  }
  
  .format-detail {
    grid-column: span 1;
  }
  
  .formats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
