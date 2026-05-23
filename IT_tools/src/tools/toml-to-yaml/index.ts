import { defineTool } from '../tool';
import BracketIcon from '~icons/mdi/code-brackets';

export const tool = defineTool({
  name: 'TOML 到 YAML',
  path: '/toml-to-yaml',
  description: '解析 TOML 并将其转换为 YAML。',
  keywords: ['toml', 'yaml', 'convert', 'online', 'transform', 'parse'],
  component: () => import('./toml-to-yaml.vue'),
  icon: BracketIcon,
  createdAt: new Date('2023-06-23'),
});
