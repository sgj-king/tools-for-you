import { Photo } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'AI 图像生成器',
  path: '/image-generator',
  description: '使用 AI 模型生成图像，支持文生图、图生图、数字人生成、三视图和多视角生成。',
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
