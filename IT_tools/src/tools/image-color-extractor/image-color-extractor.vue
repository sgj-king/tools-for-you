<script setup lang="ts">
import { ref, computed } from 'vue';
import { useClipboard } from '@vueuse/core';
import { NUpload, NButton, NTag, NTooltip, NEmpty, NSpin, NSlider } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import { colord } from 'colord';

const { copy, copied } = useClipboard();

// 状态
const imageUrl = ref<string | null>(null);
const isProcessing = ref(false);
const colors = ref<{ hex: string; rgb: string; percentage: number }[]>([]);
const colorCount = ref(6);
const imagePreview = ref<string | null>(null);

// 处理图片上传
async function handleUpload({ file }: { file: UploadFileInfo }) {
  if (!file.file) return;
  
  isProcessing.value = true;
  colors.value = [];
  
  // 创建图片预览
  const reader = new FileReader();
  reader.onload = async (e) => {
    imagePreview.value = e.target?.result as string;
    await extractColors(file.file!);
  };
  reader.readAsDataURL(file.file);
}

// 提取图片主要颜色
async function extractColors(file: File) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  img.onload = () => {
    // 设置画布大小（限制最大尺寸以提高性能）
    const maxSize = 200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // 使用中位切分算法提取主要颜色
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = Math.round(pixels[i] / 32) * 32;
      const g = Math.round(pixels[i + 1] / 32) * 32;
      const b = Math.round(pixels[i + 2] / 32) * 32;
      const a = pixels[i + 3];
      
      // 忽略透明像素
      if (a < 128) continue;
      
      // 忽略接近白色和黑色的颜色
      const brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 235) continue;
      
      const key = `${r},${g},${b}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    
    // 排序并获取主要颜色
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount.value * 3);
    
    // 转换为颜色对象
    const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0);
    const extractedColors: { hex: string; rgb: string; percentage: number }[] = [];
    
    // 使用聚类合并相似颜色
    const mergedColors = mergeSimilarColors(sortedColors.map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      return { r, g, b, count };
    }));
    
    mergedColors.slice(0, colorCount.value).forEach(({ r, g, b, count }) => {
      const hex = rgbToHex(r, g, b);
      extractedColors.push({
        hex,
        rgb: `rgb(${r}, ${g}, ${b})`,
        percentage: Math.round((count / totalPixels) * 100)
      });
    });
    
    colors.value = extractedColors;
    isProcessing.value = false;
  };
  
  img.onerror = () => {
    isProcessing.value = false;
  };
  
  img.src = URL.createObjectURL(file);
}

// 合并相似颜色
function mergeSimilarColors(colorList: { r: number; g: number; b: number; count: number }[]) {
  const threshold = 50;
  const merged: { r: number; g: number; b: number; count: number }[] = [];
  
  for (const color of colorList) {
    let found = false;
    for (const m of merged) {
      const distance = Math.sqrt(
        Math.pow(color.r - m.r, 2) +
        Math.pow(color.g - m.g, 2) +
        Math.pow(color.b - m.b, 2)
      );
      if (distance < threshold) {
        // 合并颜色
        const total = m.count + color.count;
        m.r = Math.round((m.r * m.count + color.r * color.count) / total);
        m.g = Math.round((m.g * m.count + color.g * color.count) / total);
        m.b = Math.round((m.b * m.count + color.b * color.count) / total);
        m.count = total;
        found = true;
        break;
      }
    }
    if (!found) {
      merged.push({ ...color });
    }
  }
  
  // 按数量排序
  return merged.sort((a, b) => b.count - a.count);
}

// RGB转HEX
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// 复制颜色
function copyColor(value: string) {
  copy(value);
}

// 清除
function clearAll() {
  imageUrl.value = null;
  imagePreview.value = null;
  colors.value = [];
}

// 获取对比色（用于文字颜色）
function getContrastColor(hex: string): string {
  const rgb = colord(hex).toRgb();
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}
</script>

<template>
  <div class="image-color-extractor">
    <!-- 上传区域 -->
    <c-card class="upload-card">
      <div class="upload-section">
        <n-upload
          accept="image/*"
          :max="1"
          :show-file-list="false"
          @change="handleUpload"
        >
          <template #default>
            <div class="upload-area">
              <div class="upload-icon">📷</div>
              <div class="upload-text">
                <p class="upload-title">{{ '上传图片' }}</p>
                <p class="upload-hint">{{ '支持 JPG、PNG、GIF 格式' }}</p>
              </div>
            </div>
          </template>
        </n-upload>
        
        <!-- 颜色数量选择 -->
        <div class="color-count-selector">
          <span class="label">{{ '颜色数量' }}</span>
          <n-slider
            v-model:value="colorCount"
            :min="3"
            :max="10"
            :step="1"
            :tooltip="true"
            style="width: 200px"
          />
          <span class="value">{{ colorCount }}</span>
        </div>
      </div>
    </c-card>

    <!-- 处理中 -->
    <div v-if="isProcessing" class="processing-container">
      <n-spin size="large" />
      <p>{{ '处理中...' }}</p>
    </div>

    <!-- 结果展示 -->
    <template v-if="colors.length > 0 && !isProcessing">
      <!-- 图片预览 -->
      <c-card class="preview-card">
        <div class="preview-section">
          <div class="image-preview-wrapper">
            <img :src="imagePreview!" alt="预览" class="image-preview" />
            <n-button
              size="small"
              type="error"
              quaternary
              class="clear-button"
              @click="clearAll"
            >
              {{ '清除' }}
            </n-button>
          </div>
        </div>
      </c-card>

      <!-- 颜色列表 -->
      <c-card :title="'提取的颜色'">
        <div class="colors-grid">
          <div
            v-for="(color, index) in colors"
            :key="index"
            class="color-card"
            :style="{ backgroundColor: color.hex }"
          >
            <div class="color-info" :style="{ color: getContrastColor(color.hex) }">
              <div class="color-hex">{{ color.hex.toUpperCase() }}</div>
              <div class="color-rgb">{{ color.rgb }}</div>
              <div class="color-percentage">{{ color.percentage }}%</div>
            </div>
            <div class="color-actions">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-button
                    size="tiny"
                    :type="copied ? 'success' : 'default'"
                    quaternary
                    @click="copyColor(color.hex)"
                  >
                    {{ '复制 HEX' }}
                  </n-button>
                </template>
                {{ color.hex }}
              </n-tooltip>
              <n-button
                size="tiny"
                quaternary
                @click="copyColor(color.rgb)"
              >
                {{ '复制 RGB' }}
              </n-button>
            </div>
          </div>
        </div>
      </c-card>

      <!-- 调色板展示 -->
      <c-card :title="'调色板'">
        <div class="palette-bar">
          <div
            v-for="(color, index) in colors"
            :key="index"
            class="palette-segment"
            :style="{ 
              flex: color.percentage,
              backgroundColor: color.hex 
            }"
          >
            <n-tooltip trigger="hover">
              <template #trigger>
                <div class="palette-segment-inner"></div>
              </template>
              {{ color.hex.toUpperCase() }} ({{ color.percentage }}%)
            </n-tooltip>
          </div>
        </div>
      </c-card>

      <!-- CSS 变量导出 -->
      <c-card :title="'CSS 变量'">
        <div class="css-code">
          <pre><code>:root {
{{ colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n') }}
}</code></pre>
          <n-button
            size="small"
            type="primary"
            @click="copyColor(`:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')}\n}`)"
          >
            {{ '复制 CSS' }}
          </n-button>
        </div>
      </c-card>
    </template>

    <!-- 空状态 -->
    <c-card v-if="colors.length === 0 && !isProcessing && !imagePreview">
      <n-empty :description="'上传图片开始提取颜色'" />
    </c-card>
  </div>
