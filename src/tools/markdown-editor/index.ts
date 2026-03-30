import { EditPencil } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.markdown-editor.title'),
  path: '/markdown-editor',
  description: translate('tools.markdown-editor.description'),
  keywords: ['markdown', 'editor', 'preview', 'live', 'gfm', 'markdown编辑器', '实时预览', '写作'],
  component: () => import('./markdown-editor.tool.vue'),
  icon: EditPencil,
});
