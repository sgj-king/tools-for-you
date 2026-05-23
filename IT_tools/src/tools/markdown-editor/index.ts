import { Edit } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Markdown 编辑器',
  path: '/markdown-editor',
  description: '实时预览的 Markdown 编辑器',
  keywords: ['markdown', 'editor', 'preview', 'live', 'gfm', 'markdown编辑器', '实时预览', '写作'],
  component: () => import('./markdown-editor.tool.vue'),
  icon: Edit,
});
