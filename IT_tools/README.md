# Tools For You

<p align="center">
  <strong>为你量身定制的智能工具大全</strong>
</p>

<p align="center">
  AI 驱动的工具推荐平台，帮助学生、职场人和开发者快速找到合适的工具
</p>

---

## ✨ 功能特性

- 🤖 **AI 智能推荐** - 描述你的需求，AI 帮你找到最合适的工具
- 🔧 **80+ 实用工具** - 涵盖加密、转换、开发、网络等多个领域
- 🌍 **多语言支持** - 支持中文、英文等 9 种语言
- 🌙 **暗色模式** - 护眼的深色主题
- 📱 **响应式设计** - 完美适配桌面和移动设备

---

## 🚀 快速开始

### 前端

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 生产构建
pnpm build
```

### 后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的配置（AI_API_KEY 等）

# 启动服务
uvicorn app.main:app --reload --port 8000
```

---

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Naive UI 组件库
- Vite 构建工具
- Vue Router + Pinia

### 后端
- Python + FastAPI
- SQLAlchemy ORM
- NVIDIA NIM (GLM-5) AI 接口

---

## 📁 项目结构

```
tools-for-you/
├── src/                    # 前端源码
│   ├── components/         # 公共组件
│   │   └── AIChat.vue     # AI 对话组件
│   ├── pages/             # 页面
│   │   └── HomeNew.page.vue  # 新首页
│   ├── tools/             # 工具组件
│   └── types/             # TypeScript 类型
│
└── backend/               # 后端源码
    └── app/
        ├── api/           # API 端点
        ├── models/        # 数据库模型
        ├── schemas/       # Pydantic 模型
        └── services/      # 业务逻辑
```

---

## 🔗 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/tools` | GET | 获取工具列表 |
| `/api/tools/search` | GET | 搜索工具 |
| `/api/tools/{slug}` | GET | 获取工具详情 |
| `/api/chat` | POST | AI 对话推荐 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |

---

## 🗺️ 开发路线

- [x] 基础工具集合
- [x] AI 对话推荐
- [x] 新首页设计
- [ ] 用户系统完善
- [ ] VIP 会员功能
- [ ] GitHub 工具自动同步
- [ ] 微信小程序版本

---

## 📞 联系方式

- GitHub: https://github.com/sgj-king/tools-for-you
- Issues: https://github.com/sgj-king/tools-for-you/issues

---

<p align="center">
  Made with ❤️ by sgj-king
</p>
