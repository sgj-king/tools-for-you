import { Keyboard } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '按键信息',
  path: '/keycode-info',
  description: '查看任意按键对应的 JavaScript keycode、code、位置和修饰键信息。',
  keywords: [
    'keycode',
    'info',
    'code',
    'javascript',
    'event',
    'keycodes',
    'which',
    'keyboard',
    'press',
    'modifier',
    'alt',
    'ctrl',
    'meta',
    'shift',
  ],
  component: () => import('./keycode-info.vue'),
  icon: Keyboard,
});
