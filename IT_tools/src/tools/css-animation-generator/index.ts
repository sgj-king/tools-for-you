import { Wand as Animation } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'CSS动画生成器',
  path: '/css-animation-generator',
  description: '可视化创建CSS关键帧动画，预设动画效果，自定义参数调节，实时预览，一键复制代码',
  keywords: [
    'css', 'animation', 'keyframes', 'transform', 'transition',
    'bounce', 'fade', 'slide', 'rotate', 'scale', 'pulse', 'shake',
    'css3', 'motion', 'effect', 'frontend', 'ui',
    '动画', 'CSS动画', '关键帧', '变换', '过渡', '弹跳', '淡入淡出', '滑动', '旋转', '缩放',
  ],
  component: () => import('./css-animation-generator.vue'),
  icon: Animation,
  createdAt: new Date('2026-05-13'),
});
