import { Alarm } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Crontab 生成器',
  path: '/crontab-generator',
  description: '校验并生成 crontab 表达式，并查看可读的定时说明。',
  keywords: [
    'crontab',
    'generator',
    'cronjob',
    'cron',
    'schedule',
    'parse',
    'expression',
    'year',
    'month',
    'week',
    'day',
    'minute',
    'second',
  ],
  component: () => import('./crontab-generator.vue'),
  icon: Alarm,
});
