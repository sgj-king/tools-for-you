import { Clock } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '世界时钟',
  path: '/world-clock',
  description: '多时区实时时钟，添加全球城市，直观对比时差，支持工作时间指示与会议规划',
  keywords: [
    'world', 'clock', 'timezone', 'time', 'zone', 'city', 'global',
    'meeting', 'schedule', 'international', 'difference',
    '世界时钟', '时区', '时间', '城市', '全球', '会议', '时差', '跨国',
  ],
  component: () => import('./world-clock.vue'),
  icon: Clock,
  createdAt: new Date('2026-05-04'),
});
