import { School } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'GPA 计算器',
  path: '/gpa-calculator',
  description: '计算平均绩点',
  keywords: ['gpa', 'grade', 'calculator', 'student', 'academic', 'university', 'college', 'score'],
  component: () => import('./gpa-calculator.vue'),
  icon: School,
  createdAt: new Date('2026-04-02'),
});
