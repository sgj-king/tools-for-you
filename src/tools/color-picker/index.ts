import { ColorPicker } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.color-picker.title'),
  path: '/color-picker',
  description: translate('tools.color-picker.description'),
  keywords: ['color', 'picker', 'hex', 'rgb', 'hsl', 'color-converter', '颜色', '取色器'],
  component: () => import('./color-picker.tool.vue'),
  icon: ColorPicker,
});
