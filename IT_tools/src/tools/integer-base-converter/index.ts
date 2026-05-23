import { ArrowsLeftRight } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '进制转换器',
  path: '/base-converter',
  description: '在不同进制之间转换数字',
  keywords: ['integer', 'number', 'base', 'conversion', 'decimal', 'hexadecimal', 'binary', 'octal', 'base64'],
  component: () => import('./integer-base-converter.vue'),
  icon: ArrowsLeftRight,
});
