import { ColorPicker } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'tools.color-picker.title',
  path: '/color-picker',
  description: 'tools.color-picker.description',
  keywords: ['color', 'picker', 'hex', 'rgb', 'hsl', 'color-converter', '颜色', '取色器'],
  component: () => import('./color-picker.tool.vue'),
  icon: ColorPicker,
});
