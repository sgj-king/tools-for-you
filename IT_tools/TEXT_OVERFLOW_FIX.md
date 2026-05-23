# 文字溢出修复说明

## 🐛 问题描述
在分类列表页面（`CategoryList.vue`）中，工具卡片内的描述文字超出了卡片边界，显示到了卡片外面。

## 🔍 原因分析
CSS Flexbox 布局中，`.tool-info` 容器作为 flex 子元素，默认情况下不会收缩到比其内容更小。当描述文字过长时，会溢出容器。

关键问题：
```css
.tool-info {
  flex: 1;
  /* 缺少 min-width: 0，导致无法收缩 */
}

.tool-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 缺少容器约束 */
}
```

## ✅ 解决方案

### 1. 添加容器约束
```css
.tool-info {
  flex: 1;
  min-width: 0; /* 关键：允许 flex 子元素收缩 */
  overflow: hidden; /* 防止内容溢出 */
}
```

**原理**: `min-width: 0` 告诉浏览器允许这个 flex 子元素收缩到比其内容更小，从而触发内部元素的 `text-overflow: ellipsis`。

### 2. 确保标题也不溢出
```css
.tool-info h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--app-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 3. 强化描述文字约束
```css
.tool-description {
  font-size: 13px;
  color: var(--app-muted);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block; /* 确保作为块级元素 */
}
```

## 📊 效果对比

### 修复前
```
┌─────────────────────────────┐
│ 🔧 工具图标  工具名称         │
│             这是一段很长很长很│ ← 文字溢出
│ 长很长的描述文字...          │ ← 继续溢出
└─────────────────────────────┘
```

### 修复后
```
┌─────────────────────────────┐
│ 🔧 工具图标  工具名称         │
│             这是一段很长很长...│ ← 文字截断
└─────────────────────────────┘
```

## 🔧 技术要点

### Flexbox 文字溢出的关键
在 Flexbox 布局中，要让子元素的文本正确显示省略号，需要：

1. **父容器**: 添加 `min-width: 0` 或 `overflow: hidden`
2. **子元素**: 设置 `overflow: hidden` + `text-overflow: ellipsis` + `white-space: nowrap`

### 为什么需要 min-width: 0？
- Flex 子元素的默认 `min-width` 是 `auto`
- `auto` 意味着元素不会收缩到比其内容更小
- 设置 `min-width: 0` 后，元素可以收缩，从而触发文本截断

## 🎨 相关 CSS 属性

```css
/* 完整的文本溢出处理方案 */
.text-overflow-ellipsis {
  overflow: hidden;           /* 隐藏溢出内容 */
  text-overflow: ellipsis;    /* 显示省略号 */
  white-space: nowrap;        /* 禁止换行 */
  max-width: 100%;            /* 限制最大宽度 */
  display: block;             /* 块级元素 */
}
```

## 📱 响应式适配
修复后的样式在移动端同样有效：
```css
@media (max-width: 768px) {
  .tool-card {
    padding: 16px;
  }
  /* 文字溢出处理保持一致 */
}
```

## ✨ 测试方法
访问任意分类列表页，例如：
- http://localhost:5177/category/crypto
- http://localhost:5177/category/converter

观察工具卡片的描述文字，应该正确显示省略号，不会溢出卡片边界。

## 🎯 最佳实践

处理 Flexbox 中的文本溢出时：
1. ✅ 总是为 flex 子元素添加 `min-width: 0`
2. ✅ 同时添加 `overflow: hidden`
3. ✅ 在文本元素上使用完整的省略号样式
4. ❌ 不要依赖固定宽度
5. ❌ 不要忘记处理标题溢出

## 📚 参考资料
- [MDN: text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow)
- [CSS-Tricks: Flexbox and Truncated Text](https://css-tricks.com/flexbox-truncated-text/)
- [W3C: Flexbox Overflow](https://www.w3.org/TR/css-flexbox-1/#min-size-auto)
