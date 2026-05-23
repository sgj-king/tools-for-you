import { Tags } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Open Graph 元标签生成器',
  path: '/og-meta-generator',
  description: '为你的网站生成 Open Graph 与社交分享所需的 HTML 元标签。',
  keywords: [
    'meta',
    'tag',
    'generator',
    'social',
    'title',
    'description',
    'image',
    'share',
    'online',
    'website',
    'open',
    'graph',
    'og',
  ],
  component: () => import('./meta-tag-generator.vue'),
  icon: Tags,
});
