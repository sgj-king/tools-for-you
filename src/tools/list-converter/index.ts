import { List } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '列表转换器',
  path: '/list-converter',
  description: '该工具可处理按列排列的数据，并对每一行应用多种变换，如转置、添加前后缀、反转列表、排序、转小写和截断。',
  keywords: ['list', 'converter', 'sort', 'reverse', 'prefix', 'suffix', 'lowercase', 'truncate'],
  component: () => import('./list-converter.vue'),
  icon: List,
  createdAt: new Date('2023-05-07'),
});
