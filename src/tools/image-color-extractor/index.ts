import { Palette } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.image-color-extractor.title'),
  path: '/image-color-extractor',
  description: translate('tools.image-color-extractor.description'),
  keywords: ['image', 'color', 'palette', 'extract', 'rgb', 'hex', 'picker', 'dominant', 'theme'],
  component: () => import('./image-color-extractor.vue'),
  icon: Palette,
});
