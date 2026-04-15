import { AbcRound } from '@vicons/material';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Slug 化字符串',
  path: '/slugify-string',
  description: '将字符串转换为适合用作 URL、文件名和 ID 的安全格式。',
  keywords: ['slugify', 'string', 'escape', 'emoji', 'special', 'character', 'space', 'trim'],
  component: () => import('./slugify-string.vue'),
  icon: AbcRound,
});
