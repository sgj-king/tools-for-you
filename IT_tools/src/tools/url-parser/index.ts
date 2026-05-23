import { Unlink } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'URL 分析器',
  path: '/url-parser',
  description: '解析 URL 字符串，提取协议、来源、参数、端口、用户名密码等各个部分。',
  keywords: ['url', 'parser', 'protocol', 'origin', 'params', 'port', 'username', 'password', 'href'],
  component: () => import('./url-parser.vue'),
  icon: Unlink,
});
