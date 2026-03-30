import { Ruler } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.unit-converter.title'),
  path: '/unit-converter',
  description: translate('tools.unit-converter.description'),
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
