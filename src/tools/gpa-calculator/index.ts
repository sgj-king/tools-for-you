import { School } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.gpa-calculator.title',
  path: '/gpa-calculator',
  description: 'tools.gpa-calculator.description',
  keywords: ['gpa', 'grade', 'calculator', 'student', 'academic', 'university', 'college', 'score'],
  component: () => import('./gpa-calculator.vue'),
  icon: School,
  createdAt: new Date('2026-04-02'),
});
