import { EyeOff } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '字符串混淆器',
  path: '/string-obfuscator',
  description: '混淆字符串（如秘密、IBAN 或令牌），使其可分享和可识别，而不泄露其内容。',
  keywords: ['string', 'obfuscator', 'secret', 'token', 'hide', 'obscure', 'mask', 'masking'],
  component: () => import('./string-obfuscator.vue'),
  icon: EyeOff,
  createdAt: new Date('2023-08-16'),
});
