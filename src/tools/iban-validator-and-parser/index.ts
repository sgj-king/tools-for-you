import { defineTool } from '../tool';
import Bank from '~icons/mdi/bank';

export const tool = defineTool({
  name: 'IBAN验证器和解析器',
  path: '/iban-validator-and-parser',
  description: '校验并解析 IBAN 号码，检查其是否有效，并获取国家、BBAN、是否为 QR-IBAN 及其易读格式。',
  keywords: ['iban', 'validator', 'and', 'parser', 'bic', 'bank'],
  component: () => import('./iban-validator-and-parser.vue'),
  icon: Bank,
  createdAt: new Date('2023-08-26'),
});
