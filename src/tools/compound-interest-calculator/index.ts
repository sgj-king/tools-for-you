import { Calculator } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.compound-interest-calculator.title',
  path: '/compound-interest-calculator',
  description: 'tools.compound-interest-calculator.description',
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
