import { TimerOutlined } from '@vicons/material';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '计时器',
  path: '/chronometer',
  description: '用于记录和监控持续时间的简洁计时器。',
  keywords: ['chronometer', 'time', 'lap', 'duration', 'measure', 'pause', 'resume', 'stopwatch'],
  component: () => import('./chronometer.vue'),
  icon: TimerOutlined,
});
