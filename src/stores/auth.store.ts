import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

interface LoginForm {
  account: string; // 可以是邮箱或手机号
  password: string;
}

interface RegisterForm {
  username: string;
  account: string; // 可以是邮箱或手机号
  password: string;
  confirmPassword: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isLoggedIn = computed(() => !!user.value && !!token.value);
  const username = computed(() => user.value?.username || '');

  // 初始化 - 从localStorage读取
  function init() {
    const storedUser = localStorage.getItem('auth_user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedUser && storedToken) {
      try {
        user.value = JSON.parse(storedUser);
        token.value = storedToken;
      } catch (e) {
        logout();
      }
    }
  }

  // 登录
  async function login(form: LoginForm) {
    loading.value = true;
    error.value = null;

    try {
      // 模拟API调用 - 实际项目中应该调用后端API
      await new Promise(resolve => setTimeout(resolve, 800));

      // 从localStorage获取用户数据
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
      
      // 查找用户
      const foundUser = users.find((u: any) => 
        (u.email === form.account || u.phone === form.account) && 
        u.password === form.password // 实际项目应该使用bcrypt对比
      );

      if (!foundUser) {
        throw new Error('账号或密码错误');
      }

      // 生成token
      const authToken = btoa(`${foundUser.id}:${Date.now()}`);
      
      user.value = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        phone: foundUser.phone,
        createdAt: foundUser.createdAt
      };
      token.value = authToken;

      // 保存到localStorage
      localStorage.setItem('auth_user', JSON.stringify(user.value));
      localStorage.setItem('auth_token', authToken);

      return true;
    } catch (e: any) {
      error.value = e.message || '登录失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  // 注册
  async function register(form: RegisterForm) {
    loading.value = true;
    error.value = null;

    try {
      // 验证
      if (form.password !== form.confirmPassword) {
        throw new Error('两次密码不一致');
      }

      if (form.password.length < 6) {
        throw new Error('密码至少6位');
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));

      // 获取已注册用户
      const users = JSON.parse(localStorage.getItem('registered_users') || '[]');

      // 检查账号是否已存在
      const accountType = form.account.includes('@') ? 'email' : 'phone';
      const exists = users.some((u: any) => u[accountType] === form.account);
      
      if (exists) {
        throw new Error('该账号已被注册');
      }

      // 创建新用户
      const newUser = {
        id: Date.now().toString(),
        username: form.username,
        email: accountType === 'email' ? form.account : undefined,
        phone: accountType === 'phone' ? form.account : undefined,
        password: form.password, // 实际项目应该使用bcrypt加密
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('registered_users', JSON.stringify(users));

      // 自动登录
      const authToken = btoa(`${newUser.id}:${Date.now()}`);
      user.value = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        createdAt: newUser.createdAt
      };
      token.value = authToken;

      localStorage.setItem('auth_user', JSON.stringify(user.value));
      localStorage.setItem('auth_token', authToken);

      return true;
    } catch (e: any) {
      error.value = e.message || '注册失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  // 登出
  function logout() {
    user.value = null;
    token.value = null;
    error.value = null;
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }

  // 初始化
  init();

  return {
    user,
    token,
    loading,
    error,
    isLoggedIn,
    username,
    login,
    register,
    logout,
    init
  };
});
