import { Table } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Markdown 表格生成器',
  path: '/markdown-table-generator',
  description: '可视化创建和编辑 Markdown 表格，实时预览并一键复制',
  keywords: [
    'markdown',
    'table',
    'generator',
    'editor',
    'grid',
    'format',
    'md',
    'markdown表格',
    '表格生成',
    '表格编辑',
  ],
  component: () => import('./markdown-table-generator.vue'),
  icon: Table,
  createdAt: new Date('2026-05-12'),
});
