import { Calculator } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '考勤计算器',
  path: '/attendance-calculator',
  description: '计算考勤天数、出勤率等',
  keywords: ['attendance', 'bunk', 'class', 'student', 'calculator', 'percentage', 'school', 'university'],
  component: () => import('./attendance-calculator.vue'),
  icon: Calculator,
  createdAt: new Date('2026-04-14'),
});
