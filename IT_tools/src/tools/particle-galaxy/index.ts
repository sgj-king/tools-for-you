import type { Tool } from '../tools.types';
import { Planet } from '@vicons/tabler';

export const tool: Tool = {
  name: 'Particle Galaxy',
  path: '/tools/particle-galaxy',
  component: () => import('./particle-galaxy.vue'),
  icon: Planet,
  description: 'Interactive 3D particle galaxy visualization with mouse interaction',
  keywords: ['galaxy', 'particles', '3D', 'interactive', 'animation', 'visualization', 'Three.js'],
};
