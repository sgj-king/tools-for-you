import { Braces } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'JSON 转 TOML',
  path: '/json-to-toml',
  description: '解析 JSON 并将其转换为 TOML。',
  keywords: ['json', 'parse', 'toml', 'convert', 'transform'],
  component: () => import('./json-to-toml.vue'),
  icon: Braces,
  createdAt: new Date('2023-06-23'),
});
