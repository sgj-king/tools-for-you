import { Bolt } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '电费计算器',
  path: '/electricity-cost-calculator',
  description: '计算家电用电费用、宿舍电费分摊、月度电费预估',
  keywords: [
    'electricity',
    'power',
    'cost',
    'calculator',
    'energy',
    'watt',
    'kwh',
    'bill',
    'appliance',
    'dorm',
    'roommate',
    '电费',
    '用电',
    '功率',
    '千瓦时',
    '电价',
    '家电',
    '宿舍',
    '分摊',
    '电表',
    '度数',
  ],
  component: () => import('./electricity-cost-calculator.vue'),
  icon: Bolt,
  createdAt: new Date('2026-05-18'),
});
