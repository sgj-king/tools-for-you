import { FileInvoice } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Chmod 计算器',
  path: '/chmod-calculator',
  description: '使用这个在线 chmod 计算器计算权限值和对应命令。',
  keywords: [
    'chmod',
    'calculator',
    'file',
    'permission',
    'files',
    'directory',
    'folder',
    'recursive',
    'generator',
    'octal',
  ],
  component: () => import('./chmod-calculator.vue'),
  icon: FileInvoice,
});
