import { Palette } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '颜色转换器',
  path: '/color-converter',
  description: '在十六进制、RGB、HSL 和 CSS 颜色名称等格式之间转换颜色。',
  keywords: ['color', 'converter'],
  component: () => import('./color-converter.vue'),
  icon: Palette,
  redirectFrom: ['/color-picker-converter'],
});
