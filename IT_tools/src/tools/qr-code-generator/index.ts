import { Qrcode } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '二维码生成器',
  path: '/qrcode-generator',
  description: '为 URL 或文本生成并下载二维码，并可自定义前景色和背景色。',
  keywords: ['qr', 'code', 'generator', 'square', 'color', 'link', 'low', 'medium', 'quartile', 'high', 'transparent'],
  component: () => import('./qr-code-generator.vue'),
  icon: Qrcode,
});
