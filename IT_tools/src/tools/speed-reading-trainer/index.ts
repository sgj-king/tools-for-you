import { Book } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '速读训练器',
  path: '/speed-reading-trainer',
  description: 'RSVP速读训练，快速提升阅读速度与专注力，支持自定义语速、ORP高亮、进度追踪',
  keywords: [
    'speed reading',
    'RSVP',
    'rapid serial visual presentation',
    'reading speed',
    'WPM',
    'words per minute',
    'reading trainer',
    'speed reader',
    '速读',
    '快速阅读',
    '阅读训练',
    '阅读速度',
    'ORP',
    '专注力',
    '阅读效率',
    '每分钟字数',
  ],
  component: () => import('./speed-reading-trainer.vue'),
  icon: Book,
  createdAt: new Date('2026-05-27'),
});
