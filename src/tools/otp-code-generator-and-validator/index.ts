import { DeviceMobile } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'OTP 代码生成器',
  path: '/otp-generator',
  description: '为多因素身份验证生成和验证基于时间的OTP（一次性密码）。',
  keywords: [
    'otp',
    'code',
    'generator',
    'validator',
    'one',
    'time',
    'password',
    'authentication',
    'MFA',
    'mobile',
    'device',
    'security',
    'TOTP',
    'Time',
    'HMAC',
  ],
  component: () => import('./otp-code-generator-and-validator.vue'),
  icon: DeviceMobile,
});
