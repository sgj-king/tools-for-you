import { Cash } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.loan-calculator.title',
  path: '/loan-calculator',
  description: 'tools.loan-calculator.description',
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
