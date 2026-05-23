import { Contrast } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '颜色对比度检查器',
  path: '/contrast-checker',
  description: '检查颜色对比度是否符合WCAG无障碍标准，助力设计无障碍界面',
  keywords: [
    'contrast',
    'wcag',
    'accessibility',
    'a11y',
    'color',
    'ratio',
    'wcag2',
    'wcag21',
    'aa',
    'aaa',
    'foreground',
    'background',
    'readability',
    'legibility',
    '对比度',
    '无障碍',
    '颜色',
    '可访问性',
    '可读性',
    '前景色',
    '背景色',
  ],
  component: () => import('./contrast-checker.vue'),
  icon: Contrast,
  createdAt: new Date('2026-04-29'),
});
