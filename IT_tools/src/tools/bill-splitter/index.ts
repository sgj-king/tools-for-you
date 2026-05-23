import { Cash } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'AA付款计算器',
  path: '/bill-splitter',
  description: '轻松分摊账单，支持项目分配、共享费用、智能结算，聚餐AA不再头疼',
  keywords: [
    'bill', 'split', 'aa', 'share', 'money', 'payment', 'dutch',
    'restaurant', 'group', 'settle', 'balance',
    'AA', '分摊', '账单', '聚餐', '平摊', '付款', '结算', '买单',
  ],
  component: () => import('./bill-splitter.vue'),
  icon: Cash,
  createdAt: new Date('2026-04-27'),
});
