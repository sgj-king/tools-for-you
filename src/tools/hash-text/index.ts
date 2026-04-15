import { EyeOff } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '文本哈希',
  path: '/hash-text',
  description: '使用所需算法对文本进行哈希：MD5、SHA1、SHA256、SHA224、SHA512、SHA384、SHA3 或 RIPEMD160。',
  keywords: [
    'hash',
    'digest',
    'crypto',
    'security',
    'text',
    'MD5',
    'SHA1',
    'SHA256',
    'SHA224',
    'SHA512',
    'SHA384',
    'SHA3',
    'RIPEMD160',
  ],
  component: () => import('./hash-text.vue'),
  icon: EyeOff,
  redirectFrom: ['/hash'],
});
