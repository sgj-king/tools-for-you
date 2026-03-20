<script setup lang="ts">
import { useHead } from '@vueuse/head';
import { NIcon } from 'naive-ui';
import { IconBrandWechat, IconQrcode, IconMail, IconUser } from '@tabler/icons-vue';

useHead({ title: '作者联系方式 - Tools For You' });

// 复制微信号
function copyWechatId() {
  navigator.clipboard.writeText('WZ_QWER1249639544SGJ');
  alert('微信号已复制到剪贴板！');
}
</script>

<template>
  <div class="contact-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="grid-pattern"></div>
    </div>

    <!-- 主内容卡片 -->
    <div class="contact-card">
      <!-- 顶部装饰条 -->
      <div class="card-top-bar"></div>
      
      <!-- 头像区域 -->
      <div class="avatar-section">
        <div class="avatar-ring">
          <img src="/head.jpg" alt="作者头像" class="avatar-img" />
        </div>
        <div class="online-dot"></div>
      </div>

      <!-- 作者信息 -->
      <div class="author-info">
        <h1 class="author-name">熵寂...半曲终</h1>
        <p class="author-title">Tools For You 作者</p>
        <p class="author-bio">专注于打造高效实用的工具平台</p>
      </div>

      <!-- 分隔线 -->
      <div class="divider">
        <span class="divider-dot"></span>
      </div>

      <!-- 联系方式 -->
      <div class="contact-section">
        <h2 class="section-title">
          <n-icon :component="IconBrandWechat" size="20" />
          微信联系
        </h2>
        
        <!-- 二维码 -->
        <div class="qrcode-wrapper">
          <div class="qrcode-frame">
            <img src="/Myweixin.jpg" alt="微信二维码" class="qrcode-img" />
          </div>
          <p class="qrcode-hint">扫描二维码添加微信</p>
        </div>

        <!-- 微信号 -->
        <div class="wechat-id-box">
          <span class="label">微信号</span>
          <div class="id-content">
            <code class="wechat-id">WZ_QWER1249639544SGJ</code>
            <button class="copy-btn" @click="copyWechatId">
              <n-icon :component="IconQrcode" size="16" />
              复制
            </button>
          </div>
        </div>
      </div>

      <!-- 底部装饰 -->
      <div class="card-footer">
        <div class="footer-icons">
          <div class="icon-item">
            <n-icon :component="IconUser" size="18" />
            <span>开发者</span>
          </div>
          <div class="icon-item">
            <n-icon :component="IconBrandWechat" size="18" />
            <span>微信</span>
          </div>
          <div class="icon-item">
            <n-icon :component="IconMail" size="18" />
            <span>联系</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回按钮 -->
    <router-link to="/" class="back-btn">
      ← 返回首页
    </router-link>
  </div>
</template>

<style scoped>
.contact-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
  background: var(--app-bg);
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: var(--app-accent);
  top: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: #ffd700;
  bottom: -50px;
  left: -50px;
  animation: float 6s ease-in-out infinite reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: #ff6b6b;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 4s ease-in-out infinite;
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(var(--app-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--app-border) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 30px); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
}

/* 主卡片 */
.contact-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: var(--app-surface);
  border-radius: 24px;
  box-shadow: var(--app-shadow);
  border: 1px solid var(--app-border);
  overflow: hidden;
}

.card-top-bar {
  height: 6px;
  background: linear-gradient(90deg, var(--app-accent), #35c9a0, #ffd700);
}

/* 头像区域 */
.avatar-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  position: relative;
}

.avatar-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, var(--app-accent), #ffd700);
  box-shadow: 0 8px 32px rgba(30, 139, 119, 0.3);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--app-surface);
}

.online-dot {
  position: absolute;
  bottom: 8px;
  right: calc(50% - 44px);
  width: 20px;
  height: 20px;
  background: #22c55e;
  border-radius: 50%;
  border: 3px solid var(--app-surface);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

/* 作者信息 */
.author-info {
  text-align: center;
  padding: 24px 20px 16px;
}

.author-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0;
  letter-spacing: 0.02em;
}

.author-title {
  font-size: 14px;
  color: var(--app-accent);
  margin: 8px 0 4px;
  font-weight: 500;
}

.author-bio {
  font-size: 14px;
  color: var(--app-muted);
  margin: 0;
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 24px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--app-border);
}

.divider-dot {
  width: 8px;
  height: 8px;
  background: var(--app-accent);
  border-radius: 50%;
  margin: 0 12px;
}

/* 联系方式 */
.contact-section {
  padding: 16px 24px 24px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 20px;
}

/* 二维码 */
.qrcode-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.qrcode-frame {
  padding: 12px;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
  border-radius: 16px;
  border: 1px solid var(--app-border);
  transition: transform 0.3s ease;
}

.qrcode-frame:hover {
  transform: scale(1.05);
}

.qrcode-img {
  width: 180px;
  height: 180px;
  border-radius: 8px;
  display: block;
}

.qrcode-hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--app-muted);
}

/* 微信号 */
.wechat-id-box {
  background: var(--app-surface-2);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.wechat-id-box .label {
  display: block;
  font-size: 12px;
  color: var(--app-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.id-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wechat-id {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
  background: var(--app-surface);
  padding: 8px 12px;
  border-radius: 8px;
  flex: 1;
  font-family: monospace;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: var(--app-accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: var(--app-accent-strong);
  transform: translateY(-1px);
}

/* 底部 */
.card-footer {
  border-top: 1px solid var(--app-border);
  padding: 16px 24px;
  background: var(--app-surface-2);
}

.footer-icons {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--app-muted);
  font-size: 12px;
}

/* 返回按钮 */
.back-btn {
  position: relative;
  z-index: 1;
  margin-top: 24px;
  padding: 12px 24px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  color: var(--app-text);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: var(--app-accent);
  color: var(--app-accent);
  transform: translateY(-2px);
}

/* 暗色模式 */
.dark .qrcode-frame {
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
}

.dark .circle-1 {
  opacity: 0.25;
}

.dark .circle-2 {
  opacity: 0.2;
}

.dark .circle-3 {
  opacity: 0.15;
}

/* 响应式 */
@media (max-width: 480px) {
  .contact-card {
    margin: 0 8px;
    border-radius: 20px;
  }
  
  .avatar-ring {
    width: 100px;
    height: 100px;
  }
  
  .qrcode-img {
    width: 150px;
    height: 150px;
  }
  
  .author-name {
    font-size: 24px;
  }
}
</style>
