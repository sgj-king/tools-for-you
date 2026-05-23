import { AlignJustified } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Lorem ipsum生成器',
  path: '/lorem-ipsum-generator',
  description: 'Lorem ipsum 是一种占位符文本，常用于展示文档或字体的视觉效果，而不依赖真实内容。',
  keywords: ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'placeholder', 'text', 'filler', 'random', 'generator'],
  component: () => import('./lorem-ipsum-generator.vue'),
  icon: AlignJustified,
});
