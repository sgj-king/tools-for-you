import { Moon } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '睡眠质量计算器',
  path: '/sleep-calculator',
  description: '评估您的睡眠质量，获取个性化睡眠建议',
  keywords: [
    'sleep',
    'quality',
    'calculator',
    'health',
    'rest',
    'insomnia',
    'bedtime',
    'wake up',
    '睡眠',
    '质量',
    '健康',
    '作息',
  ],
  component: () => import('./sleep-calculator.vue'),
  icon: Moon,
  createdAt: new Date('2026-04-20'),
});
