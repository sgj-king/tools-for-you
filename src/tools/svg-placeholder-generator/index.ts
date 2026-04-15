import { ImageOutlined } from '@vicons/material';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'SVG 占位图生成器',
  path: '/svg-placeholder-generator',
  description: '生成 SVG 图片，可作为应用中的占位图。',
  keywords: ['svg', 'placeholder', 'generator', 'image', 'size', 'mockup'],
  component: () => import('./svg-placeholder-generator.vue'),
  icon: ImageOutlined,
});
