import { Qrcode } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Wi‑Fi 二维码生成器',
  path: '/wifi-qrcode-generator',
  description: '生成并下载用于快速连接 Wi‑Fi 网络的二维码。',
  keywords: ['qr', 'code', 'generator', 'square', 'color', 'link', 'low', 'medium', 'quartile', 'high', 'transparent', 'wifi'],
  component: () => import('./wifi-qr-code-generator.vue'),
  icon: Qrcode,
  createdAt: new Date('2023-09-06'),
});
