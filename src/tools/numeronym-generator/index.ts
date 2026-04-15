import { defineTool } from '../tool';
import n7mIcon from './n7m-icon.svg?component';
export const tool = defineTool({
  name: '数字名称生成器',
  path: '/numeronym-generator',
  description: '数字名是一个用数字构成缩写的词。例如，"i18n"是"国际化"的名词，其中18表示单词中第一个i和最后一个n之间的字母数。',
  keywords: ['numeronym', 'generator', 'abbreviation', 'i18n', 'a11y', 'l10n'],
  component: () => import('./numeronym-generator.vue'),
  icon: n7mIcon,
  createdAt: new Date('2023-11-05'),
});
