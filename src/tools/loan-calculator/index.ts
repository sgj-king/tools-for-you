import { Cash } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '贷款计算器',
  path: '/loan-calculator',
  description: '计算贷款还款',
  keywords: [
    'loan',
    'mortgage',
    'calculator',
    'EMI',
    'interest',
    'payment',
    'finance',
    'car loan',
    'home loan',
    'personal loan',
    'amortization',
  ],
  component: () => import('./loan-calculator.vue'),
  icon: Cash,
  createdAt: new Date('2026-04-07'),
});
