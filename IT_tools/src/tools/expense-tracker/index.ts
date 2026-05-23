import { Wallet } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '记账本',
  path: '/expense-tracker',
  description: '轻松记录日常收支，可视化消费趋势，帮你管好每一分钱',
  keywords: [
    'expense',
    'tracker',
    'budget',
    'money',
    'finance',
    'spending',
    'income',
    'savings',
    '记账',
    '支出',
    '收入',
    '预算',
    '理财',
    '消费',
  ],
  component: () => import('./expense-tracker.vue'),
  icon: Wallet,
  createdAt: new Date('2026-04-24'),
});
