import { Run } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '配速计算器',
  path: '/pace-calculator',
  description: '计算跑步/骑行配速与速度转换，支持时间/距离/配速互算，比赛预测，分段配速表',
  keywords: [
    'pace',
    'speed',
    'running',
    'cycling',
    'marathon',
    'half marathon',
    '5k',
    '10k',
    'pace calculator',
    'split',
    '配速',
    '速度',
    '跑步',
    '骑行',
    '马拉松',
    '半马',
    '配速计算',
    '分段配速',
    '比赛预测',
  ],
  component: () => import('./pace-calculator.vue'),
  icon: Run,
  createdAt: new Date('2026-05-29'),
});
