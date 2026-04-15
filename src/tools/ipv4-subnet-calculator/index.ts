import { RouterOutlined } from '@vicons/material';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: 'IPv4子网计算器',
  path: '/ipv4-subnet-calculator',
  description: '解析 IPv4 CIDR 网段，并获取所需的全部子网信息。',
  keywords: ['ipv4', 'subnet', 'calculator', 'mask', 'network', 'cidr', 'netmask', 'bitmask', 'broadcast', 'address'],
  component: () => import('./ipv4-subnet-calculator.vue'),
  icon: RouterOutlined,
});
