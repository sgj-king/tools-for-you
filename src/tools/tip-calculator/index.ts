import { Cash } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.tip-calculator.title',
  path: '/tip-calculator',
  description: 'tools.tip-calculator.description',
  keywords: [
    'tip',
    'gratuity',
    'calculator',
    'restaurant',
    'bill',
    'split',
    'percentage',
    'dining',
    'service',
  ],
  component: () => import('./tip-calculator.vue'),
  icon: Cash,
  createdAt: new Date('2026-04-08'),
});
