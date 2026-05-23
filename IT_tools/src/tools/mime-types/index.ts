import { World } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'MIME 类型转换',
  path: '/mime-types',
  description: '在 MIME 类型与文件扩展名之间互相转换。',
  keywords: ['mime', 'types', 'extension', 'content', 'type'],
  component: () => import('./mime-types.vue'),
  icon: World,
});
