import { SpeedFilled } from '@vicons/material';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '基准测试构建器',
  path: '/benchmark-builder',
  description: '用这个简洁的在线基准测试工具轻松比较任务执行时间。',
  keywords: ['benchmark', 'builder', 'execution', 'duration', 'mean', 'variance'],
  component: () => import('./benchmark-builder.vue'),
  icon: SpeedFilled,
  createdAt: new Date('2023-04-05'),
});
