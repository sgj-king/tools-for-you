# IT Tools Hub - 项目结构说明

## 项目概述

基于 it-tools 项目改造的智能工具目录网站，新增 AI 推荐功能。

## 目录结构

```
IT_tools/
├── src/                          # 前端源码 (Vue 3)
│   ├── components/
│   │   └── AIChat.vue           # AI 对话组件 (新增)
│   ├── pages/
│   │   ├── Home.page.vue        # 原首页
│   │   └── HomeNew.page.vue     # 新首页 (新增)
│   └── types/
│       └── index.ts             # TypeScript 类型定义 (新增)
│
└── backend/                      # 后端源码 (FastAPI)
    ├── app/
    │   ├── api/
    │   │   ├── tools.py         # 工具 API
    │   │   ├── chat.py          # AI 聊天 API
    │   │   └── auth.py          # 认证 API
    │   ├── models/
    │   │   └── models.py        # 数据库模型
    │   ├── schemas/
    │   │   └── schemas.py       # Pydantic schemas
    │   ├── services/
    │   │   ├── ai_service.py    # AI 服务
    │   │   └── tool_service.py  # 工具服务
    │   └── core/
    │       ├── config.py        # 配置
    │       ├── database.py      # 数据库
    │       └── security.py      # 安全工具
    ├── requirements.txt
    └── .env.example
```

## 数据库设计

### 核心表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| tools | 工具表 |
| categories | 分类表 |
| tags | 标签表 |
| tool_usage_logs | 使用日志 |
| chat_messages | AI 聊天记录 |
| vip_subscriptions | VIP 订阅 |

### 关系

- User ↔ Tool: 多对多（收藏）
- Tool ↔ Category: 多对一
- Tool ↔ Tag: 多对多
- User ↔ ChatMessage: 一对多

## 快速开始

### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的配置

# 启动
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
# 项目根目录
pnpm install
pnpm dev
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/tools` | GET | 获取工具列表 |
| `/api/tools/search` | GET | 搜索工具 |
| `/api/tools/{slug}` | GET | 获取工具详情 |
| `/api/tools/categories/all` | GET | 获取所有分类 |
| `/api/chat` | POST | AI 对话 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |

## 下一步

1. 初始化数据库和测试数据
2. 配置 GitHub API 同步
3. 实现 VIP 支付功能
4. 优化 AI 推荐效果
