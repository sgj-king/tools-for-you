import { BrandDocker } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'Docker Run 到 docker-compose 转换器',
  path: '/docker-run-to-docker-compose-converter',
  description: '将 docker run 命令行转换为 docker-compose 文件!',
  keywords: ['docker', 'run', 'compose', 'yaml', 'yml', 'convert', 'deamon'],
  component: () => import('./docker-run-to-docker-compose-converter.vue'),
  icon: BrandDocker,
});
