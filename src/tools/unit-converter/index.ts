import { Ruler } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '单位转换器',
  path: '/unit-converter',
  description: '在不同单位之间转换',
  keywords: [
    'unit',
    'converter',
    'length',
    'weight',
    'area',
    'volume',
    'speed',
    'time',
    'data',
    '单位转换',
    '长度',
    '重量',
    '面积',
    '体积',
    '速度',
    '时间',
    '数据',
  ],
  component: () => import('./unit-converter.vue'),
  icon: Ruler,
});
