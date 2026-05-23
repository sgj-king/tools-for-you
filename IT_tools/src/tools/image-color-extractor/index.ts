import { Palette } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '图像颜色提取器',
  path: '/image-color-extractor',
  description: '从图像中提取主要颜色',
  keywords: ['image', 'color', 'palette', 'extract', 'rgb', 'hex', 'picker', 'dominant', 'theme'],
  component: () => import('./image-color-extractor.vue'),
  icon: Palette,
});
