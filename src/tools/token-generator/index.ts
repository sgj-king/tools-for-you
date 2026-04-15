import { ArrowsShuffle } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '令牌生成器',
  path: '/token-generator',
  description: '使用您想要的字符、大写或小写字母、数字和/或符号生成随机字符串。',
  keywords: ['token', 'random', 'string', 'alphanumeric', 'symbols', 'number', 'letters', 'lowercase', 'uppercase', 'password'],
  component: () => import('./token-generator.tool.vue'),
  icon: ArrowsShuffle,
});
