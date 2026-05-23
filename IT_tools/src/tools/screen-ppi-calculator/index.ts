import { ScreenShare } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '屏幕PPI计算器',
  path: '/screen-ppi-calculator',
  description: '计算屏幕像素密度(PPI)、物理尺寸和分辨率信息，选购显示器/手机必备',
  keywords: [
    'ppi',
    'pixels per inch',
    'pixel density',
    'screen',
    'display',
    'monitor',
    'resolution',
    'retina',
    'dpi',
    'pixel',
    'diagonal',
    '屏幕',
    '像素密度',
    '分辨率',
    '显示器',
    '手机屏幕',
    'PPI',
  ],
  component: () => import('./screen-ppi-calculator.vue'),
  icon: ScreenShare,
  createdAt: new Date('2026-05-20'),
});
