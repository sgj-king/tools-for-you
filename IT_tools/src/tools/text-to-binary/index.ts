import { Binary } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '文本转 ASCII 二进制',
  path: '/text-to-binary',
  description: '将文本转换为 ASCII 二进制表示，或从中还原为文本。',
  keywords: ['text', 'to', 'binary', 'converter', 'encode', 'decode', 'ascii'],
  component: () => import('./text-to-binary.vue'),
  icon: Binary,
  createdAt: new Date('2023-10-15'),
});
