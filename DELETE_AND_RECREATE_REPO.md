# GitHub 仓库删除并重新创建指南

## 🎯 目标
完全删除 GitHub 上的 `sgj-king/tools-for-you` 仓库，并重新上传全新的代码。

## 📋 操作步骤

### 方法一：通过 GitHub 网页操作（推荐）

#### 步骤 1: 删除现有仓库
1. 访问：https://github.com/sgj-king/tools-for-you/settings
2. 滚动到页面底部的 "Danger Zone" 区域
3. 点击 "Delete this repository"
4. 输入仓库名称确认：`sgj-king/tools-for-you`
5. 点击 "I understand the consequences, delete this repository"

#### 步骤 2: 创建新仓库
在本地执行以下命令：

```bash
# 进入项目目录
cd /home/sgj/pyproject/IT_tools

# 创建新的初始提交
git checkout --orphan new-main
git add -A
git commit -m "feat: Initial commit - Tools For You 完整重构版

功能特性：
- ✅ 无侧边栏的全宽布局设计
- ✅ 用户认证系统（登录/注册）
- ✅ 10个工具分类完整展示
- ✅ 分类列表页面
- ✅ 多语言支持（9种语言）
- ✅ 86个实用工具
- ✅ 响应式设计
- ✅ 暗色模式支持"

# 替换主分支
git branch -D main
git branch -m main

# 在 GitHub 上创建新仓库
gh repo create tools-for-you --public --description "为每个人打造的智能工具集" --source=. --remote=origin

# 推送代码
git push -u origin main
```

### 方法二：通过命令行操作（需要权限）

如果需要通过命令行删除，首先需要添加删除权限：

```bash
# 添加删除仓库权限
gh auth refresh -h github.com -s delete_repo

# 然后执行删除
gh repo delete sgj-king/tools-for-you --confirm

# 创建新仓库并推送
gh repo create tools-for-you --public --source=. --push
```

## 🔧 当前状态

### 本地代码已准备就绪
- ✅ 所有修改已提交到本地 Git
- ✅ 最新提交：`feat: 完整重构 - 移除侧边栏、添加用户认证系统、修复国际化问题`
- ✅ 17 个文件已修改

### 等待推送
```bash
cd /home/sgj/pyproject/IT_tools
git status
# Changes not pushed to remote
```

## 📝 仓库信息

- **当前仓库**: https://github.com/sgj-king/tools-for-you
- **状态**: 需要删除并重新创建
- **新仓库名**: tools-for-you
- **可见性**: Public
- **描述**: 为每个人打造的智能工具集

## ⚠️ 注意事项

1. **数据丢失警告**: 删除仓库将永久丢失所有历史记录、Issues、Pull Requests、Wiki 等
2. **备份建议**: 如果有重要数据，请先备份
3. **权限要求**: 需要仓库的管理员权限
4. **操作时间**: 整个过程大约需要 5-10 分钟

## 🚀 执行建议

推荐使用 **方法一**（网页操作），因为：
- 更直观、安全
- 可以确认每一步操作
- 不需要额外的权限配置
- 可以在删除前再次确认

执行完成后，新仓库将包含：
- 全新的代码库
- 无历史记录的干净提交
- 最新的功能和修复
