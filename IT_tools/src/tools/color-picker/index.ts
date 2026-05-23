import { ColorPicker } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '颜色选择器',
  path: '/color-picker',
  description: '选择颜色并获取各种格式',
  keywords: ['color', 'picker', 'hex', 'rgb', 'hsl', 'color-converter', '颜色', '取色器'],
  component: () => import('./color-picker.tool.vue'),
  icon: ColorPicker,
});
