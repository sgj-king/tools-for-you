<script setup lang="ts">
import { useHead } from '@vueuse/head';
import { NIcon } from 'naive-ui';
import {
  IconBrandVue,
  IconBrandPython,
  IconBrandTypescript,
  IconBrandGithub,
  IconHeart,
  IconRocket,
  IconCode
} from '@tabler/icons-vue';

useHead({ title: '关于 - Tools For You' });
</script>

<template>
  <div class="about-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="content-wrapper">
      <!-- 标题区域 -->
      <div class="header-section">
        <div class="logo-icon">
          <span class="logo-emoji">🛠️</span>
        </div>
        <h1 class="page-title">关于 Tools For You</h1>
        <p class="page-subtitle">为你量身定制的智能工具大全</p>
      </div>

      <!-- 介绍卡片 -->
      <div class="intro-card">
        <div class="card-icon">
          <n-icon :component="IconHeart" size="24" />
        </div>
        <h2>项目介绍</h2>
        <p>
          Tools For You 是一个 AI 驱动的工具推荐平台，致力于帮助用户快速找到合适的在线工具。
          无论你是学生、职场人还是开发者，都能在这里找到提升效率的利器。
        </p>
        <p>
          我们整合了 80+ 实用工具，涵盖加密解密、格式转换、开发调试、网络工具等多个领域，
          并通过 AI 智能推荐，让找工具变得简单高效。
        </p>
      </div>

      <!-- 功能特性 -->
      <div class="features-section">
        <h2>
          <n-icon :component="IconRocket" size="20" />
          核心功能
        </h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🤖</div>
            <div class="feature-content">
              <h3>AI 智能推荐</h3>
              <p>描述你的需求，AI 帮你找到最合适的工具</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔧</div>
            <div class="feature-content">
              <h3>80+ 实用工具</h3>
              <p>加密、转换、开发、网络工具一应俱全</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🌍</div>
            <div class="feature-content">
              <h3>多语言支持</h3>
              <p>支持中文、英文等 9 种语言</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🌙</div>
            <div class="feature-content">
              <h3>暗色模式</h3>
              <p>护眼的深色主题，保护你的眼睛</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 技术栈 -->
      <div class="tech-section">
        <h2>
          <n-icon :component="IconCode" size="20" />
          技术栈
        </h2>
        <div class="tech-cards">
          <div class="tech-card">
            <n-icon :component="IconBrandVue" size="32" color="#42b883" />
            <div class="tech-info">
              <h3>Vue 3</h3>
              <p>前端框架</p>
            </div>
          </div>
          <div class="tech-card">
            <n-icon :component="IconBrandTypescript" size="32" color="#3178c6" />
            <div class="tech-info">
              <h3>TypeScript</h3>
              <p>类型安全</p>
            </div>
          </div>
          <div class="tech-card">
            <n-icon :component="IconBrandPython" size="32" color="#3776ab" />
            <div class="tech-info">
              <h3>FastAPI</h3>
              <p>后端框架</p>
            </div>
          </div>
          <div class="tech-card">
            <div class="tech-icon-text ai">AI</div>
            <div class="tech-info">
              <h3>NVIDIA NIM</h3>
              <p>AI 接口 (GLM-5)</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 作者信息 -->
      <div class="author-section">
        <h2>👨‍💻 作者</h2>
        <div class="author-card">
          <img src="/head.jpg" alt="作者头像" class="author-avatar" />
          <div class="author-info">
            <h3>熵寂...半曲终</h3>
            <p class="author-role">Tools For You 开发者</p>
            <router-link to="/contact" class="contact-link">
              📧 联系作者
            </router-link>
          </div>
        </div>
      </div>

      <!-- 相关链接 -->
      <div class="links-section">
        <h2>
          <n-icon :component="IconBrandGithub" size="20" />
          相关链接
        </h2>
        <div class="links-grid">
          <a href="https://github.com/sgj-king/tools-for-you" target="_blank" rel="noopener" class="link-card">
            <n-icon :component="IconBrandGithub" size="24" />
            <span>GitHub 仓库</span>
          </a>
          <a href="https://github.com/sgj-king/tools-for-you/issues" target="_blank" rel="noopener" class="link-card">
            <span>💡</span>
            <span>提交建议</span>
          </a>
          <router-link to="/contact" class="link-card">
            <span>👤</span>
            <span>联系作者</span>
          </router-link>
        </div>
      </div>

      <!-- 底部 -->
      <div class="footer-note">
        <p>Made with ❤️ by 熵寂...半曲终</p>
        <p class="copyright">© 2026 Tools For You. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100vh;
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
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.25;
}

.circle-1 {
  width: 500px;
  height: 500px;
  background: var(--app-accent);
  top: -150px;
  right: -100px;
}

.circle-2 {
  width: 400px;
  height: 400px;
  background: #ffd700;
  bottom: -100px;
  left: -100px;
}

/* 内容 */
.content-wrapper {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

/* 标题 */
.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--app-surface);
  border-radius: 20px;
  box-shadow: var(--app-shadow-soft);
  margin-bottom: 20px;
}

.logo-emoji {
  font-size: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--app-text);
  margin: 0 0 8px;
}

.page-subtitle {
  font-size: 16px;
  color: var(--app-muted);
  margin: 0;
}

/* 卡片样式 */
.intro-card,
.features-section,
.tech-section,
.author-section,
.links-section {
  background: var(--app-surface);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
}

.intro-card .card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(30, 139, 119, 0.1);
  border-radius: 12px;
  color: var(--app-accent);
  margin-bottom: 16px;
}

.intro-card h2,
.features-section h2,
.tech-section h2,
.author-section h2,
.links-section h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 16px;
}

.intro-card p {
  font-size: 15px;
  color: var(--app-text);
  line-height: 1.7;
  margin: 0;
}

.intro-card p + p {
  margin-top: 12px;
}

/* 功能特性 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.feature-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--app-surface-2);
  border-radius: 12px;
  transition: transform 0.2s;
}

.feature-item:hover {
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 28px;
}

.feature-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 4px;
}

.feature-content p {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0;
}

/* 技术栈 */
.tech-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.tech-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--app-surface-2);
  border-radius: 12px;
  text-align: center;
}

.tech-icon-text {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.tech-icon-text.ai {
  background: linear-gradient(135deg, #76b900, #8bc34a);
  color: white;
}

.tech-info h3 {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0;
}

.tech-info p {
  font-size: 11px;
  color: var(--app-muted);
  margin: 0;
}

/* 作者 */
.author-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.author-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--app-accent);
}

.author-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text);
  margin: 0 0 4px;
}

.author-role {
  font-size: 14px;
  color: var(--app-muted);
  margin: 0 0 12px;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--app-accent);
  color: white;
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
  transition: all 0.2s;
}

.contact-link:hover {
  background: var(--app-accent-strong);
}

/* 链接 */
.links-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.link-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: var(--app-surface-2);
  border-radius: 12px;
  text-decoration: none;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.link-card:hover {
  background: var(--app-accent);
  color: white;
}

/* 底部 */
.footer-note {
  text-align: center;
  padding: 32px 0;
}

.footer-note p {
  font-size: 14px;
  color: var(--app-muted);
  margin: 0;
}

.footer-note .copyright {
  font-size: 12px;
  margin-top: 8px;
}

/* 响应式 */
@media (max-width: 640px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .tech-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .links-grid {
    grid-template-columns: 1fr;
  }
  
  .author-card {
    flex-direction: column;
    text-align: center;
  }
  
  .page-title {
    font-size: 24px;
  }
}

/* 暗色模式 */
.dark .circle {
  opacity: 0.15;
}
</style>
