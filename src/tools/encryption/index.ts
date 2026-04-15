import { Lock } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '加密/解密文本',
  path: '/encryption',
  description: '使用 AES、TripleDES、Rabbit 或 RC4 等算法加密和解密文本。',
  keywords: ['cypher', 'encipher', 'text', 'AES', 'TripleDES', 'Rabbit', 'RC4'],
  component: () => import('./encryption.vue'),
  icon: Lock,
  redirectFrom: ['/cypher'],
});
