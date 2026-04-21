import { Hourglass } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '倒计时器',
  path: '/countdown-timer',
  description: '创建倒计时，追踪重要日期和事件',
  keywords: [
    'countdown',
    'timer',
    'deadline',
    'event',
    'date',
    'days',
    'hours',
    'minutes',
    'seconds',
    'tracking',
    '倒计时',
    '截止日期',
    '事件',
    '追踪',
    '提醒',
  ],
  component: () => import('./countdown-timer.vue'),
  icon: Hourglass,
  createdAt: new Date('2026-04-21'),
});
