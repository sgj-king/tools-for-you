<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { NSwitch, NButton, NIcon, NProgress } from 'naive-ui';
import { Refresh } from '@vicons/tabler';
import { VolumeUpRound as VolumeHigh, VolumeOffRound as VolumeOff } from '@vicons/material';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '键盘测试器',
    subtitle: '在线检测键盘按键是否正常工作，可视化键盘布局实时反馈',
    pressAnyKey: '按下任意键开始测试...',
    lastKey: '最后按键',
    keyCode: '键码',
    code: '代码',
    key: '键名',
    location: '位置',
    modifiers: '修饰键',
    pressed: '已按下',
    total: '总按键数',
    unique: '不同按键',
    coverage: '覆盖率',
    reset: '重置',
    resetConfirm: '确定要重置所有测试数据吗？',
    sound: '按键音效',
    soundOn: '开',
    soundOff: '关',
    highlightTested: '高亮已测试',
    tested: '已测试',
    untested: '未测试',
    totalKeys: '总键数',
    keyInfo: '按键详情',
    status: '状态',
    normal: '正常',
    keyDown: '按下',
    keyUp: '抬起',
    pressCount: '按下次数',
    lastPressTime: '最后按下',
    history: '按键历史',
    noHistory: '暂无按键记录',
    clearHistory: '清空',
    tips: '使用说明',
    tip1: '按下键盘上的任意按键，对应的虚拟键会高亮显示',
    tip2: '绿色表示按键已正常响应，红色闪烁表示当前正在按下',
    tip3: '底部面板显示按键的详细信息，包括键码、修饰键等',
    tip4: '点击"重置"可以清除所有测试数据重新开始',
    warning: '提示',
    warningContent: '浏览器可能会拦截某些系统快捷键（如 Ctrl+W、Alt+F4 等），这些按键可能无法在测试器中捕获。请使用浏览器允许的按键进行测试。',
    functionRow: '功能键',
    numberRow: '数字键',
    letterRow: '字母键',
    modifierRow: '修饰键',
    navigationRow: '导航键',
    notTested: '未测试',
  },
  en: {
    title: 'Keyboard Tester',
    subtitle: 'Test your keyboard keys online with visual layout and real-time feedback',
    pressAnyKey: 'Press any key to start testing...',
    lastKey: 'Last Key',
    keyCode: 'Key Code',
    code: 'Code',
    key: 'Key',
    location: 'Location',
    modifiers: 'Modifiers',
    pressed: 'Pressed',
    total: 'Total Presses',
    unique: 'Unique Keys',
    coverage: 'Coverage',
    reset: 'Reset',
    resetConfirm: 'Are you sure you want to reset all test data?',
    sound: 'Key Sound',
    soundOn: 'On',
    soundOff: 'Off',
    highlightTested: 'Highlight Tested',
    tested: 'Tested',
    untested: 'Untested',
    totalKeys: 'Total Keys',
    keyInfo: 'Key Details',
    status: 'Status',
    normal: 'Normal',
    keyDown: 'Down',
    keyUp: 'Up',
    pressCount: 'Press Count',
    lastPressTime: 'Last Press',
    history: 'Key History',
    noHistory: 'No key presses recorded',
    clearHistory: 'Clear',
    tips: 'Tips',
    tip1: 'Press any key on your keyboard, the corresponding virtual key will highlight',
    tip2: 'Green indicates the key responded normally, red flash means currently pressed',
    tip3: 'The bottom panel shows key details including key code, modifiers, etc.',
    tip4: 'Click "Reset" to clear all test data and start over',
    warning: 'Notice',
    warningContent: 'Browser may intercept certain system shortcuts (e.g., Ctrl+W, Alt+F4), these keys may not be captured in the tester. Use browser-permitted keys for testing.',
    functionRow: 'Function Keys',
    numberRow: 'Number Keys',
    letterRow: 'Letter Keys',
    modifierRow: 'Modifier Keys',
    navigationRow: 'Navigation Keys',
    notTested: 'Not Tested',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// State
const pressedKeys = ref<Set<string>>(new Set());
const testedKeys = ref<Map<string, { count: number; lastTime: number }>>(new Map());
const lastEvent = ref<KeyboardEvent | null>(null);
const currentKeyState = ref<'down' | 'up' | null>(null);
const totalPresses = ref(0);
const soundEnabled = ref(true);
const highlightMode = ref(true);
const showResetConfirm = ref(false);
const history = ref<Array<{ key: string; code: string; time: number }>>([]);

// Audio context for key sound
let audioCtx: AudioContext | null = null;

function playKeySound() {
  if (!soundEnabled.value) return;
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 800 + Math.random() * 400;
    osc.type = 'sine';
    gain.gain.value = 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch {}
}

// Key layout definition
// Each key: { code: string, label: string, width?: number (in units, 1 unit = 48px + 4px gap) }
const keyboardLayout = computed(() => ({
  functionRow: [
    { code: 'Escape', label: 'Esc', width: 1 },
    { code: 'F1', label: 'F1', width: 1 },
    { code: 'F2', label: 'F2', width: 1 },
    { code: 'F3', label: 'F3', width: 1 },
    { code: 'F4', label: 'F4', width: 1 },
    { code: 'F5', label: 'F5', width: 1 },
    { code: 'F6', label: 'F6', width: 1 },
    { code: 'F7', label: 'F7', width: 1 },
    { code: 'F8', label: 'F8', width: 1 },
    { code: 'F9', label: 'F9', width: 1 },
    { code: 'F10', label: 'F10', width: 1 },
    { code: 'F11', label: 'F11', width: 1 },
    { code: 'F12', label: 'F12', width: 1 },
  ],
  numberRow: [
    { code: 'Backquote', label: '`', width: 1 },
    { code: 'Digit1', label: '1', width: 1 },
    { code: 'Digit2', label: '2', width: 1 },
    { code: 'Digit3', label: '3', width: 1 },
    { code: 'Digit4', label: '4', width: 1 },
    { code: 'Digit5', label: '5', width: 1 },
    { code: 'Digit6', label: '6', width: 1 },
    { code: 'Digit7', label: '7', width: 1 },
    { code: 'Digit8', label: '8', width: 1 },
    { code: 'Digit9', label: '9', width: 1 },
    { code: 'Digit0', label: '0', width: 1 },
    { code: 'Minus', label: '-', width: 1 },
    { code: 'Equal', label: '=', width: 1 },
    { code: 'Backspace', label: '⌫', width: 2 },
  ],
  row1: [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q', width: 1 },
    { code: 'KeyW', label: 'W', width: 1 },
    { code: 'KeyE', label: 'E', width: 1 },
    { code: 'KeyR', label: 'R', width: 1 },
    { code: 'KeyT', label: 'T', width: 1 },
    { code: 'KeyY', label: 'Y', width: 1 },
    { code: 'KeyU', label: 'U', width: 1 },
    { code: 'KeyI', label: 'I', width: 1 },
    { code: 'KeyO', label: 'O', width: 1 },
    { code: 'KeyP', label: 'P', width: 1 },
    { code: 'BracketLeft', label: '[', width: 1 },
    { code: 'BracketRight', label: ']', width: 1 },
    { code: 'Backslash', label: '\\', width: 1.5 },
  ],
  row2: [
    { code: 'CapsLock', label: 'Caps', width: 1.75 },
    { code: 'KeyA', label: 'A', width: 1 },
    { code: 'KeyS', label: 'S', width: 1 },
    { code: 'KeyD', label: 'D', width: 1 },
    { code: 'KeyF', label: 'F', width: 1 },
    { code: 'KeyG', label: 'G', width: 1 },
    { code: 'KeyH', label: 'H', width: 1 },
    { code: 'KeyJ', label: 'J', width: 1 },
    { code: 'KeyK', label: 'K', width: 1 },
    { code: 'KeyL', label: 'L', width: 1 },
    { code: 'Semicolon', label: ';', width: 1 },
    { code: 'Quote', label: "'", width: 1 },
    { code: 'Enter', label: 'Enter', width: 2.25 },
  ],
  row3: [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    { code: 'KeyZ', label: 'Z', width: 1 },
    { code: 'KeyX', label: 'X', width: 1 },
    { code: 'KeyC', label: 'C', width: 1 },
    { code: 'KeyV', label: 'V', width: 1 },
    { code: 'KeyB', label: 'B', width: 1 },
    { code: 'KeyN', label: 'N', width: 1 },
    { code: 'KeyM', label: 'M', width: 1 },
    { code: 'Comma', label: ',', width: 1 },
    { code: 'Period', label: '.', width: 1 },
    { code: 'Slash', label: '/', width: 1 },
    { code: 'ShiftRight', label: 'Shift', width: 2.75 },
  ],
  row4: [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
    { code: 'MetaLeft', label: 'Win', width: 1.25 },
    { code: 'AltLeft', label: 'Alt', width: 1.25 },
    { code: 'Space', label: 'Space', width: 6.25 },
    { code: 'AltRight', label: 'Alt', width: 1.25 },
    { code: 'MetaRight', label: 'Win', width: 1.25 },
    { code: 'ContextMenu', label: 'Menu', width: 1.25 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.25 },
  ],
  navigationRow: [
    { code: 'PrintScreen', label: 'PrtSc', width: 1 },
    { code: 'ScrollLock', label: 'ScrLk', width: 1 },
    { code: 'Pause', label: 'Pause', width: 1 },
    { code: 'Insert', label: 'Ins', width: 1 },
    { code: 'Home', label: 'Home', width: 1 },
    { code: 'PageUp', label: 'PgUp', width: 1 },
    { code: 'Delete', label: 'Del', width: 1 },
    { code: 'End', label: 'End', width: 1 },
    { code: 'PageDown', label: 'PgDn', width: 1 },
  ],
  arrowRow: [
    { code: '', label: '', width: 1, spacer: true },
    { code: '', label: '', width: 1, spacer: true },
    { code: '', label: '', width: 1, spacer: true },
    { code: '', label: '', width: 1, spacer: true },
    { code: '', label: '', width: 1, spacer: true },
    { code: '', label: '', width: 1, spacer: true },
    { code: 'ArrowLeft', label: '←', width: 1 },
    { code: 'ArrowUp', label: '↑', width: 1 },
    { code: 'ArrowDown', label: '↓', width: 1 },
    { code: 'ArrowRight', label: '→', width: 1 },
  ],
}));

// Flatten all testable keys
const allKeys = computed(() => {
  const layout = keyboardLayout.value;
  return [
    ...layout.functionRow,
    ...layout.numberRow,
    ...layout.row1,
    ...layout.row2,
    ...layout.row3,
    ...layout.row4,
    ...layout.navigationRow,
    ...layout.arrowRow,
  ].filter(k => !k.spacer && k.code);
});

const totalKeyCount = computed(() => allKeys.value.length);
const testedKeyCount = computed(() => testedKeys.value.size);
const coveragePercent = computed(() => {
  if (totalKeyCount.value === 0) return 0;
  return Math.round((testedKeyCount.value / totalKeyCount.value) * 100);
});

// Key event handlers
function onKeyDown(e: KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();

  pressedKeys.value.add(e.code);
  currentKeyState.value = 'down';
  lastEvent.value = e;
  totalPresses.value++;

  // Update tested keys
  const existing = testedKeys.value.get(e.code);
  testedKeys.value.set(e.code, {
    count: existing ? existing.count + 1 : 1,
    lastTime: Date.now(),
  });

  // Add to history
  history.value.unshift({
    key: e.key,
    code: e.code,
    time: Date.now(),
  });
  if (history.value.length > 50) {
    history.value = history.value.slice(0, 50);
  }

  playKeySound();
}

function onKeyUp(e: KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();
  pressedKeys.value.delete(e.code);
  currentKeyState.value = 'up';
}

function getKeyStyle(key: { code: string; width?: number; spacer?: boolean }) {
  if (key.spacer) {
    return {
      visibility: 'hidden' as const,
    };
  }
  const isPressed = pressedKeys.value.has(key.code);
  const isTested = testedKeys.value.has(key.code);

  let bg: string;
  let border: string;
  let shadow: string;

  if (isPressed) {
    bg = 'linear-gradient(135deg, #ef4444, #dc2626)';
    border = '1px solid rgba(239,68,68,0.6)';
    shadow = '0 0 16px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.15)';
  } else if (isTested && highlightMode.value) {
    bg = 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15))';
    border = '1px solid rgba(34,197,94,0.4)';
    shadow = '0 0 8px rgba(34,197,94,0.15)';
  } else {
    bg = 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))';
    border = '1px solid rgba(255,255,255,0.1)';
    shadow = '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)';
  }

  const width = (key.width || 1) * 48 + ((key.width || 1) - 1) * 4;

  return {
    width: `${width}px`,
    background: bg,
    border,
    boxShadow: shadow,
    transition: 'all 0.1s ease',
  };
}

