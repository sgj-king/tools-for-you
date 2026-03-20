<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { NInput, NButton, NSpin, NCard, NIcon, NAvatar, NEmpty } from 'naive-ui';
import { IconSend, IconRobot, IconUser, IconX, IconMessageCircle } from '@tabler/icons-vue';
import type { ToolRecommendation } from '../types';

// Props
const props = defineProps<{
  apiBaseUrl?: string;
}>();

// State
const isOpen = ref(false);
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string; tools?: ToolRecommendation[] }>>([]);
const inputMessage = ref('');
const isLoading = ref(false);
const sessionId = ref<string | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);

// API URL
const apiUrl = computed(() => props.apiBaseUrl || 'http://localhost:8000/api');

// Toggle chat
function toggleChat() {
  isOpen.value = !isOpen.value;
  if (isOpen.value && messages.value.length === 0) {
    messages.value.push({
      role: 'assistant',
      content: '你好！我是 AI 工具助手。告诉我你需要什么工具，我会帮你推荐。比如：\n\n• "帮我找一个能批量重命名文件的工具"\n• "我需要转换 PDF 格式"\n• "有没有正则表达式测试工具？"'
    });
  }
}

// Send message
async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) return;

  const userMessage = inputMessage.value.trim();
  inputMessage.value = '';

  // Add user message
  messages.value.push({ role: 'user', content: userMessage });

  isLoading.value = true;

  try {
    const response = await fetch(`${apiUrl.value}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        session_id: sessionId.value
      })
    });

    if (!response.ok) throw new Error('Failed to get response');

    const data = await response.json();
    
    sessionId.value = data.session_id;
    
    messages.value.push({
      role: 'assistant',
      content: data.message,
      tools: data.recommended_tools || []
    });

    // Scroll to bottom
    await nextTick();
    scrollToBottom();

  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后再试。'
    });
  } finally {
    isLoading.value = false;
  }
}

// Scroll to bottom of messages
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// Navigate to tool
function goToTool(slug: string) {
  window.location.href = `/tool/${slug}`;
}

// Close on escape
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
</script>

<template>
  <!-- Floating button -->
  <div
    class="ai-chat-trigger"
    :class="{ 'is-open': isOpen }"
    @click="toggleChat"
  >
    <n-icon :component="IconX" size="24" v-if="isOpen" />
    <n-icon :component="IconMessageCircle" size="24" v-else />
  </div>

  <!-- Chat window -->
  <transition name="chat-slide">
    <div v-if="isOpen" class="ai-chat-window">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-title">
          <n-icon :component="IconRobot" size="20" />
          <span>AI 工具助手</span>
        </div>
        <button class="close-btn" @click="isOpen = false">
          <n-icon :component="IconX" size="18" />
        </button>
      </div>

      <!-- Messages -->
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message"
          :class="msg.role"
        >
          <div class="message-avatar">
            <n-avatar
              v-if="msg.role === 'assistant'"
              round
              size="small"
              :style="{ background: 'var(--app-accent)' }"
            >
              <n-icon :component="IconRobot" size="16" />
            </n-avatar>
            <n-avatar v-else round size="small" color="#6b7570">
              <n-icon :component="IconUser" size="16" />
            </n-avatar>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="msg.content.replace(/\n/g, '<br>')"></div>
            
            <!-- Recommended tools -->
            <div v-if="msg.tools && msg.tools.length > 0" class="recommended-tools">
              <div class="tools-label">推荐工具：</div>
              <div class="tools-grid">
                <div
                  v-for="tool in msg.tools"
                  :key="tool.id"
                  class="tool-card"
                  @click="goToTool(tool.slug)"
                >
                  <div class="tool-icon">{{ tool.icon || '🔧' }}</div>
                  <div class="tool-info">
                    <div class="tool-name">{{ tool.name }}</div>
                    <div class="tool-desc">{{ tool.description?.slice(0, 50) }}...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="message assistant">
          <div class="message-avatar">
            <n-avatar round size="small" :style="{ background: 'var(--app-accent)' }">
              <n-icon :component="IconRobot" size="16" />
            </n-avatar>
          </div>
          <div class="message-content">
            <n-spin size="small" />
            <span style="margin-left: 8px; color: var(--app-muted)">思考中...</span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input">
        <n-input
          v-model:value="inputMessage"
          type="textarea"
          placeholder="描述你需要的工具..."
          :autosize="{ minRows: 1, maxRows: 3 }"
          @keydown="handleKeydown"
          :disabled="isLoading"
        />
        <n-button
          type="primary"
          circle
          :disabled="!inputMessage.trim() || isLoading"
          @click="sendMessage"
        >
          <template #icon>
            <n-icon :component="IconSend" />
          </template>
        </n-button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.ai-chat-trigger {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--app-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--app-shadow);
  transition: all 0.3s ease;
  z-index: 1000;
}

.ai-chat-trigger:hover {
  transform: scale(1.1);
  background: var(--app-accent-strong);
}

.ai-chat-trigger.is-open {
  background: #f5f5f5;
  color: #333;
}

.ai-chat-window {
  position: fixed;
  right: 24px;
  bottom: 96px;
  width: 380px;
  max-width: calc(100vw - 48px);
  height: 520px;
  max-height: calc(100vh - 120px);
  background: var(--app-surface);
  border-radius: 16px;
  box-shadow: var(--app-shadow);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border: 1px solid var(--app-border);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-surface-2);
  border-radius: 16px 16px 0 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--app-text);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--app-muted);
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--app-text);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  gap: 10px;
  max-width: 90%;
}

.message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-content {
  background: var(--app-surface-2);
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
}

.message.user .message-content {
  background: var(--app-accent);
  color: white;
  border-radius: 14px 4px 14px 14px;
}

.message.assistant .message-content {
  background: var(--app-surface-2);
  border-radius: 4px 14px 14px 14px;
}

.message-text {
  white-space: pre-wrap;
}

.recommended-tools {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--app-border);
}

.tools-label {
  font-size: 12px;
  color: var(--app-muted);
  margin-bottom: 8px;
}

.tools-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--app-surface);
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid var(--app-border);
  transition: all 0.2s;
}

.tool-card:hover {
  border-color: var(--app-accent);
  background: rgba(30, 139, 119, 0.05);
}

.tool-icon {
  font-size: 20px;
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-weight: 500;
  font-size: 13px;
  color: var(--app-text);
}

.tool-desc {
  font-size: 12px;
  color: var(--app-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--app-border);
  background: var(--app-surface-2);
  border-radius: 0 0 16px 16px;
}

.chat-input .n-input {
  flex: 1;
}

/* Transitions */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s ease;
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Dark mode */
.dark .ai-chat-window {
  background: var(--app-surface);
}

.dark .message.user .message-content {
  background: var(--app-accent);
}

.dark .tool-card:hover {
  background: rgba(53, 201, 160, 0.1);
}

/* Mobile */
@media (max-width: 480px) {
  .ai-chat-window {
    right: 12px;
    bottom: 80px;
    width: calc(100vw - 24px);
    height: calc(100vh - 140px);
  }

  .ai-chat-trigger {
    right: 12px;
    bottom: 12px;
    width: 48px;
    height: 48px;
  }
}
</style>
