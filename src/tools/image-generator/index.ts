import { Photo } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.image-generator.title'),
  path: '/image-generator',
  description: translate('tools.image-generator.description'),
  keywords: [
    'image',
    'ai',
    'generator',
    'nanobanana',
    'digital human',
    'three view',
    'multi-angle',
    'portrait',
    'character',
  ],
  component: () => import('./image-generator.vue'),
  icon: Photo,
});
