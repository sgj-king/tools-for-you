import { Fingerprint } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'UUID 生成器',
  path: '/uuid-generator',
  description: '通用唯一标识符（UUID）是一个128位数字，用于标识计算机系统中的信息。可能的UUID数量为16^32，即2^128或约3.4x10^38（这是一个很大的数字！）。',
  keywords: ['uuid', 'v4', 'random', 'id', 'alphanumeric', 'identity', 'token', 'string', 'identifier', 'unique', 'v1', 'v3', 'v5', 'nil'],
  component: () => import('./uuid-generator.vue'),
  icon: Fingerprint,
});
