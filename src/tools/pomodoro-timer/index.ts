import { ClockHour4 } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '番茄钟',
  path: '/pomodoro-timer',
  description: '使用番茄工作法提升专注力，劳逸结合高效工作',
  keywords: [
    'pomodoro',
    'timer',
    'focus',
    'productivity',
    'work',
    'break',
    'concentration',
    '番茄钟',
    '专注',
    '工作',
    '休息',
    '效率',
    '番茄工作法',
  ],
  component: () => import('./pomodoro-timer.vue'),
  icon: ClockHour4,
  createdAt: new Date('2026-04-21'),
});
