import { MoodSmile } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Emoji 选择器',
  path: '/emoji-picker',
  description: '轻松复制粘贴 Emoji 表情，并查看每个表情的 Unicode 和码点值。',
  keywords: ['emoji', 'picker', 'unicode', 'copy', 'paste'],
  component: () => import('./emoji-picker.vue'),
  icon: MoodSmile,
  createdAt: new Date('2023-08-07'),
});
