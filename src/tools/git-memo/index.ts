import { BrandGit } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Git 备忘单',
  path: '/git-memo',
  description: 'Git 是一种分布式版本控制系统。使用这份备忘单，你可以快速查看最常用的 Git 命令。',
  keywords: ['git', 'push', 'force', 'pull', 'commit', 'amend', 'rebase', 'merge', 'reset', 'soft', 'hard', 'lease'],
  component: () => import('./git-memo.vue'),
  icon: BrandGit,
});
