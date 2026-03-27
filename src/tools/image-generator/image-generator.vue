<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';

const message = useMessage();

// API Key 弹窗状态
const showApiKeyModal = ref(false);

// 工作区切换
const activeWorkspace = ref('banana');

// ============ Banana 工作区 ============
const bananaMode = ref('img2img');
const bananaModel = ref('gemini-3-pro-image-preview');
const bananaBatchCount = ref(1);
const bananaResolution = ref('1K');
const bananaAspectRatio = ref('16:9');
const bananaPrompt = ref('');
const bananaImages = ref<any[]>([]);
const bananaGenerating = ref(false);
const bananaResult = ref<any[]>([]);

// 模型选项
const modelOptions = [
  { label: 'Nanobanana2', value: 'gemini-3.1-flash-image-preview' },
  { label: 'Nanobanana Pro', value: 'gemini-3-pro-image-preview' },
];

// 分辨率选项
const resolutionOptions = [
  { label: '0.5K (512x512)', value: '0.5K' },
  { label: '1K (1024x1024)', value: '1K' },
  { label: '2K (2048x2048)', value: '2K' },
  { label: '4K (4096x4096)', value: '4K' },
];

// 长宽比选项
const aspectRatioOptions = [
  { label: '1:1', value: '1:1' },
  { label: '2:3', value: '2:3' },
  { label: '3:2', value: '3:2' },
  { label: '3:4', value: '3:4' },
  { label: '4:3', value: '4:3' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '21:9', value: '21:9' },
];

// 处理参考图上传
function handleBananaUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  
  Array.from(input.files).forEach((file, index) => {
    if (bananaImages.value.length >= 14) {
      message.warning('最多上传14张参考图');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      bananaImages.value.push({
        id: Date.now() + index,
        url: e.target?.result,
        file: file,
      });
    };
    reader.readAsDataURL(file);
  });
}

function removeBananaImage(index: number) {
  bananaImages.value.splice(index, 1);
}

// ============ 数字人生成 ============
const dhModel = ref('gemini-3-pro-image-preview');
const dhImages = ref<any[]>([null, null]);
const dhGender = ref('male');
const dhAge = ref(25);
const dhHeight = ref(170);
const dhWeight = ref(65);
const dhResult = ref('');
const dhGenerating = ref(false);

function handleDhUpload(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    dhImages.value[index] = {
      url: e.target?.result,
      file: file,
      name: file.name,
    };
  };
  reader.readAsDataURL(file);
}

function clearDhImage(index: number) {
  dhImages.value[index] = null;
}

const dhSummary = computed(() => {
  const genderText = dhGender.value === 'male' ? '男性' : '女性';
  return genderText + '，' + dhAge.value + '岁，身高' + dhHeight.value + 'cm，体重' + dhWeight.value + 'kg';
});

// ============ 三视图生成 ============
const tvModel = ref('gemini-3-pro-image-preview');
const tvFrontImage = ref<any>(null);
const tvResult = ref<any[]>([]);
const tvGenerating = ref(false);

function handleTvUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    tvFrontImage.value = {
      url: e.target?.result,
      file: file,
      name: file.name,
    };
  };
  reader.readAsDataURL(file);
}

function clearTvImage() {
  tvFrontImage.value = null;
}

// ============ 多视角生成 ============
const mvModel = ref('gemini-3-pro-image-preview');
const mvInputImage = ref<any>(null);
const mvAngleCount = ref(4);
const mvResult = ref<any[]>([]);
const mvGenerating = ref(false);

function handleMvUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.[0]) return;
  
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    mvInputImage.value = {
      url: e.target?.result,
      file: file,
      name: file.name,
    };
  };
  reader.readAsDataURL(file);
}

function clearMvImage() {
  mvInputImage.value = null;
}

// ============ 通用功能 ============
const apiKey = ref('');
const defaultApiKey = 'sk-aLV343mgS1oqbaMZnL5ioe1krShvd3rezDf0TfiThyvLQ6g5';

onMounted(() => {
  const savedKey = localStorage.getItem('nanobanana_api_key');
  apiKey.value = savedKey || defaultApiKey;
});

function saveApiKey() {
  localStorage.setItem('nanobanana_api_key', apiKey.value);
  message.success('API Key 已保存');
}

function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

