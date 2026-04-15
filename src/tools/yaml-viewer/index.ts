import { AlignJustified } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'YAML 格式化与美化',
  path: '/yaml-prettify',
  description: '将 YAML 字符串格式化为清晰易读的形式。',
  keywords: ['yaml', 'viewer', 'prettify', 'format'],
  component: () => import('./yaml-viewer.vue'),
  icon: AlignJustified,
  createdAt: new Date('2024-01-31'),
});
