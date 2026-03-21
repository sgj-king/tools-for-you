<script setup lang="ts">
import { ref } from 'vue';
import { useDownloadFileFromBase64 } from '@/composable/downloadBase64';

const promptText = ref('');
const generatedImages = ref<string[]>([]);
const isGenerating = ref(false);
const apiKey = ref('');

async function generateImage() {
  if (!promptText.value) return;
  
  isGenerating.value = true;
  
  // 模拟生成 - 实际使用时需要连接真实的 API
  setTimeout(() => {
    isGenerating.value = false;
  }, 2000);
}

function downloadImage(index: number) {
  if (generatedImages.value[index]) {
    useDownloadFileFromBase64({
      source: generatedImages.value[index],
      filename: 'generated-image.png'
    });
  }
}

function clearImages() {
  generatedImages.value = [];
}
</script>

<template>
  <div class="image-generator">
    <c-card>
      <div class="param-group">
        <label>提示词</label>
        <n-input
          v-model:value="promptText"
          type="textarea"
          placeholder="详细描述您想创造的图像..."
          :autos="{ minRows: 4, maxRows: 8 }"
        />
      </div>
      
      <div class="param-group">
        <label>API Key（可选）</label>
        <n-input
          v-model:value="apiKey"
          type="password"
          placeholder="输入 API Key"
          show-password-on="click"
        />
      </div>
      
      <c-button
        type="primary"
        :loading="isGenerating"
        :disabled="isGenerating"
        @click="generateImage"
      >
        生成图像
      </c-button>
    </c-card>
    
    <div v-if="generatedImages.length > 0" class="result-section">
      <div class="result-header">
        <span>生成结果</span>
        <c-button size="small" @click="clearImages">清空</c-button>
      </div>
      <div class="result-grid">
        <div
          v-for="(img, index) in generatedImages"
          :key="index"
          class="result-item"
        >
          <img :src="img" alt="生成的图像" />
          <div class="result-actions">
            <c-button size="small" @click="downloadImage(index)">下载</c-button>
          </div>
        </div>
      </div>
    </div>
    
    <c-card v-else>
      <n-empty description="输入提示词后点击生成" />
    </c-card>
  </div>
</template>

<style lang="less" scoped>
.image-generator {
  .param-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }
  
  .result-section {
    margin-top: 16px;
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    
    .result-item {
      img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: contain;
      }
      
      .result-actions {
        margin-top: 8px;
        text-align: center;
      }
    }
  }
}
</style>
