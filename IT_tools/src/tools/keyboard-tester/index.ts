import { Keyboard } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '键盘测试器',
  path: '/keyboard-tester',
  description: '在线测试键盘按键是否正常工作，可视化键盘布局，按键检测与统计，支持全键盘检测',
  keywords: [
    'keyboard',
    'tester',
    'key',
    'test',
    'keyboard tester',
    'key test',
    '按键测试',
    '键盘测试',
    '键盘检测',
    '键盘检查',
    'keyboard check',
    'key checker',
    'keyboard layout',
    '键盘布局',
  ],
  component: () => import('./keyboard-tester.vue'),
  icon: Keyboard,
  createdAt: new Date('2026-05-21'),
});
