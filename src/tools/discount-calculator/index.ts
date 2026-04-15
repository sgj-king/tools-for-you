import { Discount } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.discount-calculator.title',
  path: '/discount-calculator',
  description: 'tools.discount-calculator.description',
  keywords: [
    'discount',
    'sale',
    'price',
    'calculator',
    'percentage',
    'off',
    'savings',
    'shopping',
    'deal',
  ],
  component: () => import('./discount-calculator.vue'),
  icon: Discount,
  createdAt: new Date('2026-04-07'),
});
