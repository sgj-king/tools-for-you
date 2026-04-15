import { HeartPulse } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: 'BMI 计算器',
  path: '/bmi-calculator',
  description: '计算身体质量指数',
  keywords: [
    'bmi',
    'body mass index',
    'weight',
    'height',
    'health',
    'fitness',
    'calculator',
    'body fat',
    'obesity',
    'underweight',
    'overweight',
  ],
  component: () => import('./bmi-calculator.vue'),
  icon: HeartPulse,
  createdAt: new Date('2026-04-10'),
});
