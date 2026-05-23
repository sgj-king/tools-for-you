import { Droplet } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '饮水量追踪器',
  path: '/water-tracker',
  description: '追踪每日饮水量，设置目标、记录每次喝水，养成健康饮水习惯',
  keywords: [
    'water',
    'intake',
    'tracker',
    'hydration',
    'drink',
    'health',
    'daily',
    'goal',
    'glass',
    'cup',
    'ml',
    'liter',
    '饮水',
    '喝水',
    '饮水量',
    '追踪',
    '目标',
    '健康',
    '水分',
    '杯子',
    '毫升',
  ],
  component: () => import('./water-tracker.vue'),
  icon: Droplet,
  createdAt: new Date('2026-05-06'),
});
