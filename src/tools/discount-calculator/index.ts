import { Discount } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '折扣计算器',
  path: '/discount-calculator',
  description: '计算折扣价格',
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
