import { LockSquare } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Bcrypt 哈希',
  path: '/bcrypt',
  description: '使用 bcrypt 对文本进行哈希和比对。Bcrypt 是基于 Blowfish 的密码哈希函数。',
  keywords: ['bcrypt', 'hash', 'compare', 'password', 'salt', 'round', 'storage', 'crypto'],
  component: () => import('./bcrypt.vue'),
  icon: LockSquare,
});
