import { ListCheck } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '待办清单',
  path: '/todo-list',
  description: '管理日常待办事项，支持优先级、分类、搜索、筛选和本地持久化',
  keywords: [
    'todo', 'task', 'checklist', 'to-do', '待办', '任务', '清单', '事项',
    'priority', 'category', 'organize', 'plan', 'schedule', 'remind',
    '优先级', '分类', '计划', '日程', '提醒',
  ],
  component: () => import('./todo-list.vue'),
  icon: ListCheck,
  createdAt: new Date('2026-05-25'),
});
