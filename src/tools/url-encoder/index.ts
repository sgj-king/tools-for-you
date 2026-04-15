import { Link } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'URL 编码/解码字符串',
  path: '/url-encoder',
  description: '将文本编码为 URL 编码格式（也称百分号编码），或从该格式解码。',
  keywords: ['url', 'encode', 'decode', 'percent', '%20', 'format'],
  component: () => import('./url-encoder.vue'),
  icon: Link,
});
