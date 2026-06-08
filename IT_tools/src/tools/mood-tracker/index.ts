import { MoodHappy } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '心情追踪器',
  path: '/mood-tracker',
  description: '记录每日心情变化，查看情绪趋势图表，关联活动与情绪，获取心情洞察',
  keywords: [
    'mood', 'tracker', 'emotion', 'feeling', 'mental', 'health',
    'wellness', 'journal', 'diary', 'happiness', 'anxiety', 'stress',
    'self-care', 'mood-log', 'emotion-chart', 'sentiment',
    '心情', '情绪', '追踪', '记录', '心理健康', '幸福感',
    '压力', '焦虑', '日记', '情绪图表', '自我关怀',
  ],
  component: () => import('./mood-tracker.vue'),
  icon: MoodHappy,
  createdAt: new Date('2026-06-08'),
});
