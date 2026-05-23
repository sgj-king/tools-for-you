import { BoxModel2 as BoxShadow } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'CSS阴影生成器',
  path: '/box-shadow-generator',
  description: '可视化创建CSS盒阴影效果，支持多层阴影、实时预览、一键复制代码',
  keywords: [
    'box-shadow',
    'css',
    'shadow',
    'drop shadow',
    'glow',
    'design',
    'frontend',
    'ui',
    'effect',
    '阴影',
    'CSS',
    '盒阴影',
    '投影',
    '发光',
    '设计',
    '前端',
    'UI效果',
  ],
  component: () => import('./box-shadow-generator.vue'),
  icon: BoxShadow,
  createdAt: new Date('2026-05-07'),
});
