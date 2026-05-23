<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useStorage } from '@vueuse/core';
import { NButton, NSlider, NSelect, NIcon, NTooltip, NColorPicker, NInputNumber, NSwitch, NScrollbar, NTabPane, NTabs, NGrid, NGi, NInput } from 'naive-ui';
import { Copy, Refresh, Code, PlayerPlay, PlayerPause, PlayerSkipForward, Settings, Check } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: 'CSS动画生成器',
    subtitle: '可视化创建CSS关键帧动画，预设效果，自定义参数，实时预览',
    animation: '动画',
    preset: '预设动画',
    custom: '自定义动画',
    duration: '持续时间',
    delay: '延迟时间',
    iteration: '重复次数',
    infinite: '无限循环',
    once: '1次',
    times: '次',
    direction: '播放方向',
    dirNormal: '正向',
    dirReverse: '反向',
    dirAlternate: '交替',
    dirAlternateReverse: '反向交替',
    timingFunction: '缓动函数',
    ease: '平滑',
    linear: '线性',
    easeIn: '渐入',
    easeOut: '渐出',
    easeInOut: '渐入渐出',
    cubicBezier: '自定义贝塞尔',
    fillMode: '填充模式',
    fillNone: '无',
    fillForwards: '保持结束',
    fillBackwards: '应用起始',
    fillBoth: '两者',
    play: '播放',
    pause: '暂停',
    replay: '重播',
    preview: '预览',
    code: 'CSS代码',
    copyCode: '复制代码',
    copied: '已复制！',
    reset: '重置',
    categoryEntrance: '入场动画',
    categoryExit: '出场动画',
    categoryAttention: '注意力动画',
    categoryMotion: '运动动画',
    categoryText: '文字动画',
    categorySpecial: '特效动画',
    customTransform: '变换参数',
    translateX: '水平位移',
    translateY: '垂直位移',
    rotate: '旋转角度',
    scale: '缩放比例',
    skewX: 'X轴倾斜',
    skewY: 'Y轴倾斜',
    opacity: '透明度',
    blur: '模糊',
    keyframes: '关键帧',
    fromState: '起始状态',
    toState: '结束状态',
    customName: '动画名称',
    previewElement: '预览元素',
    elementText: 'Aa',
    elementSize: '元素大小',
    elementColor: '元素颜色',
    elementBg: '元素背景',
    elementRadius: '元素圆角',
    exportTip: '复制CSS代码，直接粘贴到你的项目中即可使用',
    sec: '秒',
    ms: '毫秒',
    presetBounce: '弹跳',
    presetFadeIn: '淡入',
    presetFadeOut: '淡出',
    presetSlideInLeft: '左滑入',
    presetSlideInRight: '右滑入',
    presetSlideInUp: '上滑入',
    presetSlideInDown: '下滑入',
    presetZoomIn: '缩放进入',
    presetZoomOut: '缩放退出',
    presetRotateIn: '旋转进入',
    presetRotateOut: '旋转退出',
    presetPulse: '脉冲',
    presetShake: '抖动',
    presetSwing: '摇摆',
    presetWobble: '晃动',
    presetFlash: '闪烁',
    presetHeartbeat: '心跳',
    presetFlip: '翻转',
    presetRubberBand: '橡皮筋',
    presetJello: '果冻',
    presetBounceIn: '弹性进入',
    presetFadeInUp: '上浮淡入',
    presetTada: '庆祝',
    presetGlow: '发光',
    presetFloat: '漂浮',
    presetSwirl: '旋转缩放',
  },
  en: {
    title: 'CSS Animation Generator',
    subtitle: 'Visually create CSS keyframe animations with presets, custom params, and live preview',
    animation: 'Animation',
    preset: 'Presets',
    custom: 'Custom',
    duration: 'Duration',
    delay: 'Delay',
    iteration: 'Iterations',
    infinite: 'Infinite',
    once: '1x',
    times: 'times',
    direction: 'Direction',
    dirNormal: 'Normal',
    dirReverse: 'Reverse',
    dirAlternate: 'Alternate',
    dirAlternateReverse: 'Alt-Reverse',
    timingFunction: 'Timing',
    ease: 'Ease',
    linear: 'Linear',
    easeIn: 'Ease In',
    easeOut: 'Ease Out',
    easeInOut: 'Ease In-Out',
    cubicBezier: 'Custom Bezier',
    fillMode: 'Fill Mode',
    fillNone: 'None',
    fillForwards: 'Forwards',
    fillBackwards: 'Backwards',
    fillBoth: 'Both',
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    preview: 'Preview',
    code: 'CSS Code',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    reset: 'Reset',
    categoryEntrance: 'Entrance',
    categoryExit: 'Exit',
    categoryAttention: 'Attention',
    categoryMotion: 'Motion',
    categoryText: 'Text',
    categorySpecial: 'Special FX',
    customTransform: 'Transform',
    translateX: 'Translate X',
    translateY: 'Translate Y',
    rotate: 'Rotate',
    scale: 'Scale',
    skewX: 'Skew X',
    skewY: 'Skew Y',
    opacity: 'Opacity',
    blur: 'Blur',
    keyframes: 'Keyframes',
    fromState: 'Start State',
    toState: 'End State',
    customName: 'Animation Name',
    previewElement: 'Preview Element',
    elementText: 'Aa',
    elementSize: 'Element Size',
    elementColor: 'Element Color',
    elementBg: 'Element BG',
    elementRadius: 'Border Radius',
    exportTip: 'Copy the CSS code and paste it into your project',
    sec: 's',
    ms: 'ms',
    presetBounce: 'Bounce',
    presetFadeIn: 'Fade In',
    presetFadeOut: 'Fade Out',
    presetSlideInLeft: 'Slide In Left',
    presetSlideInRight: 'Slide In Right',
    presetSlideInUp: 'Slide In Up',
    presetSlideInDown: 'Slide In Down',
    presetZoomIn: 'Zoom In',
    presetZoomOut: 'Zoom Out',
    presetRotateIn: 'Rotate In',
    presetRotateOut: 'Rotate Out',
    presetPulse: 'Pulse',
    presetShake: 'Shake',
    presetSwing: 'Swing',
    presetWobble: 'Wobble',
    presetFlash: 'Flash',
    presetHeartbeat: 'Heartbeat',
    presetFlip: 'Flip',
    presetRubberBand: 'Rubber Band',
    presetJello: 'Jello',
    presetBounceIn: 'Bounce In',
    presetFadeInUp: 'Fade In Up',
    presetTada: 'Tada',
    presetGlow: 'Glow',
    presetFloat: 'Float',
    presetSwirl: 'Swirl',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== State =====================
const currentTab = ref<'preset' | 'custom'>('preset');
const selectedPreset = ref('bounce');
const isPlaying = ref(true);
const copied = ref(false);
const copiedTimer = ref<ReturnType<typeof setTimeout>>();

// Animation properties
const duration = ref(1);
const delay = ref(0);
const iterationCount = ref('infinite');
const customIteration = ref(3);
const direction = ref('normal');
const timingFunction = ref('ease');
const fillMode = ref('both');
const cubicBezier1 = ref(0.42);
const cubicBezier2 = ref(0);
const cubicBezier3 = ref(0.58);
const cubicBezier4 = ref(1);

// Preview element properties
const elementSize = ref(120);
const elementBg = ref('#6366f1');
const elementColor = ref('#ffffff');
const elementRadius = ref(16);

// Custom animation properties
const customName = ref('myAnimation');
const fromTranslateX = ref(0);
const fromTranslateY = ref(0);
const fromRotate = ref(0);
const fromScale = ref(1);
const fromSkewX = ref(0);
const fromSkewY = ref(0);
const fromOpacity = ref(1);
const fromBlur = ref(0);
const toTranslateX = ref(0);
const toTranslateY = ref(-20);
const toRotate = ref(0);
const toScale = ref(1.1);
const toSkewX = ref(0);
const toSkewY = ref(0);
const toOpacity = ref(1);
const toBlur = ref(0);

// ===================== Preset Definitions =====================
interface AnimationPreset {
  id: string;
  keyframes: string;
  category: string;
}

const presets: AnimationPreset[] = [
  // Entrance
  { id: 'fadeIn', category: 'entrance', keyframes: `@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}` },
  { id: 'fadeInUp', category: 'entrance', keyframes: `@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(30px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}` },
  { id: 'slideInLeft', category: 'entrance', keyframes: `@keyframes slideInLeft {\n  from {\n    opacity: 0;\n    transform: translateX(-100%);\n  }\n  to {\n    opacity: 1;\n    transform: translateX(0);\n  }\n}` },
  { id: 'slideInRight', category: 'entrance', keyframes: `@keyframes slideInRight {\n  from {\n    opacity: 0;\n    transform: translateX(100%);\n  }\n  to {\n    opacity: 1;\n    transform: translateX(0);\n  }\n}` },
  { id: 'slideInUp', category: 'entrance', keyframes: `@keyframes slideInUp {\n  from {\n    opacity: 0;\n    transform: translateY(100%);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}` },
  { id: 'slideInDown', category: 'entrance', keyframes: `@keyframes slideInDown {\n  from {\n    opacity: 0;\n    transform: translateY(-100%);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}` },
  { id: 'zoomIn', category: 'entrance', keyframes: `@keyframes zoomIn {\n  from {\n    opacity: 0;\n    transform: scale(0.3);\n  }\n  to {\n    opacity: 1;\n    transform: scale(1);\n  }\n}` },
  { id: 'rotateIn', category: 'entrance', keyframes: `@keyframes rotateIn {\n  from {\n    opacity: 0;\n    transform: rotate(-200deg);\n  }\n  to {\n    opacity: 1;\n    transform: rotate(0);\n  }\n}` },
  { id: 'bounceIn', category: 'entrance', keyframes: `@keyframes bounceIn {\n  0% {\n    opacity: 0;\n    transform: scale(0.3);\n  }\n  50% {\n    opacity: 1;\n    transform: scale(1.05);\n  }\n  70% {\n    transform: scale(0.9);\n  }\n  100% {\n    transform: scale(1);\n  }\n}` },

  // Exit
  { id: 'fadeOut', category: 'exit', keyframes: `@keyframes fadeOut {\n  from { opacity: 1; }\n  to { opacity: 0; }\n}` },
  { id: 'zoomOut', category: 'exit', keyframes: `@keyframes zoomOut {\n  from {\n    opacity: 1;\n    transform: scale(1);\n  }\n  to {\n    opacity: 0;\n    transform: scale(0.3);\n  }\n}` },
  { id: 'rotateOut', category: 'exit', keyframes: `@keyframes rotateOut {\n  from {\n    opacity: 1;\n    transform: rotate(0);\n  }\n  to {\n    opacity: 0;\n    transform: rotate(200deg);\n  }\n}` },

  // Attention
  { id: 'bounce', category: 'attention', keyframes: `@keyframes bounce {\n  0%, 20%, 50%, 80%, 100% {\n    transform: translateY(0);\n  }\n  40% {\n    transform: translateY(-30px);\n  }\n  60% {\n    transform: translateY(-15px);\n  }\n}` },
  { id: 'pulse', category: 'attention', keyframes: `@keyframes pulse {\n  0% {\n    transform: scale(1);\n  }\n  50% {\n    transform: scale(1.08);\n  }\n  100% {\n    transform: scale(1);\n  }\n}` },
  { id: 'shake', category: 'attention', keyframes: `@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }\n  20%, 40%, 60%, 80% { transform: translateX(10px); }\n}` },
  { id: 'swing', category: 'attention', keyframes: `@keyframes swing {\n  20% { transform: rotate(15deg); }\n  40% { transform: rotate(-10deg); }\n  60% { transform: rotate(5deg); }\n  80% { transform: rotate(-5deg); }\n  100% { transform: rotate(0deg); }\n}` },
  { id: 'wobble', category: 'attention', keyframes: `@keyframes wobble {\n  0% { transform: translateX(0) rotate(0); }\n  15% { transform: translateX(-25px) rotate(-5deg); }\n  30% { transform: translateX(20px) rotate(3deg); }\n  45% { transform: translateX(-15px) rotate(-3deg); }\n  60% { transform: translateX(10px) rotate(2deg); }\n  75% { transform: translateX(-5px) rotate(-1deg); }\n  100% { transform: translateX(0) rotate(0); }\n}` },
  { id: 'flash', category: 'attention', keyframes: `@keyframes flash {\n  0%, 50%, 100% { opacity: 1; }\n  25%, 75% { opacity: 0; }\n}` },
  { id: 'heartbeat', category: 'attention', keyframes: `@keyframes heartbeat {\n  0% { transform: scale(1); }\n  14% { transform: scale(1.3); }\n  28% { transform: scale(1); }\n  42% { transform: scale(1.3); }\n  70% { transform: scale(1); }\n}` },
  { id: 'flip', category: 'attention', keyframes: `@keyframes flip {\n  0% {\n    transform: perspective(400px) rotateY(0);\n  }\n  40% {\n    transform: perspective(400px) rotateY(170deg);\n  }\n  50% {\n    transform: perspective(400px) rotateY(190deg) scale(1);\n  }\n  80% {\n    transform: perspective(400px) rotateY(360deg) scale(0.95);\n  }\n  100% {\n    transform: perspective(400px) rotateY(360deg) scale(1);\n  }\n}` },
  { id: 'rubberBand', category: 'attention', keyframes: `@keyframes rubberBand {\n  0% { transform: scale(1, 1); }\n  30% { transform: scale(1.25, 0.75); }\n  40% { transform: scale(0.75, 1.25); }\n  50% { transform: scale(1.15, 0.85); }\n  65% { transform: scale(0.95, 1.05); }\n  75% { transform: scale(1.05, 0.95); }\n  100% { transform: scale(1, 1); }\n}` },
  { id: 'jello', category: 'attention', keyframes: `@keyframes jello {\n  0%, 100% { transform: none; }\n  11.1% { transform: skewX(-12.5deg) skewY(-12.5deg); }\n  33.3% { transform: skewX(6.25deg) skewY(6.25deg); }\n  55.5% { transform: skewX(-3.125deg) skewY(-3.125deg); }\n  77.7% { transform: skewX(1.5625deg) skewY(1.5625deg); }\n}` },
  { id: 'tada', category: 'attention', keyframes: `@keyframes tada {\n  0% { transform: scale(1) rotate(0); }\n  10%, 20% { transform: scale(0.9) rotate(-3deg); }\n  30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }\n  40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }\n  100% { transform: scale(1) rotate(0); }\n}` },

  // Motion
  { id: 'glow', category: 'motion', keyframes: `@keyframes glow {\n  0%, 100% {\n    box-shadow: 0 0 5px rgba(99, 102, 241, 0.4);\n  }\n  50% {\n    box-shadow: 0 0 20px rgba(99, 102, 241, 0.8), 0 0 40px rgba(99, 102, 241, 0.4);\n  }\n}` },
  { id: 'float', category: 'motion', keyframes: `@keyframes float {\n  0%, 100% {\n    transform: translateY(0);\n  }\n  50% {\n    transform: translateY(-10px);\n  }\n}` },
  { id: 'swirl', category: 'motion', keyframes: `@keyframes swirl {\n  0% {\n    transform: rotate(0) scale(1);\n  }\n  50% {\n    transform: rotate(180deg) scale(0.6);\n  }\n  100% {\n    transform: rotate(360deg) scale(1);\n  }\n}` },
];

// ===================== Computed =====================
const categories = computed(() => {
  const cats: Record<string, AnimationPreset[]> = {};
  for (const p of presets) {
    if (!cats[p.category]) cats[p.category] = [];
    cats[p.category].push(p);
  }
  return cats;
});

const categoryLabelMap: Record<string, string> = {
  entrance: 'categoryEntrance',
  exit: 'categoryExit',
  attention: 'categoryAttention',
  motion: 'categoryMotion',
};

const currentPreset = computed(() => presets.find(p => p.id === selectedPreset.value));

const iterationDisplay = computed(() => {
  if (iterationCount.value === 'infinite') return 'infinite';
  if (iterationCount.value === 'custom') return String(customIteration.value);
  return iterationCount.value;
});

const timingDisplay = computed(() => {
  if (timingFunction.value === 'cubic-bezier') {
    return `cubic-bezier(${cubicBezier1.value}, ${cubicBezier2.value}, ${cubicBezier3.value}, ${cubicBezier4.value})`;
  }
  return timingFunction.value;
});

// Generate the animation CSS code
const generatedCSS = computed(() => {
  if (currentTab.value === 'preset' && currentPreset.value) {
    const kf = currentPreset.value.keyframes;
    return `${kf}\n\n.${currentPreset.value.id}-element {\n  animation: ${currentPreset.value.id} ${duration.value}s ${timingDisplay.value} ${delay.value}s ${iterationDisplay.value} ${direction.value} ${fillMode.value};\n}`;
  }
  // Custom animation
  const name = customName.value || 'myAnimation';
  const fromTransform = buildTransform(fromTranslateX.value, fromTranslateY.value, fromRotate.value, fromScale.value, fromSkewX.value, fromSkewY.value);
  const toTransform = buildTransform(toTranslateX.value, toTranslateY.value, toRotate.value, toScale.value, toSkewX.value, toSkewY.value);
  let fromFilter = '';
  let toFilter = '';
  if (fromBlur.value > 0) fromFilter = `\n    filter: blur(${fromBlur.value}px);`;
  if (toBlur.value > 0) toFilter = `\n    filter: blur(${toBlur.value}px);`;

  const kf = `@keyframes ${name} {\n  from {\n    transform: ${fromTransform};\n    opacity: ${fromOpacity.value};${fromFilter}\n  }\n  to {\n    transform: ${toTransform};\n    opacity: ${toOpacity.value};${toFilter}\n  }\n}`;
  return `${kf}\n\n.${name}-element {\n  animation: ${name} ${duration.value}s ${timingDisplay.value} ${delay.value}s ${iterationDisplay.value} ${direction.value} ${fillMode.value};\n}`;
});

// Build transform string
function buildTransform(tx: number, ty: number, r: number, s: number, skx: number, sky: number): string {
  const parts: string[] = [];
  if (tx !== 0 || ty !== 0) parts.push(`translate(${tx}px, ${ty}px)`);
  if (r !== 0) parts.push(`rotate(${r}deg)`);
  if (s !== 1) parts.push(`scale(${s})`);
  if (skx !== 0 || sky !== 0) parts.push(`skew(${skx}deg, ${sky}deg)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

// Preview animation style
const previewAnimationStyle = computed(() => {
  const animName = currentTab.value === 'preset' && currentPreset.value
    ? currentPreset.value.id
    : customName.value || 'myAnimation';
  const style: Record<string, string> = {
    animationName: animName,
    animationDuration: `${duration.value}s`,
    animationTimingFunction: timingDisplay.value,
    animationDelay: `${delay.value}s`,
    animationIterationCount: iterationDisplay.value,
    animationDirection: direction.value,
    animationFillMode: fillMode.value,
    animationPlayState: isPlaying.value ? 'running' : 'paused',
  };
  return style;
});

// Build the dynamic keyframes style tag content
const dynamicKeyframesCSS = computed(() => {
  if (currentTab.value === 'preset' && currentPreset.value) {
    return currentPreset.value.keyframes;
  }
  const name = customName.value || 'myAnimation';
  const fromTransform = buildTransform(fromTranslateX.value, fromTranslateY.value, fromRotate.value, fromScale.value, fromSkewX.value, fromSkewY.value);
  const toTransform = buildTransform(toTranslateX.value, toTranslateY.value, toRotate.value, toScale.value, toSkewX.value, toSkewY.value);
  let fromFilter = '';
  let toFilter = '';
  if (fromBlur.value > 0) fromFilter = `\n    filter: blur(${fromBlur.value}px);`;
  if (toBlur.value > 0) toFilter = `\n    filter: blur(${toBlur.value}px);`;
  return `@keyframes ${name} {\n  from {\n    transform: ${fromTransform};\n    opacity: ${fromOpacity.value};${fromFilter}\n  }\n  to {\n    transform: ${toTransform};\n    opacity: ${toOpacity.value};${toFilter}\n  }\n}`;
});

// ===================== Methods =====================
function togglePlay() {
  isPlaying.value = !isPlaying.value;
}

function replayAnimation() {
  isPlaying.value = false;
  requestAnimationFrame(() => {
    isPlaying.value = true;
  });
}

function selectPreset(id: string) {
  selectedPreset.value = id;
  replayAnimation();
}

function copyCSS() {
  navigator.clipboard.writeText(generatedCSS.value);
  copied.value = true;
  if (copiedTimer.value) clearTimeout(copiedTimer.value);
  copiedTimer.value = setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function resetAll() {
  duration.value = 1;
  delay.value = 0;
  iterationCount.value = 'infinite';
  customIteration.value = 3;
  direction.value = 'normal';
  timingFunction.value = 'ease';
  fillMode.value = 'both';
  elementSize.value = 120;
  elementBg.value = '#6366f1';
  elementColor.value = '#ffffff';
  elementRadius.value = 16;
  // Reset custom
  fromTranslateX.value = 0;
  fromTranslateY.value = 0;
  fromRotate.value = 0;
  fromScale.value = 1;
  fromSkewX.value = 0;
  fromSkewY.value = 0;
  fromOpacity.value = 1;
  fromBlur.value = 0;
  toTranslateX.value = 0;
  toTranslateY.value = -20;
  toRotate.value = 0;
  toScale.value = 1.1;
  toSkewX.value = 0;
  toSkewY.value = 0;
  toOpacity.value = 1;
  toBlur.value = 0;
  replayAnimation();
}

// Direction options
const directionOptions = computed(() => [
  { label: t('dirNormal').value, value: 'normal' },
  { label: t('dirReverse').value, value: 'reverse' },
  { label: t('dirAlternate').value, value: 'alternate' },
  { label: t('dirAlternateReverse').value, value: 'alternate-reverse' },
]);

const timingOptions = computed(() => [
  { label: t('ease').value, value: 'ease' },
  { label: t('linear').value, value: 'linear' },
  { label: t('easeIn').value, value: 'ease-in' },
  { label: t('easeOut').value, value: 'ease-out' },
  { label: t('easeInOut').value, value: 'ease-in-out' },
  { label: t('cubicBezier').value, value: 'cubic-bezier' },
]);

const fillOptions = computed(() => [
  { label: t('fillNone').value, value: 'none' },
  { label: t('fillForwards').value, value: 'forwards' },
  { label: t('fillBackwards').value, value: 'backwards' },
  { label: t('fillBoth').value, value: 'both' },
]);

const iterationOptions = computed(() => [
  { label: t('infinite').value, value: 'infinite' },
  { label: t('once').value, value: '1' },
  { label: '2x', value: '2' },
  { label: '3x', value: '3' },
  { label: '5x', value: '5' },
  { label: `${t('custom').value}`, value: 'custom' },
]);

function presetLabel(id: string): string {
  const key = `preset${id.charAt(0).toUpperCase()}${id.slice(1)}` as keyof typeof labels.zh;
  return labels[lang.value][key] || id;
}

function categoryLabel(cat: string): string {
  const key = categoryLabelMap[cat] as keyof typeof labels.zh;
  return labels[lang.value][key] || cat;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1100px">
      <!-- Dynamic keyframes style injection -->
      <component :is="'style'">{{ dynamicKeyframesCSS }}</component>

      <div flex gap-4 flex-col lg:flex-row>
        <!-- Left: Controls -->
        <div flex-1 min-w-0>
          <!-- Animation Type Tabs -->
          <c-card mb-4>
            <div flex items-center justify-between mb-4>
              <div text-lg font-bold>{{ t('animation').value }}</div>
              <n-button size="small" quaternary @click="resetAll">
                <template #icon><n-icon><Refresh /></n-icon></template>
                {{ t('reset').value }}
              </n-button>
            </div>
            <n-tabs v-model:value="currentTab" type="segment" mb-4>
              <n-tab-pane :name="'preset'" :tab="t('preset').value" />
              <n-tab-pane :name="'custom'" :tab="t('custom').value" />
            </n-tabs>

            <!-- Preset Grid -->
            <template v-if="currentTab === 'preset'">
              <div v-for="(presetsInCat, cat) in categories" :key="cat" mb-4>
                <div text-sm font-bold op-70 mb-2>{{ categoryLabel(cat) }}</div>
                <div flex flex-wrap gap-2>
                  <n-button
                    v-for="p in presetsInCat"
                    :key="p.id"
                    :type="selectedPreset === p.id ? 'primary' : 'default'"
                    size="small"
                    @click="selectPreset(p.id)"
                  >
                    {{ presetLabel(p.id) }}
                  </n-button>
                </div>
              </div>
            </template>

            <!-- Custom Animation -->
            <template v-else>
              <div mb-3>
                <div text-sm op-70 mb-1>{{ t('customName').value }}</div>
                <n-input v-model:value="customName" placeholder="myAnimation" size="small" />
              </div>

              <n-grid :cols="2" :x-gap="12" :y-gap="8">
                <n-gi>
                  <div p-4 rounded-lg bg-dark-200>
                    <div text-xs font-bold op-60 mb-3>{{ t('fromState').value }}</div>
                    <div space-y-2>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('translateX').value }}</span>
                        <n-slider v-model:value="fromTranslateX" :min="-200" :max="200" :step="1" />
                        <span text-xs op-60 w-14 text-right>{{ fromTranslateX }}px</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('translateY').value }}</span>
                        <n-slider v-model:value="fromTranslateY" :min="-200" :max="200" :step="1" />
                        <span text-xs op-60 w-14 text-right>{{ fromTranslateY }}px</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('rotate').value }}</span>
                        <n-slider v-model:value="fromRotate" :min="-360" :max="360" :step="1" />
                        <span text-xs op-60 w-14 text-right>{{ fromRotate }}°</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('scale').value }}</span>
                        <n-slider v-model:value="fromScale" :min="0" :max="3" :step="0.05" />
                        <span text-xs op-60 w-14 text-right>{{ fromScale }}</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('opacity').value }}</span>
                        <n-slider v-model:value="fromOpacity" :min="0" :max="1" :step="0.05" />
                        <span text-xs op-60 w-14 text-right>{{ fromOpacity }}</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('blur').value }}</span>
                        <n-slider v-model:value="fromBlur" :min="0" :max="20" :step="0.5" />
                        <span text-xs op-60 w-14 text-right>{{ fromBlur }}px</span>
                      </div>
                    </div>
                  </div>
                </n-gi>
                <n-gi>
                  <div p-4 rounded-lg bg-dark-200>
                    <div text-xs font-bold op-60 mb-3>{{ t('toState').value }}</div>
                    <div space-y-2>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('translateX').value }}</span>
                        <n-slider v-model:value="toTranslateX" :min="-200" :max="200" :step="1" />
                        <span text-xs op-60 w-14 text-right>{{ toTranslateX }}px</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('translateY').value }}</span>
                        <n-slider v-model:value="toTranslateY" :min="-200" :max="200" :step="1" />
                        <span text-xs op-60 w-14 text-right>{{ toTranslateY }}px</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('rotate').value }}</span>
                        <n-slider v-model:value="toRotate" :min="-360" :max="360" :step="1" />
                        <span text-xs op-60 w-14 text-right>{{ toRotate }}°</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('scale').value }}</span>
                        <n-slider v-model:value="toScale" :min="0" :max="3" :step="0.05" />
                        <span text-xs op-60 w-14 text-right>{{ toScale }}</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('opacity').value }}</span>
                        <n-slider v-model:value="toOpacity" :min="0" :max="1" :step="0.05" />
                        <span text-xs op-60 w-14 text-right>{{ toOpacity }}</span>
                      </div>
                      <div flex items-center gap-2>
                        <span text-xs op-60 w-16>{{ t('blur').value }}</span>
                        <n-slider v-model:value="toBlur" :min="0" :max="20" :step="0.5" />
                        <span text-xs op-60 w-14 text-right>{{ toBlur }}px</span>
                      </div>
                    </div>
                  </div>
                </n-gi>
              </n-grid>
            </template>
          </c-card>

          <!-- Animation Properties -->
          <c-card mb-4>
            <div text-lg font-bold mb-4>{{ t('animation').value }}</div>
            <div space-y-3>
              <!-- Duration -->
              <div flex items-center gap-3>
                <span text-sm op-70 w-24>{{ t('duration').value }}</span>
                <n-slider v-model:value="duration" :min="0.1" :max="10" :step="0.1" />
                <span text-sm op-70 w-16 text-right>{{ duration }}{{ t('sec').value }}</span>
              </div>

              <!-- Delay -->
              <div flex items-center gap-3>
                <span text-sm op-70 w-24>{{ t('delay').value }}</span>
                <n-slider v-model:value="delay" :min="0" :max="5" :step="0.1" />
                <span text-sm op-70 w-16 text-right>{{ delay }}{{ t('sec').value }}</span>
              </div>

              <!-- Iteration Count -->
              <div flex items-center gap-3>
                <span text-sm op-70 w-24>{{ t('iteration').value }}</span>
                <n-select v-model:value="iterationCount" :options="iterationOptions" size="small" style="width: 140px" />
                <n-input-number
                  v-if="iterationCount === 'custom'"
                  v-model:value="customIteration"
                  :min="1"
                  :max="100"
                  size="small"
                  style="width: 80px"
                />
              </div>

              <!-- Direction -->
              <div flex items-center gap-3>
                <span text-sm op-70 w-24>{{ t('direction').value }}</span>
                <n-select v-model:value="direction" :options="directionOptions" size="small" style="width: 160px" />
              </div>

              <!-- Timing Function -->
              <div flex items-center gap-3>
                <span text-sm op-70 w-24>{{ t('timingFunction').value }}</span>
                <n-select v-model:value="timingFunction" :options="timingOptions" size="small" style="width: 160px" />
              </div>

              <!-- Cubic Bezier -->
              <div v-if="timingFunction === 'cubic-bezier'" p-3 rounded-lg bg-dark-200>
                <div flex items-center gap-2 mb-2>
                  <span text-xs op-60>cubic-bezier(</span>
                  <n-input-number v-model:value="cubicBezier1" :min="-1" :max="1" :step="0.01" size="tiny" style="width: 70px" />
                  <span text-xs>,</span>
                  <n-input-number v-model:value="cubicBezier2" :min="-1" :max="1" :step="0.01" size="tiny" style="width: 70px" />
                  <span text-xs>,</span>
                  <n-input-number v-model:value="cubicBezier3" :min="-1" :max="1" :step="0.01" size="tiny" style="width: 70px" />
                  <span text-xs>,</span>
                  <n-input-number v-model:value="cubicBezier4" :min="-1" :max="1" :step="0.01" size="tiny" style="width: 70px" />
                  <span text-xs>)</span>
                </div>
                <!-- Simple bezier curve visualization -->
                <svg viewBox="0 0 200 100" style="width: 100%; height: 80px; opacity: 0.6">
                  <line x1="0" y1="100" x2="200" y2="0" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
                  <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
                  <line x1="200" y1="0" x2="200" y2="100" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
                  <path
                    :d="`M 0 100 C ${(cubicBezier1 * 200).toFixed(0)} ${100 - cubicBezier2 * 100}, ${(cubicBezier3 * 200).toFixed(0)} ${100 - cubicBezier4 * 100}, 200 0`"
                    fill="none"
                    stroke="#6366f1"
                    stroke-width="2"
                  />
                  <circle :cx="(cubicBezier1 * 200).toFixed(0)" :cy="100 - cubicBezier2 * 100" r="4" fill="#818cf8" />
                  <circle :cx="(cubicBezier3 * 200).toFixed(0)" :cy="100 - cubicBezier4 * 100" r="4" fill="#818cf8" />
                </svg>
              </div>

              <!-- Fill Mode -->
              <div flex items-center gap-3>
                <span text-sm op-70 w-24>{{ t('fillMode').value }}</span>
                <n-select v-model:value="fillMode" :options="fillOptions" size="small" style="width: 160px" />
              </div>
            </div>
          </c-card>

          <!-- Preview Element Settings -->
          <c-card>
            <div text-lg font-bold mb-4>{{ t('previewElement').value }}</div>
            <n-grid :cols="2" :x-gap="12" :y-gap="8">
              <n-gi>
                <div flex items-center gap-3>
                  <span text-sm op-70 w-20>{{ t('elementSize').value }}</span>
                  <n-slider v-model:value="elementSize" :min="40" :max="200" :step="5" />
                  <span text-xs op-60 w-12 text-right>{{ elementSize }}px</span>
                </div>
              </n-gi>
              <n-gi>
                <div flex items-center gap-3>
                  <span text-sm op-70 w-20>{{ t('elementRadius').value }}</span>
                  <n-slider v-model:value="elementRadius" :min="0" :max="100" :step="1" />
                  <span text-xs op-60 w-12 text-right>{{ elementRadius }}px</span>
                </div>
              </n-gi>
              <n-gi>
                <div flex items-center gap-3>
                  <span text-sm op-70 w-20>{{ t('elementBg').value }}</span>
                  <n-color-picker v-model:value="elementBg" :modes="['hex']" size="small" :swatches="['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4']" />
                </div>
              </n-gi>
              <n-gi>
                <div flex items-center gap-3>
                  <span text-sm op-70 w-20>{{ t('elementColor').value }}</span>
                  <n-color-picker v-model:value="elementColor" :modes="['hex']" size="small" :swatches="['#ffffff','#000000','#f8fafc','#1e293b']" />
                </div>
              </n-gi>
            </n-grid>
          </c-card>
        </div>

        <!-- Right: Preview & Code -->
        <div flex-1 min-w-0>
          <!-- Preview Card -->
          <c-card mb-4>
            <div flex items-center justify-between mb-4>
              <div text-lg font-bold>{{ t('preview').value }}</div>
              <div flex gap-2>
                <n-button size="small" quaternary :type="isPlaying ? 'primary' : 'default'" @click="togglePlay">
                  <template #icon>
                    <n-icon><component :is="isPlaying ? PlayerPause : PlayerPlay" /></n-icon>
                  </template>
                  {{ isPlaying ? t('pause').value : t('play').value }}
                </n-button>
                <n-button size="small" quaternary @click="replayAnimation">
                  <template #icon>
                    <n-icon><PlayerSkipForward /></n-icon>
                  </template>
                  {{ t('replay').value }}
                </n-button>
                <n-button size="small" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
                  {{ lang === 'zh' ? 'EN' : '中' }}
                </n-button>
              </div>
            </div>

            <!-- Preview Area -->
            <div class="preview-area" flex items-center justify-center>
              <div
                class="preview-element"
                :style="{
                  width: `${elementSize}px`,
                  height: `${elementSize}px`,
                  backgroundColor: elementBg,
                  color: elementColor,
                  borderRadius: `${elementRadius}px`,
                  ...previewAnimationStyle,
                }"
                flex items-center justify-center
                text-2xl font-bold select-none
              >
                Aa
              </div>
            </div>
          </c-card>

          <!-- Code Output Card -->
          <c-card>
            <div flex items-center justify-between mb-4>
              <div text-lg font-bold>{{ t('code').value }}</div>
              <n-button :type="copied ? 'success' : 'primary'" size="small" @click="copyCSS">
                <template #icon>
                  <n-icon><component :is="copied ? Check : Copy" /></n-icon>
                </template>
                {{ copied ? t('copied').value : t('copyCode').value }}
              </n-button>
            </div>

            <div class="code-block">
              <pre><code>{{ generatedCSS }}</code></pre>
            </div>

            <div mt-3 text-xs op-50 flex items-center gap-1>
              <n-icon size="14"><Code /></n-icon>
              {{ t('exportTip').value }}
            </div>
          </c-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-dark-200 {
  background: rgba(255, 255, 255, 0.05);
}

.preview-area {
  min-height: 260px;
  background:
    radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.06) 0%, transparent 50%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.preview-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.preview-element {
  font-family: system-ui, -apple-system, sans-serif;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  will-change: transform, opacity;
}

.code-block {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e2e8f0;
  white-space: pre;
}

.code-block code {
  color: inherit;
}
</style>
