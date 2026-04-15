import { Edit } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'HTML 所见即所得编辑器',
  path: '/html-wysiwyg-editor',
  description: '在线 HTML 编辑器，内置功能丰富的所见即所得编辑能力，并可立即查看源代码。',
  keywords: ['html', 'wysiwyg', 'editor', 'p', 'ul', 'ol', 'converter', 'live'],
  component: () => import('./html-wysiwyg-editor.vue'),
  icon: Edit,
});
