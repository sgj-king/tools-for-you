import { Edit } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.markdown-editor.title',
  path: '/markdown-editor',
  description: 'tools.markdown-editor.description',
  keywords: ['markdown', 'editor', 'preview', 'live', 'gfm', 'markdown编辑器', '实时预览', '写作'],
  component: () => import('./markdown-editor.tool.vue'),
  icon: Edit,
});
