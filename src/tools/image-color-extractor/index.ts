import { Palette } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.image-color-extractor.title',
  path: '/image-color-extractor',
  description: 'tools.image-color-extractor.description',
  keywords: ['image', 'color', 'palette', 'extract', 'rgb', 'hex', 'picker', 'dominant', 'theme'],
  component: () => import('./image-color-extractor.vue'),
  icon: Palette,
});
