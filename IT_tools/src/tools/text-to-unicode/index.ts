import { TextWrap } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '文本转 Unicode',
  path: '/text-to-unicode',
  description: '将文本转换为 Unicode，或从 Unicode 还原为文本。',
  keywords: ['text', 'to', 'unicode'],
  component: () => import('./text-to-unicode.vue'),
  icon: TextWrap,
  createdAt: new Date('2024-01-31'),
});
