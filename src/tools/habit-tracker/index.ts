import { Plant2 } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '习惯追踪器',
  path: '/habit-tracker',
  description: '追踪每日习惯养成，记录打卡与连续天数，助你坚持好习惯',
  keywords: [
    'habit',
    'tracker',
    'routine',
    'daily',
    'streak',
    'check-in',
    'productivity',
    'consistency',
    'goal',
    '习惯',
    '追踪',
    '打卡',
    '日常',
    '坚持',
    '连续',
    '养成',
    '自律',
  ],
  component: () => import('./habit-tracker.vue'),
  icon: Plant2,
  createdAt: new Date('2026-04-22'),
});
