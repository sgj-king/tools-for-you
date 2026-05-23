import { Exchange } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '汇率转换器',
  path: '/currency-converter',
  description: '实时汇率转换，支持150+货币，热门汇率对，汇率趋势图，离线缓存',
  keywords: [
    'currency',
    'converter',
    'exchange',
    'rate',
    'forex',
    'money',
    'USD',
    'CNY',
    'EUR',
    'JPY',
    'GBP',
    '汇率',
    '转换',
    '货币',
    '外汇',
    '换算',
  ],
  component: () => import('./currency-converter.vue'),
  icon: Exchange,
  createdAt: new Date('2026-05-14'),
});
