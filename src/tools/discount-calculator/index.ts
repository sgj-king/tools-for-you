import { Discount } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.discount-calculator.title'),
  path: '/discount-calculator',
  description: translate('tools.discount-calculator.description'),
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
