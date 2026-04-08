import { Cash } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.tip-calculator.title'),
  path: '/tip-calculator',
  description: translate('tools.tip-calculator.description'),
  keywords: [
    'tip',
    'gratuity',
    'calculator',
    'restaurant',
    'bill',
    'split',
    'percentage',
    'dining',
    'service',
  ],
  component: () => import('./tip-calculator.vue'),
  icon: Cash,
  createdAt: new Date('2026-04-08'),
});
