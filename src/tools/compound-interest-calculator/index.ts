import { Calculator } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.compound-interest-calculator.title'),
  path: '/compound-interest-calculator',
  description: translate('tools.compound-interest-calculator.description'),
  keywords: [
    'compound',
    'interest',
    'calculator',
    'investment',
    'finance',
    'savings',
    'growth',
    'money',
    'roi',
    'return',
  ],
  component: () => import('./compound-interest-calculator.vue'),
  icon: Calculator,
  createdAt: new Date('2026-04-03'),
});
