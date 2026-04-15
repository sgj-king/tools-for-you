import { Hourglass } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'ETA 计算器',
  path: '/eta-calculator',
  description: 'ETA（预计完成时间）计算器，可估算任务的大致结束时间，例如下载完成时间。',
  keywords: ['eta', 'calculator', 'estimated', 'time', 'arrival', 'average'],
  component: () => import('./eta-calculator.vue'),
  icon: Hourglass,
});
