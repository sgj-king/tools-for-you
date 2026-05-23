import { AlignJustified } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'YAML 转 JSON',
  path: '/yaml-to-json-converter',
  description: '使用这个在线工具将 YAML 转换为 JSON。',
  keywords: ['yaml', 'to', 'json'],
  component: () => import('./yaml-to-json.vue'),
  icon: AlignJustified,
  createdAt: new Date('2023-04-10'),
});
