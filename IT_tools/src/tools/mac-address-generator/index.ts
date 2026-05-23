import { Devices } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'MAC 地址生成器',
  path: '/mac-address-generator',
  description: '输入数量和前缀。MAC地址将以您选择的大小写（大写或小写）生成',
  keywords: ['mac', 'address', 'generator', 'random', 'prefix'],
  component: () => import('./mac-address-generator.vue'),
  icon: Devices,
  createdAt: new Date('2023-11-31'),
});
