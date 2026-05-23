import { Notes } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '便签',
  path: '/sticky-notes',
  description: '快捷记录灵感与待办，多彩便签墙，支持拖拽排序、分类筛选、搜索与导出',
  keywords: [
    'sticky', 'notes', 'memo', 'todo', 'quick', 'write', 'idea', 'reminder',
    '便签', '备忘', '待办', '灵感', '记录', '笔记', '便条', '便利贴',
  ],
  component: () => import('./sticky-notes.vue'),
  icon: Notes,
  createdAt: new Date('2026-04-30'),
});
