import { ArrowsLeftRight } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.base-converter.title',
  path: '/base-converter',
  description: 'tools.base-converter.description',
  keywords: ['integer', 'number', 'base', 'conversion', 'decimal', 'hexadecimal', 'binary', 'octal', 'base64'],
  component: () => import('./integer-base-converter.vue'),
  icon: ArrowsLeftRight,
});
