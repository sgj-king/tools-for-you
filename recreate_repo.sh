#!/bin/bash
# GitHub 认证刷新和仓库重新创建脚本

echo "=== GitHub 仓库删除并重新创建 ==="
echo ""
echo "步骤 1: 刷新认证权限（添加删除仓库权限）"
echo "请执行以下命令："
echo ""
echo "  gh auth refresh -h github.com -s delete_repo"
echo ""
echo "然后在浏览器中完成授权。"
echo ""
echo "授权完成后，按回车继续..."
read

echo ""
echo "步骤 2: 删除现有仓库"
echo "正在删除 sgj-king/tools-for-you ..."
gh repo delete sgj-king/tools-for-you --confirm

echo ""
echo "步骤 3: 创建全新的初始提交"
cd /home/sgj/pyproject/IT_tools
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

git branch -D main
git branch -m main

echo ""
echo "步骤 4: 创建新仓库并推送"
gh repo create tools-for-you --public --description "为每个人打造的智能工具集" --source=. --push

echo ""
echo "✅ 完成！新仓库已创建：https://github.com/sgj-king/tools-for-you"
