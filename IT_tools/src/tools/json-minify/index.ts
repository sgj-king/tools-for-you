import { Braces } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'JSON 压缩',
  path: '/json-minify',
  description: '删除多余空白，对 JSON 进行压缩与精简。',
  keywords: ['json', 'minify', 'format'],
  component: () => import('./json-minify.vue'),
  icon: Braces,
});
