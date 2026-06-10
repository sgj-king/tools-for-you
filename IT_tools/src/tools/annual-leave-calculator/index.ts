import { Beach } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '年假计算器',
  path: '/annual-leave-calculator',
  description: '根据中国劳动法计算带薪年假天数，支持工龄计算、新入职折算、离职折算、未休年假补偿',
  keywords: [
    'annual', 'leave', 'vacation', 'paid', 'days', 'calculator',
    'work', 'years', 'seniority', 'entitlement', 'compensation',
    'prorated', 'carry', 'labor', 'law',
    '年假', '带薪年假', '工龄', '年休假', '法定年假',
    '折算', '未休年假', '补偿', '劳动法', '入职', '离职',
  ],
  component: () => import('./annual-leave-calculator.vue'),
  icon: Beach,
  createdAt: new Date('2026-06-10'),
});