// 模拟生成函数
async function generateBanana() {
  if (!bananaPrompt.value.trim() && bananaImages.value.length === 0) {
    message.warning('请输入提示词或上传参考图片');
    return;
  }
  
  bananaGenerating.value = true;
  message.info('正在生成图像...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  bananaGenerating.value = false;
  message.warning('需要配置有效的 API Key 才能生成图像');
}

async function generateDh() {
  if (!dhImages.value[0] && !dhImages.value[1]) {
    message.warning('请上传至少一张参考图');
    return;
  }
  
  dhGenerating.value = true;
  message.info('正在生成数字人...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  dhGenerating.value = false;
  message.warning('需要配置有效的 API Key 才能生成');
}

async function generateTv() {
  if (!tvFrontImage.value) {
    message.warning('请上传正面参考图');
    return;
  }
  
  tvGenerating.value = true;
  message.info('正在生成三视图...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  tvGenerating.value = false;
  message.warning('需要配置有效的 API Key 才能生成');
}

async function generateMv() {
  if (!mvInputImage.value) {
    message.warning('请上传参考图片');
    return;
  }
  
  mvGenerating.value = true;
  message.info('正在生成多视角...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  mvGenerating.value = false;
  message.warning('需要配置有效的 API Key 才能生成');
}
</script>

<template>
  <div class="image-generator">
    <!-- 右上角设置按钮 -->
    <div class="settings-trigger">
      <c-button @click="showApiKeyModal = true" size="small">
        <icon-mdi-key mr-1 />
        <span class="settings-text">API设置</span>
      </c-button>
    </div>

    <!-- API Key 弹窗 -->
    <c-modal v-model:open="showApiKeyModal" title="API Key 设置">
      <div class="api-modal-content">
        <div class="api-label">请输入您的 API Key：</div>
        <c-input-text 
          v-model:value="apiKey" 
          type="password"
          placeholder="输入 API Key"
          mb-4
        />
        <div class="api-note">
          API Key 将保存在本地浏览器中，用于调用图像生成服务。
        </div>
      </div>
      <template #footer>
        <c-button @click="showApiKeyModal = false">取消</c-button>
        <c-button type="primary" @click="saveApiKey(); showApiKeyModal = false">保存</c-button>
      </template>
    </c-modal>

    <!-- 工作区切换 -->
    <n-tabs v-model:value="activeWorkspace" type="line" animated mb-4>
      <n-tab-pane name="banana" tab="AI图像生成">
        <n-grid x-gap="16" y-gap="16" cols="1 800:2">
          <!-- 左侧参数 -->
          <n-gi>
            <c-card>
              <!-- 模式切换 -->
              <div mb-4>
                <div class="section-label">生成模式</div>
                <n-grid x-gap="8" cols="2">
                  <n-gi>
                    <c-button 
                      :type="bananaMode === 'img2img' ? 'primary' : 'default'" 
                      block 
                      round
                      @click="bananaMode = 'img2img'"
                    >
                      图像生成图像
                    </c-button>
                  </n-gi>
                  <n-gi>
                    <c-button 
                      :type="bananaMode === 'text2img' ? 'primary' : 'default'" 
                      block 
                      round
                      @click="bananaMode = 'text2img'"
                    >
                      文字生成图像
                    </c-button>
                  </n-gi>
                </n-grid>
              </div>

              <!-- 参考图上传 -->
              <div v-show="bananaMode === 'img2img'" mb-4>
                <div class="section-label">
                  参考图上传
                  <span class="section-note">(最多14张)</span>
                </div>
                <label block>
                  <input type="file" multiple accept="image/*" @change="handleBananaUpload" hidden />
                  <div class="upload-area">
                    <div class="upload-icon">📤</div>
                    <div>点击或拖拽上传图片</div>
                    <div class="upload-tip">支持 JPG, PNG, GIF, WebP</div>
                  </div>
                </label>
                <div v-if="bananaImages.length > 0" class="image-grid">
                  <div v-for="(img, idx) in bananaImages" :key="img.id" class="preview-item">
                    <img :src="img.url" />
                    <span class="order-badge">{{ idx + 1 }}</span>
                    <button class="remove-btn" @click="removeBananaImage(idx)">×</button>
                  </div>
                </div>
              </div>

              <!-- 模型选择 -->
              <c-select 
                v-model:value="bananaModel" 
                label="模型选择:" 
                :options="modelOptions"
                label-position="left"
                label-width="100px"
                mb-4
              />

              <!-- 生成数量 -->
              <div mb-4>
                <div class="section-label">生成数量: {{ bananaBatchCount }}</div>
                <n-slider v-model:value="bananaBatchCount" :min="1" :max="8" :step="1" />
              </div>

              <!-- 分辨率 -->
              <div mb-4>
                <div class="section-label">分辨率</div>
                <n-grid x-gap="8" cols="4">
                  <n-gi v-for="res in ['0.5K', '1K', '2K', '4K']" :key="res">
                    <c-button 
                      :type="bananaResolution === res ? 'primary' : 'default'" 
                      block 
                      round
                      size="small"
                      @click="bananaResolution = res"
                    >
                      {{ res }}
                    </c-button>
                  </n-gi>
                </n-grid>
              </div>

              <!-- 长宽比 -->
              <div mb-4>
                <div class="section-label">长宽比</div>
                <n-grid x-gap="8" y-gap="8" cols="4">
                  <n-gi v-for="opt in aspectRatioOptions" :key="opt.value">
                    <c-button 
                      :type="bananaAspectRatio === opt.value ? 'primary' : 'default'" 
                      block 
                      round
                      size="small"
                      @click="bananaAspectRatio = opt.value"
                    >
                      {{ opt.label }}
                    </c-button>
                  </n-gi>
                </n-grid>
              </div>

              <!-- 提示词 -->
              <c-input-text 
                v-model:value="bananaPrompt"
                label="提示词:"
                label-position="left"
                label-width="100px"
                multiline
                :rows="4"
                placeholder="详细描述您想创造的图像..."
                mb-4
              />

              <!-- 生成按钮 -->
              <c-button type="primary" block round :loading="bananaGenerating" @click="generateBanana">
                生成图像
              </c-button>
            </c-card>
          </n-gi>

          <!-- 右侧结果 -->
          <n-gi>
            <c-card h-full>
              <div class="section-label">生成结果</div>
              <div class="result-area">
                <div v-if="bananaResult.length === 0" class="result-placeholder">
                  <div class="placeholder-icon">🎨</div>
                  <div class="placeholder-title">等待生成</div>
                  <div class="placeholder-desc">输入提示词后点击生成</div>
                </div>
                <div v-else class="result-grid">
                  <img 
                    v-for="(img, idx) in bananaResult" 
                    :key="idx" 
                    :src="img" 
                    class="result-image"
                    @click="downloadImage(img, 'generated-' + idx + '.png')"
                  />
                </div>
              </div>
            </c-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>

      <!-- 数字人生成 -->
      <n-tab-pane name="digital-human" tab="数字人生成">
        <n-grid x-gap="16" y-gap="16" cols="1 800:3">
          <n-gi>
            <c-card h-full>
              <div class="section-label">参考图上传</div>
              <div class="upload-stack">
                <label v-for="i in 2" :key="i" block>
                  <input 
                    type="file" 
                    accept="image/*" 
                    @change="handleDhUpload($event, i - 1)" 
                    hidden 
                  />
                  <div class="upload-slot portrait">
                    <img 
                      v-if="dhImages[i - 1]" 
                      :src="dhImages[i - 1].url" 
                      class="upload-preview-image"
                    />
                    <div v-else class="upload-placeholder">
                      <span class="icon">📤</span>
                      <span>上传第{{ i }}张参考图</span>
                    </div>
                    <button 
                      v-if="dhImages[i - 1]" 
                      class="clear-btn"
                      @click.prevent="clearDhImage(i - 1)"
                    >
                      ×
                    </button>
                  </div>
                </label>
              </div>
            </c-card>
          </n-gi>

          <n-gi>
            <c-card h-full>
              <div class="section-label">数字人设定</div>
              
              <c-select 
                v-model:value="dhModel" 
                label="模型选择:" 
                :options="modelOptions"
                label-position="left"
                label-width="80px"
                mb-3
              />

              <div mb-3>
                <div class="section-label">性别</div>
                <n-grid x-gap="8" cols="2">
                  <n-gi>
                    <c-button 
                      :type="dhGender === 'male' ? 'primary' : 'default'" 
                      block 
                      round
                      @click="dhGender = 'male'"
                    >
                      男性
                    </c-button>
                  </n-gi>
                  <n-gi>
                    <c-button 
                      :type="dhGender === 'female' ? 'primary' : 'default'" 
                      block 
                      round
                      @click="dhGender = 'female'"
                    >
                      女性
                    </c-button>
                  </n-gi>
                </n-grid>
              </div>

              <n-grid x-gap="12" cols="2" mb-3>
                <n-gi>
                  <c-input-text 
                    v-model:value="dhAge"
                    label="年龄:"
                    type="number"
                    label-position="left"
                    label-width="50px"
                  />
                </n-gi>
                <n-gi>
                  <c-input-text 
                    v-model:value="dhHeight"
                    label="身高(cm):"
                    type="number"
                    label-position="left"
                    label-width="70px"
                  />
                </n-gi>
              </n-grid>

              <c-input-text 
                v-model:value="dhWeight"
                label="体重(kg):"
                type="number"
                label-position="left"
                label-width="70px"
                mb-3
              />

              <div class="summary-card">
                <div class="summary-label">人物设定摘要</div>
                <div class="summary-text">{{ dhSummary }}</div>
              </div>

              <c-button type="primary" block round :loading="dhGenerating" @click="generateDh">
                生成数字人
              </c-button>
            </c-card>
          </n-gi>

          <n-gi>
            <c-card h-full>
              <div class="section-label">生成结果</div>
              <div class="result-area">
                <div v-if="!dhResult" class="result-placeholder">
                  <div class="placeholder-icon">👤</div>
                  <div class="placeholder-title">等待生成</div>
                </div>
                <img v-else :src="dhResult" class="result-image single" />
              </div>
            </c-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>

      <!-- 三视图生成 -->
      <n-tab-pane name="three-view" tab="三视图生成">
        <n-grid x-gap="16" y-gap="16" cols="1 800:3">
          <n-gi>
            <c-card h-full>
              <div class="section-label">正面参考图</div>
              <label block>
                <input type="file" accept="image/*" @change="handleTvUpload" hidden />
                <div class="upload-slot landscape">
                  <img 
                    v-if="tvFrontImage" 
                    :src="tvFrontImage.url" 
                    class="upload-preview-image"
                  />
                  <div v-else class="upload-placeholder">
                    <span class="icon">📤</span>
                    <span>上传正面图片</span>
                    <span class="note">将生成侧面图和背面图</span>
                  </div>
                </div>
              </label>
              <c-button v-if="tvFrontImage" mt-3 round size="small" @click="clearTvImage">
                清除图片
              </c-button>
            </c-card>
          </n-gi>

          <n-gi>
            <c-card h-full>
              <div class="section-label">生成参数</div>
              <c-select 
                v-model:value="tvModel" 
                label="模型选择:" 
                :options="modelOptions"
                label-position="left"
                label-width="80px"
                mb-4
              />
              <div class="info-card">
                基于正面图片，自动生成立面图（侧面）和侧面图（背面），适用于角色设计、服装展示等场景。
              </div>
              <c-button type="primary" block round :loading="tvGenerating" @click="generateTv">
                生成三视图
              </c-button>
            </c-card>
          </n-gi>

          <n-gi>
            <c-card h-full>
              <div class="section-label">生成结果</div>
              <div class="result-area">
                <div v-if="tvResult.length === 0" class="result-placeholder">
                  <div class="placeholder-icon">📐</div>
                  <div class="placeholder-title">等待生成</div>
                </div>
                <div v-else class="result-grid three-col">
                  <img v-for="(img, idx) in tvResult" :key="idx" :src="img" class="result-item" />
                </div>
              </div>
            </c-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>

      <!-- 多视角生成 -->
      <n-tab-pane name="multi-angle" tab="多视角生成">
        <n-grid x-gap="16" y-gap="16" cols="1 800:3">
          <n-gi>
            <c-card h-full>
              <div class="section-label">参考图片</div>
              <label block>
                <input type="file" accept="image/*" @change="handleMvUpload" hidden />
                <div class="upload-slot landscape">
                  <img 
                    v-if="mvInputImage" 
                    :src="mvInputImage.url" 
                    class="upload-preview-image"
                  />
                  <div v-else class="upload-placeholder">
                    <span class="icon">📤</span>
                    <span>上传参考图片</span>
                    <span class="note">将生成多个角度的视图</span>
                  </div>
                </div>
              </label>
              <c-button v-if="mvInputImage" mt-3 round size="small" @click="clearMvImage">
                清除图片
              </c-button>
            </c-card>
          </n-gi>

          <n-gi>
            <c-card h-full>
              <div class="section-label">生成参数</div>
              <c-select 
                v-model:value="mvModel" 
                label="模型选择:" 
                :options="modelOptions"
                label-position="left"
                label-width="80px"
                mb-3
              />
              <div mb-4>
                <div class="section-label">生成角度数: {{ mvAngleCount }}</div>
                <n-slider v-model:value="mvAngleCount" :min="2" :max="8" :step="1" />
              </div>
              <div class="info-card">
                基于单张图片，自动生成多角度视图（如正面、侧面、45度角等），适用于产品展示、角色设计等。
              </div>
              <c-button type="primary" block round :loading="mvGenerating" @click="generateMv">
                生成多视角
              </c-button>
            </c-card>
          </n-gi>

          <n-gi>
            <c-card h-full>
              <div class="section-label">生成结果</div>
              <div class="result-area">
                <div v-if="mvResult.length === 0" class="result-placeholder">
                  <div class="placeholder-icon">🔄</div>
                  <div class="placeholder-title">等待生成</div>
                </div>
                <div v-else class="result-grid three-col">
                  <img v-for="(img, idx) in mvResult" :key="idx" :src="img" class="result-item" />
                </div>
              </div>
            </c-card>
          </n-gi>
        </n-grid>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style lang="less" scoped>
.image-generator {
  width: 100%;
  position: relative;
}

.settings-trigger {
  position: absolute;
  top: -4px;
  right: 0;
  z-index: 10;
}

.settings-text {
  font-size: 13px;
}

.api-modal-content {
  padding: 8px 0;
}

.api-label {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--app-text);
}

.api-note {
  font-size: 12px;
  color: var(--app-muted);
  line-height: 1.5;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--app-text);
}

.section-note {
  font-size: 12px;
  color: var(--app-muted);
  margin-left: 8px;
  font-weight: 400;
}

.upload-area {
  border: 2px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
  padding: 32px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;

  &:hover {
    border-color: var(--app-primary);
    background: rgba(var(--app-primary-rgb), 0.05);
  }

  .upload-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .upload-tip {
    font-size: 12px;
    color: var(--app-muted);
    margin-top: 4px;
  }
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(128, 128, 128, 0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .order-badge {
    position: absolute;
    top: 4px;
    left: 4px;
    background: var(--app-primary);
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 600;
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.9);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.upload-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-slot {
  position: relative;
  border: 2px dashed rgba(128, 128, 128, 0.3);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: transparent;

  &:hover {
    border-color: var(--app-primary);
  }

  &.portrait {
    aspect-ratio: 3/4;
  }

  &.landscape {
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .upload-preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--app-muted);
    text-align: center;
    padding: 16px;

    .icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .note {
      font-size: 12px;
      margin-top: 6px;
      opacity: 0.7;
    }
  }

  .clear-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.9);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.result-area {
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-placeholder {
  text-align: center;
  color: var(--app-muted);

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  .placeholder-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--app-text);
    margin-bottom: 4px;
  }

  .placeholder-desc {
    font-size: 13px;
  }
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;

  &.three-col {
    grid-template-columns: repeat(3, 1fr);
  }
}

.result-image {
  max-width: 100%;
  max-height: 280px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.02);
  }

  &.single {
    max-height: 320px;
  }
}

.result-item {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

.summary-card {
  background: rgba(var(--app-primary-rgb, 59, 130, 246), 0.08);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;

  .summary-label {
    font-size: 12px;
    color: var(--app-muted);
    margin-bottom: 6px;
  }

  .summary-text {
    font-size: 14px;
    color: var(--app-text);
    line-height: 1.5;
  }
}

.info-card {
  background: rgba(var(--app-muted-rgb, 128), 0.08);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--app-muted);
  line-height: 1.6;
}

@media (max-width: 800px) {
  .image-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .result-grid {
    grid-template-columns: 1fr;

    &.three-col {
      grid-template-columns: 1fr;
    }
  }
}
</style>