</template>

<style scoped>
.image-color-extractor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-card {
  margin-bottom: 0;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-area {
  border: 2px dashed var(--n-border-color);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--n-color-hover);
}

.upload-area:hover {
  border-color: var(--n-color-target);
  background: var(--n-color-pressed);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 13px;
  color: var(--n-text-color-3);
}

.color-count-selector {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-count-selector .label {
  font-size: 14px;
  color: var(--n-text-color-2);
  min-width: 80px;
}

.color-count-selector .value {
  font-size: 16px;
  font-weight: 600;
  min-width: 20px;
}

.processing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
}

.preview-card {
  margin-bottom: 0;
}

.preview-section {
  display: flex;
  justify-content: center;
}

.image-preview-wrapper {
  position: relative;
  display: inline-block;
}

.image-preview {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.clear-button {
  position: absolute;
  top: 8px;
  right: 8px;
}

.colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.color-card {
  border-radius: 12px;
  padding: 16px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
  cursor: pointer;
}

.color-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.color-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-hex {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Monaco', 'Menlo', monospace;
}

.color-rgb {
  font-size: 12px;
  opacity: 0.8;
}

.color-percentage {
  font-size: 12px;
  opacity: 0.7;
}

.color-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.palette-bar {
  display: flex;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.palette-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 30px;
}

.palette-segment:hover {
  filter: brightness(1.1);
}

.palette-segment-inner {
  width: 100%;
  height: 100%;
}

.css-code {
  background: var(--n-color-hover);
  border-radius: 8px;
  padding: 16px;
  position: relative;
}

.css-code pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  overflow-x: auto;
}

.css-code code {
  color: var(--n-text-color);
}

.css-code .n-button {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .colors-grid {
    grid-template-columns: 1fr;
  }
  
  .upload-area {
    padding: 30px 15px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
}
</style>
