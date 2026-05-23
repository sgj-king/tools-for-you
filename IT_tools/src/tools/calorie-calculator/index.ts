import { Flame } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '卡路里计算器',
  path: '/calorie-calculator',
  description: '计算每日所需卡路里、BMR基础代谢率和TDEE',
  keywords: [
    'calorie',
    'bmr',
    'tdee',
    'basal metabolic rate',
    'total daily energy expenditure',
    'daily calorie',
    'weight loss',
    'muscle gain',
    'nutrition',
    'macro',
    'diet',
    '卡路里',
    '基础代谢',
    '每日消耗',
    '减脂',
    '增肌',
    '营养',
  ],
  component: () => import('./calorie-calculator.vue'),
  icon: Flame,
  createdAt: new Date('2026-05-19'),
});
