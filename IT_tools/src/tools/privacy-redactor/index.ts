import { EyeOff } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '隐私脱敏',
  path: '/privacy-redactor',
  description: '自动识别并脱敏文本中的手机号、身份证、邮箱、银行卡、IP等敏感信息，支持自定义规则',
  keywords: [
    'privacy',
    'redact',
    'mask',
    'sensitive',
    'personal',
    'data',
    'phone',
    'email',
    'id card',
    'bank card',
    'IP',
    '脱敏',
    '隐私',
    '遮蔽',
    '敏感信息',
    '手机号',
    '身份证',
    '邮箱',
    '银行卡',
    '个人信息',
    '数据保护',
  ],
  component: () => import('./privacy-redactor.vue'),
  icon: EyeOff,
  createdAt: new Date('2026-05-15'),
});
