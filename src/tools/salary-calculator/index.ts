import { Cash } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '工资计算器',
  path: '/salary-calculator',
  description: '计算工资、个税、五险一金和实发工资',
  keywords: [
    'salary',
    'calculator',
    'income',
    'tax',
    'insurance',
    'paycheck',
    'wage',
    'monthly',
    'annual',
    'take home',
    'deductions',
    '工资',
    '个税',
    '五险一金',
    '公积金',
    '社保',
  ],
  component: () => import('./salary-calculator.vue'),
  icon: Cash,
  createdAt: new Date('2026-04-16'),
});
