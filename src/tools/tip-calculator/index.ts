import { Cash } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '小费计算器',
  path: '/tip-calculator',
  description: '计算小费金额',
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
