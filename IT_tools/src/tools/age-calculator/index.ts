import { Calendar } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '年龄计算器',
  path: '/age-calculator',
  description: '计算你的年龄，支持多种日期格式',
  keywords: [
    'age',
    'calculator',
    'birthday',
    'date',
    'years',
    'months',
    'days',
    'zodiac',
    'life',
    'stats',
  ],
  component: () => import('./age-calculator.vue'),
  icon: Calendar,
  createdAt: new Date('2026-04-09'),
});
