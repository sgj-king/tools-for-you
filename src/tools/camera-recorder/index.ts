import { Camera } from '@vicons/tabler';
import { defineTool } from '../tool';
export const tool = defineTool({
  name: '摄像头录制器',
  path: '/camera-recorder',
  description: '从网络摄像头或照相机拍摄照片或录制视频。',
  keywords: ['camera', 'recoder'],
  component: () => import('./camera-recorder.vue'),
  icon: Camera,
  createdAt: new Date('2023-05-15'),
});
