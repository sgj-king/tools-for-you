import { School } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.gpa-calculator.title'),
  path: '/gpa-calculator',
  description: translate('tools.gpa-calculator.description'),
  keywords: ['gpa', 'grade', 'calculator', 'student', 'academic', 'university', 'college', 'score'],
  component: () => import('./gpa-calculator.vue'),
  icon: School,
  createdAt: new Date('2026-04-02'),
});
