import { Music } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '白噪音混合器',
  path: '/ambient-sound-mixer',
  description: '混合多种环境白噪音，打造你的专注空间，助你沉浸工作与学习',
  keywords: [
    'ambient', 'sound', 'mixer', 'white noise', 'focus', 'study', 'work',
    'rain', 'fire', 'birds', 'ocean', 'wind', 'thunder', 'coffee',
    '白噪音', '环境声', '混合', '专注', '学习', '工作', '下雨', '海浪', '壁炉',
  ],
  component: () => import('./ambient-sound-mixer.vue'),
  icon: Music,
  createdAt: new Date('2026-04-23'),
});
