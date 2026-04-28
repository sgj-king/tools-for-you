import { Palette } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'CSS渐变生成器',
  path: '/gradient-generator',
  description: '可视化创建精美CSS渐变，支持线性/径向/锥形渐变，实时预览，一键复制代码',
  keywords: [
    'gradient',
    'css',
    'linear',
    'radial',
    'conic',
    'color',
    'background',
    'design',
    'frontend',
    '渐变',
    'CSS',
    '线性渐变',
    '径向渐变',
    '锥形渐变',
    '颜色',
    '背景',
    '设计',
    '前端',
  ],
  component: () => import('./gradient-generator.vue'),
  icon: Palette,
  createdAt: new Date('2026-04-28'),
});
