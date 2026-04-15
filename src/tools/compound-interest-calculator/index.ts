import { Calculator } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '复利计算器',
  path: '/compound-interest-calculator',
  description: '计算复利收益，支持多种复利频率',
  keywords: [
    'compound',
    'interest',
    'calculator',
    'investment',
    'finance',
    'savings',
    'growth',
    'money',
    'roi',
    'return',
  ],
  component: () => import('./compound-interest-calculator.vue'),
  icon: Calculator,
  createdAt: new Date('2026-04-03'),
});
