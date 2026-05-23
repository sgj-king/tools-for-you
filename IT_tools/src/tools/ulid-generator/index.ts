import { SortDescendingNumbers } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'ULID 生成器',
  path: '/ulid-generator',
  description: '生成随机的通用唯一字典序可排序标识符（ULID）。',
  keywords: ['ulid', 'generator', 'random', 'id', 'alphanumeric', 'identity', 'token', 'string', 'identifier', 'unique'],
  component: () => import('./ulid-generator.vue'),
  icon: SortDescendingNumbers,
  createdAt: new Date('2023-09-11'),
});
