import { Key } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '密码生成器',
  path: '/password-generator',
  description: '生成安全随机密码，自定义长度、字符类型，批量生成，密码强度评估',
  keywords: [
    'password',
    'generator',
    'random',
    'secure',
    'strength',
    'uppercase',
    'lowercase',
    'numbers',
    'symbols',
    'pin',
    'passphrase',
    '密码',
    '生成',
    '随机',
    '安全',
    '强度',
    '口令',
  ],
  component: () => import('./password-generator.vue'),
  icon: Key,
  createdAt: new Date('2026-05-11'),
});