function getKeyLabelStyle(key: { code: string; spacer?: boolean }) {
  if (key.spacer) return {};
  const isPressed = pressedKeys.value.has(key.code);
  const isTested = testedKeys.value.has(key.code);
  let color = 'rgba(255,255,255,0.7)';
  if (isPressed) color = '#fff';
  else if (isTested && highlightMode.value) color = 'rgba(34,197,94,0.9)';
  return { color, fontWeight: isPressed ? 'bold' : 'normal' };
}

// Location description
function getLocationLabel(loc: number) {
  const locations: Record<number, string> = {
    0: 'Standard',
    1: 'Left',
    2: 'Right',
    3: 'Numpad',
  };
  return locations[loc] || 'Unknown';
}

// Format time
function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

// Reset
function resetAll() {
  pressedKeys.value.clear();
  testedKeys.value.clear();
  lastEvent.value = null;
  currentKeyState.value = null;
  totalPresses.value = 0;
  history.value = [];
  showResetConfirm.value = false;
}

// Event listeners
onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown, true);
  window.removeEventListener('keyup', onKeyUp, true);
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
});
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1100px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <!-- Title & Subtitle -->
      <div text-center mb-4>
        <div text-2xl font-bold mb-1>⌨️ {{ t('title').value }}</div>
        <div text-sm op-60>{{ t('subtitle').value }}</div>
      </div>

      <!-- Status Bar -->
      <c-card mb-4>
        <div flex items-center justify-between flex-wrap gap-3>
          <!-- Left: Stats -->
          <div flex items-center gap-4>
            <div text-center>
              <div text-2xl font-bold :style="{ color: coveragePercent >= 80 ? '#22c55e' : coveragePercent >= 50 ? '#eab308' : '#3b82f6' }">
                {{ testedKeyCount }}
              </div>
              <div text-xs op-50>{{ t('tested').value }}</div>
            </div>
            <div text-center>
              <div text-2xl font-bold op-60>{{ totalKeyCount }}</div>
              <div text-xs op-50>{{ t('totalKeys').value }}</div>
            </div>
            <div text-center>
              <div text-2xl font-bold op-60>{{ totalPresses }}</div>
              <div text-xs op-50>{{ t('total').value }}</div>
            </div>
            <div style="min-width: 120px;">
              <n-progress
                type="line"
                :percentage="coveragePercent"
                :color="coveragePercent >= 80 ? '#22c55e' : coveragePercent >= 50 ? '#eab308' : '#3b82f6'"
                :height="8"
                :border-radius="4"
                indicator-placement="inside"
              />
              <div text-xs op-50 text-center mt-1>{{ t('coverage').value }}</div>
            </div>
          </div>

          <!-- Right: Controls -->
          <div flex items-center gap-3>
            <div flex items-center gap-2>
              <span text-xs op-50>{{ t('sound').value }}</span>
              <n-switch
                :value="soundEnabled"
                @update:value="soundEnabled = $event"
                size="small"
              >
                <template #checked>
                  <n-icon><VolumeHigh /></n-icon>
                </template>
                <template #unchecked>
                  <n-icon><VolumeOff /></n-icon>
                </template>
              </n-switch>
            </div>
            <div flex items-center gap-2>
              <span text-xs op-50>{{ t('highlightTested').value }}</span>
              <n-switch
                :value="highlightMode"
                @update:value="highlightMode = $event"
                size="small"
              />
            </div>
            <n-button
              quaternary
              round
              size="small"
              type="warning"
              @click="showResetConfirm = true"
            >
              <template #icon><n-icon><Refresh /></n-icon></template>
              {{ t('reset').value }}
            </n-button>
          </div>
        </div>
      </c-card>

      <!-- Keyboard Layout -->
      <c-card mb-4>
        <!-- Current Key Indicator -->
        <div text-center mb-4 p-3 rounded-xl style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
          <template v-if="lastEvent">
            <div text-4xl font-bold mb-1 :style="{ color: currentKeyState === 'down' ? '#ef4444' : '#22c55e' }">
              {{ lastEvent.key === ' ' ? 'Space' : lastEvent.key }}
            </div>
            <div flex justify-center gap-4 text-xs op-60>
              <span>{{ t('code').value }}: <span font-mono op-80>{{ lastEvent.code }}</span></span>
              <span>{{ t('keyCode').value }}: <span font-mono op-80>{{ lastEvent.keyCode }}</span></span>
              <span :style="{ color: currentKeyState === 'down' ? '#ef4444' : '#22c55e' }">
                {{ currentKeyState === 'down' ? t('keyDown').value : t('keyUp').value }}
              </span>
            </div>
          </template>
          <template v-else>
            <div text-lg op-40>🎹 {{ t('pressAnyKey').value }}</div>
          </template>
        </div>

        <!-- Keyboard Visual -->
        <div flex flex-col items-center gap-1.5 select-none style="overflow-x: auto; padding-bottom: 8px;">
          <!-- Function Row -->
          <div text-xs op-40 mb-0.5 self-start pl-1>{{ t('functionRow').value }}</div>
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.functionRow"
              :key="key.code"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              class="key-cap"
            >
              <span :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>

          <!-- Gap -->
          <div h-2></div>

          <!-- Number Row -->
          <div text-xs op-40 mb-0.5 self-start pl-1>{{ t('numberRow').value }}</div>
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.numberRow"
              :key="key.code"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              class="key-cap"
            >
              <span :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>

          <!-- Row 1 (QWERTY) -->
          <div text-xs op-40 mb-0.5 self-start pl-1>{{ t('letterRow').value }}</div>
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.row1"
              :key="key.code"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              class="key-cap"
            >
              <span :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>

          <!-- Row 2 (ASDF) -->
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.row2"
              :key="key.code"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              class="key-cap"
            >
              <span :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>

          <!-- Row 3 (ZXCV) -->
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.row3"
              :key="key.code"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              class="key-cap"
            >
              <span :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>

          <!-- Row 4 (Modifiers + Space) -->
          <div text-xs op-40 mb-0.5 self-start pl-1>{{ t('modifierRow').value }}</div>
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.row4"
              :key="key.code"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              class="key-cap"
            >
              <span :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>

          <!-- Gap -->
          <div h-2></div>

          <!-- Navigation Row -->
          <div text-xs op-40 mb-0.5 self-start pl-1>{{ t('navigationRow').value }}</div>
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.navigationRow"
              :key="key.code"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              class="key-cap"
            >
              <span :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>

          <!-- Arrow Row -->
          <div flex gap-1>
            <div
              v-for="key in keyboardLayout.arrowRow"
              :key="key.code + key.label"
              :style="getKeyStyle(key)"
              rounded-md flex items-center justify-center h-10 cursor-default
              :class="{ 'key-cap': !key.spacer }"
            >
              <span v-if="!key.spacer" :style="getKeyLabelStyle(key)" text-xs>{{ key.label }}</span>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div flex justify-center gap-6 mt-4 text-xs op-60>
          <div flex items-center gap-2>
            <div w-4 h-4 rounded style="background: linear-gradient(135deg, #ef4444, #dc2626); border: 1px solid rgba(239,68,68,0.6);"></div>
            <span>{{ t('keyDown').value }}</span>
          </div>
          <div flex items-center gap-2>
            <div w-4 h-4 rounded style="background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.15)); border: 1px solid rgba(34,197,94,0.4);"></div>
            <span>{{ t('tested').value }}</span>
          </div>
          <div flex items-center gap-2>
            <div w-4 h-4 rounded style="background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); border: 1px solid rgba(255,255,255,0.1);"></div>
            <span>{{ t('notTested').value }}</span>
          </div>
        </div>
      </c-card>

      <!-- Key Details & History -->
      <div grid grid-cols-1 md:grid-cols-2 gap-4 mb-4>
        <!-- Key Info -->
        <c-card>
          <div text-sm font-bold mb-3>🔍 {{ t('keyInfo').value }}</div>
          <template v-if="lastEvent">
            <div grid grid-cols-2 gap-2>
              <div p-2.5 rounded-lg style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);">
                <div text-xs text-blue-400 mb-0.5>{{ t('key').value }}</div>
                <div text-sm font-bold font-mono>{{ lastEvent.key === ' ' ? 'Space' : lastEvent.key }}</div>
              </div>
              <div p-2.5 rounded-lg style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.15);">
                <div text-xs text-purple-400 mb-0.5>{{ t('code').value }}</div>
                <div text-sm font-bold font-mono>{{ lastEvent.code }}</div>
              </div>
              <div p-2.5 rounded-lg style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);">
                <div text-xs text-green-400 mb-0.5>{{ t('keyCode').value }}</div>
                <div text-sm font-bold font-mono>{{ lastEvent.keyCode }}</div>
              </div>
              <div p-2.5 rounded-lg style="background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.15);">
                <div text-xs text-orange-400 mb-0.5>{{ t('location').value }}</div>
                <div text-sm font-bold>{{ getLocationLabel(lastEvent.location) }}</div>
              </div>
            </div>
            <!-- Modifiers -->
            <div mt-3 p-2.5 rounded-lg style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
              <div text-xs op-50 mb-1>{{ t('modifiers').value }}</div>
              <div flex gap-1.5 flex-wrap>
                <span
                  v-for="mod in ['ctrlKey', 'shiftKey', 'altKey', 'metaKey']"
                  :key="mod"
                  px-2 py-0.5 rounded text-xs
                  :style="{
                    background: (lastEvent as any)[mod] ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${(lastEvent as any)[mod] ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: (lastEvent as any)[mod] ? '#60a5fa' : 'rgba(255,255,255,0.3)',
                    fontWeight: (lastEvent as any)[mod] ? 'bold' : 'normal',
                  }"
                >
                  {{ mod === 'ctrlKey' ? 'Ctrl' : mod === 'shiftKey' ? 'Shift' : mod === 'altKey' ? 'Alt' : 'Meta' }}
                </span>
              </div>
            </div>
            <!-- Press count for this key -->
            <div v-if="testedKeys.has(lastEvent.code)" mt-3 p-2.5 rounded-lg style="background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15);">
              <div flex justify-between text-xs>
                <span op-50>{{ t('pressCount').value }}</span>
                <span font-bold>{{ testedKeys.get(lastEvent.code)?.count }}</span>
              </div>
              <div flex justify-between text-xs mt-1>
                <span op-50>{{ t('lastPressTime').value }}</span>
                <span font-mono>{{ formatTime(testedKeys.get(lastEvent.code)?.lastTime || 0) }}</span>
              </div>
            </div>
          </template>
          <template v-else>
            <div text-center py-4 op-30>🎹 {{ t('pressAnyKey').value }}</div>
          </template>
        </c-card>

        <!-- History -->
        <c-card>
          <div flex justify-between items-center mb-3>
            <div text-sm font-bold>📜 {{ t('history').value }}</div>
            <n-button
              v-if="history.length > 0"
              quaternary
              size="tiny"
              round
              type="warning"
              @click="history = []"
            >
              {{ t('clearHistory').value }}
            </n-button>
          </div>
          <template v-if="history.length > 0">
            <div max-h-64 overflow-y-auto flex flex-col gap-1>
              <div
                v-for="(item, i) in history"
                :key="i"
                flex justify-between items-center p-2 px-3 rounded-lg
                style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);"
              >
                <div flex items-center gap-2>
                  <span text-sm font-bold :style="{ color: i === 0 ? '#22c55e' : 'rgba(255,255,255,0.7)' }">
                    {{ item.key === ' ' ? 'Space' : item.key }}
                  </span>
                  <span text-xs font-mono op-40>{{ item.code }}</span>
                </div>
                <span text-xs op-30 font-mono>{{ formatTime(item.time) }}</span>
              </div>
            </div>
          </template>
          <template v-else>
            <div text-center py-4 op-30>📭 {{ t('noHistory').value }}</div>
          </template>
        </c-card>
      </div>

      <!-- Tips -->
      <c-card mb-4>
        <div text-sm font-bold mb-3>📖 {{ t('tips').value }}</div>
        <div flex flex-col gap-2>
          <div v-for="(tip, i) in [t('tip1'), t('tip2'), t('tip3'), t('tip4')]" :key="i" flex items-start gap-2 text-xs op-70>
            <span inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 style="background: rgba(59,130,246,0.15); color: #60a5fa;">{{ i + 1 }}</span>
            <span>{{ tip.value }}</span>
          </div>
        </div>
      </c-card>

      <!-- Warning -->
      <c-card>
        <div p-3 rounded-lg style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
          <div text-sm text-amber-400 mb-1>⚠️ {{ t('warning').value }}</div>
          <div text-xs op-70>{{ t('warningContent').value }}</div>
        </div>
      </c-card>

      <!-- Reset Confirm Modal -->
      <div
        v-if="showResetConfirm"
        fixed inset-0 z-50 flex items-center justify-center
        style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
        @click.self="showResetConfirm = false"
      >
        <div p-6 rounded-2xl max-w-sm w-full style="background: #1e293b; border: 1px solid rgba(255,255,255,0.1);">
          <div text-lg font-bold mb-2>🔄 {{ t('reset').value }}</div>
          <div text-sm op-60 mb-4>{{ t('resetConfirm').value }}</div>
          <div flex gap-3 justify-end>
            <n-button quaternary round @click="showResetConfirm = false">{{ lang === 'zh' ? '取消' : 'Cancel' }}</n-button>
            <n-button type="warning" round @click="resetAll">{{ t('reset').value }}</n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.key-cap {
  position: relative;
  user-select: none;
  -webkit-user-select: none;
}
.key-cap:active {
  transform: scale(0.95);
}
</style>
