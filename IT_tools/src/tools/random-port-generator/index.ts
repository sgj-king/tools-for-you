import { Server } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '随机端口生成器',
  path: '/random-port-generator',
  description: '生成位于"知名端口"（0–1023）范围之外的随机端口号。',
  keywords: ['system', 'port', 'lan', 'generator', 'random', 'development', 'computer'],
  component: () => import('./random-port-generator.vue'),
  icon: Server,
});
