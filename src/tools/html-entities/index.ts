import { Code } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'HTML 实体转义',
  path: '/html-entities',
  description: '对 HTML 实体进行转义或反转义，如将特殊字符与其 HTML 表示互相转换',
  keywords: ['html', 'entities', 'escape', 'unescape', 'special', 'characters', 'tags'],
  component: () => import('./html-entities.vue'),
  icon: Code,
});
