import { Wallet } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '储蓄目标计算器',
  path: '/savings-goal-calculator',
  description: '计算达成储蓄目标所需的时间和每月存款金额',
  keywords: [
    'savings',
    'goal',
    'calculator',
    'money',
    'budget',
    'financial',
    'planning',
    'target',
    'deposit',
    'monthly',
    'interest',
    '储蓄',
    '目标',
    '存款',
    '理财',
    '预算',
  ],
  component: () => import('./savings-goal-calculator.vue'),
  icon: Wallet,
  createdAt: new Date('2026-04-17'),
});
