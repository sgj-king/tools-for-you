import { defineTool } from '../tool';
import FileCertIcon from '~icons/mdi/file-certificate-outline';

export const tool = defineTool({
  name: 'PDF签名检查器',
  path: '/pdf-signature-checker',
  description: '验证PDF文件的签名。签名的PDF文件包含一个或多个签名，可用于确定文件的内容在签名后是否已被更改。',
  keywords: ['pdf', 'signature', 'checker', 'verify', 'validate', 'sign'],
  component: () => import('./pdf-signature-checker.vue'),
  icon: FileCertIcon,
  createdAt: new Date('2023-12-09'),
});
