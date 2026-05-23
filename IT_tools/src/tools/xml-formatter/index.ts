import { Code } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'XML 格式化',
  path: '/xml-formatter',
  description: '将XML字符串修饰为友好的可读格式。',
  keywords: ['xml', 'prettify', 'format'],
  component: () => import('./xml-formatter.vue'),
  icon: Code,
  createdAt: new Date('2023-06-17'),
});
