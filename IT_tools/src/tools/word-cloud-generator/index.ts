import { Cloud } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '词云生成器',
  path: '/word-cloud-generator',
  description: '从文本生成可视化词云，支持中英文分词，多种配色方案与形状，导出PNG图片',
  keywords: [
    'wordcloud',
    'word cloud',
    'tag cloud',
    'wordle',
    'text visualization',
    '词云',
    '词云生成',
    '文字云',
    '标签云',
    '关键词',
    '文本可视化',
    'keyword',
    'frequency',
    '词频',
  ],
  component: () => import('./word-cloud-generator.vue'),
  icon: Cloud,
  createdAt: new Date('2026-06-01'),
});
