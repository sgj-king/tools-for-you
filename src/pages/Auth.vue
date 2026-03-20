<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHead } from '@vueuse/head';
import { NCard, NTabs, NTabPane, NForm, NFormItem, NInput, NButton, NAlert, NIcon } from 'naive-ui';
import { IconUser, IconMail, IconPhone, IconLock, IconEye, IconEyeOff } from '@tabler/icons-vue';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

useHead({
  title: '登录注册 - Tools For You'
});

// 当前标签
const currentTab = ref<'login' | 'register'>('login');

// 登录表单
const loginForm = ref({
  account: '',
  password: ''
});

// 注册表单
const registerForm = ref({
  username: '',
  account: '',
  password: '',
  confirmPassword: ''
});

// 显示密码
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// 错误提示
const errorMsg = computed(() => authStore.error);

// 登录
async function handleLogin() {
  const success = await authStore.login(loginForm.value);
  if (success) {
    // 重定向到之前的页面或主页
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  }
}

// 注册
async function handleRegister() {
  const success = await authStore.register(registerForm.value);
  if (success) {
    // 注册成功后自动跳转
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  }
}

// 切换标签
function switchTab(tab: 'login' | 'register') {
  currentTab.value = tab;
  authStore.error = null;
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Logo -->
      <div class="auth-logo">
        <h1>TOOLS FOR YOU</h1>
        <p>实用工具集合</p>
      </div>

      <!-- 认证卡片 -->
      <n-card class="auth-card" :bordered="false">
        <n-tabs v-model:value="currentTab" type="line" justify-content="space-evenly">
          <!-- 登录标签 -->
          <n-tab-pane name="login" tab="登录">
            <n-form @submit.prevent="handleLogin">
              <!-- 错误提示 -->
              <n-alert
                v-if="errorMsg && currentTab === 'login'"
                type="error"
                :title="errorMsg"
                class="error-alert"
                closable
                @close="authStore.error = null"
              />

              <!-- 账号 -->
              <n-form-item label="邮箱 / 手机号">
                <n-input
                  v-model:value="loginForm.account"
                  placeholder="请输入邮箱或手机号"
                  size="large"
                  clearable
                >
                  <template #prefix>
                    <n-icon :component="IconUser" />
                  </template>
                </n-input>
              </n-form-item>

              <!-- 密码 -->
              <n-form-item label="密码">
                <n-input
                  v-model:value="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  size="large"
                  clearable
                  @keyup.enter="handleLogin"
                >
                  <template #prefix>
                    <n-icon :component="IconLock" />
                  </template>
                  <template #suffix>
                    <n-icon
                      :component="showPassword ? IconEyeOff : IconEye"
                      @click="showPassword = !showPassword"
                      style="cursor: pointer"
                    />
                  </template>
                </n-input>
              </n-form-item>

              <!-- 登录按钮 -->
              <n-button
                type="primary"
                size="large"
                block
                :loading="authStore.loading"
                :disabled="!loginForm.account || !loginForm.password"
                @click="handleLogin"
              >
                登录
              </n-button>

              <!-- 提示 -->
              <div class="auth-footer">
                <span>还没有账号？</span>
                <a @click="switchTab('register')">立即注册</a>
              </div>
            </n-form>
          </n-tab-pane>

          <!-- 注册标签 -->
          <n-tab-pane name="register" tab="注册">
            <n-form @submit.prevent="handleRegister">
              <!-- 错误提示 -->
              <n-alert
                v-if="errorMsg && currentTab === 'register'"
                type="error"
                :title="errorMsg"
                class="error-alert"
                closable
                @close="authStore.error = null"
              />

              <!-- 用户名 -->
              <n-form-item label="用户名">
                <n-input
                  v-model:value="registerForm.username"
                  placeholder="请输入用户名"
                  size="large"
                  clearable
                >
                  <template #prefix>
                    <n-icon :component="IconUser" />
                  </template>
                </n-input>
              </n-form-item>

              <!-- 账号（邮箱/手机号） -->
              <n-form-item label="邮箱 / 手机号">
                <n-input
                  v-model:value="registerForm.account"
                  placeholder="请输入邮箱或手机号"
                  size="large"
                  clearable
                >
                  <template #prefix>
                    <n-icon :component="registerForm.account.includes('@') ? IconMail : IconPhone" />
                  </template>
                </n-input>
              </n-form-item>

              <!-- 密码 -->
              <n-form-item label="密码">
                <n-input
                  v-model:value="registerForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码（至少6位）"
                  size="large"
                  clearable
                >
                  <template #prefix>
                    <n-icon :component="IconLock" />
                  </template>
                  <template #suffix>
                    <n-icon
                      :component="showPassword ? IconEyeOff : IconEye"
                      @click="showPassword = !showPassword"
                      style="cursor: pointer"
                    />
                  </template>
                </n-input>
              </n-form-item>

              <!-- 确认密码 -->
              <n-form-item label="确认密码">
                <n-input
                  v-model:value="registerForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="请再次输入密码"
                  size="large"
                  clearable
                  @keyup.enter="handleRegister"
                >
                  <template #prefix>
                    <n-icon :component="IconLock" />
                  </template>
                  <template #suffix>
                    <n-icon
                      :component="showConfirmPassword ? IconEyeOff : IconEye"
                      @click="showConfirmPassword = !showConfirmPassword"
                      style="cursor: pointer"
                    />
                  </template>
                </n-input>
              </n-form-item>

              <!-- 注册按钮 -->
              <n-button
                type="primary"
                size="large"
                block
                :loading="authStore.loading"
                :disabled="!registerForm.username || !registerForm.account || !registerForm.password || !registerForm.confirmPassword"
                @click="handleRegister"
              >
                注册
              </n-button>

              <!-- 提示 -->
              <div class="auth-footer">
                <span>已有账号？</span>
                <a @click="switchTab('login')">立即登录</a>
              </div>
            </n-form>
          </n-tab-pane>
        </n-tabs>
      </n-card>

      <!-- 返回主页 -->
      <div class="back-home">
        <router-link to="/">← 返回主页</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--app-bg);
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-logo {
  text-align: center;
  margin-bottom: 32px;
}

.auth-logo h1 {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.15em;
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--app-accent), #35c9a0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-logo p {
  color: var(--app-muted);
  font-size: 14px;
  margin: 0;
}

.auth-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.auth-card ::v-deep(.n-card__content) {
  padding: 32px 24px;
}

.error-alert {
  margin-bottom: 16px;
}

.auth-card ::v-deep(.n-form-item) {
  margin-bottom: 20px;
}

.auth-card ::v-deep(.n-form-item-label) {
  font-weight: 500;
}

.auth-card ::v-deep(.n-button) {
  margin-top: 8px;
  height: 44px;
  font-size: 15px;
  border-radius: 12px;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: var(--app-muted);
}

.auth-footer a {
  color: var(--app-accent);
  cursor: pointer;
  text-decoration: none;
  margin-left: 4px;
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.back-home {
  text-align: center;
  margin-top: 24px;
}

.back-home a {
  color: var(--app-muted);
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s;
}

.back-home a:hover {
  color: var(--app-accent);
}

/* Dark mode */
.dark .auth-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
</style>
