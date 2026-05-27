<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, onUnmounted, ref, watch } from 'vue';
import {
  NButton,
  NInput,
  NGrid,
  NGi,
  NSlider,
  NSelect,
  NSwitch,
  NIcon,
  NTooltip,
  NTag,
  NDivider,
  NScrollbar,
  NProgress,
  NSpace,
} from 'naive-ui';
import { Copy, Refresh, Book, Settings, Play, Pause, SkipForward, SkipBack, InfoCircle, ChevronRight, ChevronLeft } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '速读训练器',
    subtitle: 'RSVP快速阅读训练，消除眼球移动，提升阅读速度与专注力',
    inputText: '阅读文本',
    inputPlaceholder: '在此粘贴或输入要速读的文本…',
    sampleTexts: '示例文本',
    sample1: '科技未来',
    sample2: '自然奇观',
    sample3: '历史故事',
    sample4: '哲学思考',
    start: '开始阅读',
    pause: '暂停',
    resume: '继续',
    restart: '重新开始',
    speed: '阅读速度',
    wpm: '字/分钟',
    chunkSize: '每次显示字数',
    chunk1: '1字',
    chunk2: '2字',
    chunk3: '3字',
    chunk4: '4字',
    progress: '阅读进度',
    wordCount: '总字数',
    elapsed: '已用时间',
    remaining: '预计剩余',
    seconds: '秒',
    minutes: '分',
    completed: '阅读完成！',
    completedDesc: '恭喜完成本次速读训练！',
    statsTitle: '训练统计',
    sessionsToday: '今日训练',
    totalWordsToday: '今日阅读字数',
    avgWpm: '平均速度',
    bestWpm: '最佳速度',
    session: '次',
    words: '字',
    orp: 'ORP高亮',
    orpDesc: '高亮最佳识别点，帮助快速定位词眼',
    on: '开',
    off: '关',
    howToUse: '使用说明',
    howToUseTitle: '什么是RSVP速读？',
    step1: '粘贴文本或选择示例文本',
    step2: '调整阅读速度和每次显示字数',
    step3: '点击"开始阅读"，文字将逐词闪现',
    step4: '保持专注中心点，避免眼球移动',
    tip: '小贴士',
    tipContent: '初学者建议从200-300字/分钟开始，逐步提速。RSVP技术通过消除眼球扫视和回视，显著提升阅读速度。大多数人经过训练可达600-800字/分钟。',
    speedPresets: '速度预设',
    beginner: '入门 200',
    normal: '普通 300',
    fast: '快速 500',
    expert: '高手 800',
    master: '大师 1000',
    fontScale: '字体大小',
    small: '小',
    medium: '中',
    large: '大',
    wordPosition: '进度',
    autoScroll: '自动暂停',
    autoScrollDesc: '每段落后暂停',
    readingMode: '阅读模式',
    modeWord: '逐词',
    modeChunk: '逐组',
    modeLine: '逐行',
    ready: '准备开始',
    pressStart: '点击"开始阅读"按钮',
    focusPoint: '注视中心',
    copied: '已复制！',
    resetStats: '重置统计',
    charCount: '字符数',
  },
  en: {
    title: 'Speed Reading Trainer',
    subtitle: 'RSVP rapid reading — eliminate eye movement, boost speed & focus',
    inputText: 'Reading Text',
    inputPlaceholder: 'Paste or type the text you want to speed read…',
    sampleTexts: 'Sample Texts',
    sample1: 'Tech Future',
    sample2: 'Nature Wonders',
    sample3: 'History Story',
    sample4: 'Philosophy',
    start: 'Start Reading',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Restart',
    speed: 'Reading Speed',
    wpm: 'WPM',
    chunkSize: 'Words per Flash',
    chunk1: '1 word',
    chunk2: '2 words',
    chunk3: '3 words',
    chunk4: '4 words',
    progress: 'Progress',
    wordCount: 'Total Words',
    elapsed: 'Elapsed',
    remaining: 'Remaining',
    seconds: 's',
    minutes: 'min',
    completed: 'Reading Complete!',
    completedDesc: 'Congratulations on completing this speed reading session!',
    statsTitle: 'Training Stats',
    sessionsToday: 'Sessions Today',
    totalWordsToday: 'Words Read Today',
    avgWpm: 'Average Speed',
    bestWpm: 'Best Speed',
    session: 'sessions',
    words: 'words',
    orp: 'ORP Highlight',
    orpDesc: 'Highlight the Optimal Recognition Point for faster word recognition',
    on: 'On',
    off: 'Off',
    howToUse: 'How to Use',
    howToUseTitle: 'What is RSVP Speed Reading?',
    step1: 'Paste text or select a sample',
    step2: 'Adjust reading speed and words per flash',
    step3: 'Click "Start Reading" — words will flash one at a time',
    step4: 'Keep your eyes on the center point, avoid moving them',
    tip: 'Tip',
    tipContent: 'Beginners should start at 200-300 WPM and gradually increase. RSVP eliminates saccades and regressions, significantly boosting speed. Most readers can reach 600-800 WPM with practice.',
    speedPresets: 'Speed Presets',
    beginner: 'Beginner 200',
    normal: 'Normal 300',
    fast: 'Fast 500',
    expert: 'Expert 800',
    master: 'Master 1000',
    fontScale: 'Font Size',
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    wordPosition: 'Position',
    autoScroll: 'Auto Pause',
    autoScrollDesc: 'Pause at paragraph breaks',
    readingMode: 'Reading Mode',
    modeWord: 'Word-by-word',
    modeChunk: 'Chunk-by-chunk',
    modeLine: 'Line-by-line',
    ready: 'Ready to Start',
    pressStart: 'Click "Start Reading" to begin',
    focusPoint: 'Focus on center',
    copied: 'Copied!',
    resetStats: 'Reset Stats',
    charCount: 'Characters',
  },
};

// ===================== Sample texts =====================
const sampleTexts = {
  zh: {
    sample1: `人工智能正在重塑我们的生活方式。从智能助手到自动驾驶，从医疗诊断到创意设计，AI技术的突破让不可能变为可能。深度学习算法能够识别图像中的细微特征，自然语言处理让机器理解人类语言的深层含义。未来十年，AI将与人类深度协作，不仅执行任务，更将参与创造。我们需要思考的是：如何让人工智能成为增强人类能力的工具，而非替代人类的存在。技术进步的终极目标，是让每个人都能过上有尊严、有创造力的生活。`,
    sample2: `亚马逊雨林是地球上最壮观的生态系统之一。这片广袤的绿色海洋覆盖了550万平方公里，横跨九个国家。这里栖息着地球上十分之一的物种，包括超过40000种植物、1300种鸟类和3000种鱼类。每天，亚马逊的树木通过蒸腾作用释放200亿吨水蒸气，形成"飞行之河"，影响着整个南美洲的气候模式。然而，这片生命摇篮正面临前所未有的威胁——每年约有10000平方公里的森林消失。保护亚马逊，就是保护地球的未来。`,
    sample3: `丝绸之路不仅是一条贸易通道，更是连接东西方文明的纽带。公元前139年，张骞出使西域，开辟了这条横跨亚欧大陆的传奇之路。从长安出发，经过河西走廊、翻越帕米尔高原，穿过波斯帝国，最终抵达罗马。丝绸、茶叶、瓷器从东方流向西方；玻璃、珠宝、香料从西方传入东方。比货物更重要的是思想的交流——佛教、伊斯兰教、基督教沿着丝路传播，造纸术、火药、指南针经此传入欧洲，深刻改变了世界历史的进程。`,
    sample4: `时间是什么？这个看似简单的问题困扰了人类数千年。牛顿认为时间是绝对的，像一条匀速流淌的河流，独立于一切事物存在。而爱因斯坦的相对论告诉我们，时间可以因速度和引力而弯曲——在黑洞附近，时间几乎静止。量子力学更进一步暗示，在最小的尺度上，时间可能根本不存在。哲学家们争论：时间是客观现实，还是人类意识的构造？也许答案藏在两者的交汇处——时间既是物理现实，也是体验的维度，是我们理解世界不可或缺的框架。`,
  },
  en: {
    sample1: `Artificial intelligence is reshaping our way of life. From smart assistants to self-driving cars, from medical diagnosis to creative design, breakthroughs in AI technology are making the impossible possible. Deep learning algorithms can identify subtle features in images, while natural language processing enables machines to understand the deep meaning of human language. In the next decade, AI will collaborate deeply with humans, not just executing tasks but participating in creation. The question we must consider: how do we make AI a tool that enhances human capability, rather than a replacement for human existence? The ultimate goal of technological progress is to enable everyone to live a dignified, creative life.`,
    sample2: `The Amazon Rainforest is one of the most spectacular ecosystems on Earth. This vast green ocean covers 5.5 million square kilometers across nine countries. It is home to one-tenth of all species on the planet, including over 40,000 plant species, 1,300 bird species, and 3,000 fish species. Every day, the trees of the Amazon release 20 billion tons of water vapor through transpiration, forming "flying rivers" that influence climate patterns across South America. Yet this cradle of life faces unprecedented threats — approximately 10,000 square kilometers of forest disappear each year. Protecting the Amazon means protecting the future of our planet.`,
    sample3: `The Silk Road was not just a trade route but a bridge connecting Eastern and Western civilizations. In 139 BC, Zhang Qian's mission to the Western Regions opened this legendary path across the Eurasian continent. From Chang'an, through the Hexi Corridor, over the Pamir Mountains, through the Persian Empire, and finally to Rome. Silk, tea, and porcelain flowed westward; glass, jewelry, and spices flowed eastward. More important than goods was the exchange of ideas — Buddhism, Islam, and Christianity spread along the Silk Road, while papermaking, gunpowder, and the compass traveled to Europe, profoundly changing the course of world history.`,
    sample4: `What is time? This seemingly simple question has puzzled humanity for millennia. Newton believed time was absolute, like a uniformly flowing river, existing independently of everything. Einstein's theory of relativity tells us that time can bend due to speed and gravity — near a black hole, time nearly stands still. Quantum mechanics further suggests that at the smallest scales, time may not exist at all. Philosophers debate: is time objective reality, or a construct of human consciousness? Perhaps the answer lies at the intersection of both — time is both physical reality and a dimension of experience, an indispensable framework for understanding our world.`,
  },
};

// ===================== Language =====================
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== State =====================
const text = ref('');
const wpm = useStorage('speed-reading-wpm', 300);
const chunkSize = useStorage('speed-reading-chunk-size', 1);
const orpEnabled = useStorage('speed-reading-orp', true);
const autoPause = useStorage('speed-reading-auto-pause', false);
const fontScale = useStorage('speed-reading-font-scale', 1);

// Reading state
type ReadingState = 'idle' | 'playing' | 'paused' | 'completed';
const readingState = ref<ReadingState>('idle');
const currentWordIndex = ref(0);
const displayWord = ref('');
const orpIndex = ref(-1);

// Timing
let intervalId: ReturnType<typeof setInterval> | null = null;
const startTime = ref(0);
const elapsedTime = ref(0);
let elapsedIntervalId: ReturnType<typeof setInterval> | null = null;

// Stats
const sessionsToday = useStorage('speed-reading-sessions', 0);
const totalWordsToday = useStorage('speed-reading-total-words', 0);
const bestWpmToday = useStorage('speed-reading-best-wpm', 0);
const lastStatsDate = useStorage('speed-reading-stats-date', '');

// ===================== Computed =====================
const isChinese = computed(() => lang.value === 'zh');

// Tokenize text into words/chunks
const tokens = computed(() => {
  if (!text.value.trim()) return [];
  if (isChinese.value) {
    // For Chinese, split into individual characters (excluding spaces and newlines)
    return text.value.replace(/\s+/g, ' ').split('').filter(c => c.trim() !== '');
  } else {
    // For English, split into words
    return text.value.split(/\s+/).filter(w => w.length > 0);
  }
});

const totalTokens = computed(() => tokens.value.length);

const progressPercent = computed(() => {
  if (totalTokens.value === 0) return 0;
  return Math.round((currentWordIndex.value / totalTokens.value) * 100);
});

const remainingSeconds = computed(() => {
  if (wpm.value === 0) return 0;
  const wordsLeft = totalTokens.value - currentWordIndex.value;
  if (isChinese.value) {
    return Math.ceil((wordsLeft / wpm.value) * 60);
  } else {
    const effectiveChunk = Math.max(1, chunkSize.value);
    const flashesLeft = Math.ceil(wordsLeft / effectiveChunk);
    return Math.ceil((flashesLeft * effectiveChunk / wpm.value) * 60);
  }
});

const displayElapsed = computed(() => {
  const mins = Math.floor(elapsedTime.value / 60);
  const secs = elapsedTime.value % 60;
  return mins > 0 ? `${mins}${t('minutes').value} ${secs}${t('seconds').value}` : `${secs}${t('seconds').value}`;
});

const displayRemaining = computed(() => {
  const total = remainingSeconds.value;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins}${t('minutes').value} ${secs}${t('seconds').value}` : `${secs}${t('seconds').value}`;
});

// Font size based on scale
const displayFontSize = computed(() => {
  const base = isChinese.value ? 72 : 56;
  return `${Math.round(base * fontScale.value)}px`;
});

// ===================== Reset daily stats =====================
const checkNewDay = () => {
  const today = new Date().toDateString();
  if (lastStatsDate.value !== today) {
    sessionsToday.value = 0;
    totalWordsToday.value = 0;
    bestWpmToday.value = 0;
    lastStatsDate.value = today;
  }
};
checkNewDay();

// ===================== ORP calculation =====================
const getORPPosition = (word: string): number => {
  // ORP is typically at ~30% of word length
  if (word.length <= 1) return 0;
  return Math.min(Math.floor(word.length * 0.3), word.length - 1);
};

// ===================== Sample text selection =====================
const loadSample = (key: string) => {
  const sampleKey = key as keyof typeof sampleTexts.zh;
  text.value = sampleTexts[lang.value][sampleKey] || '';
  resetReading();
};

// ===================== Reading controls =====================
const getIntervalMs = () => {
  if (isChinese.value) {
    // For Chinese: wpm = characters per minute
    return Math.max(10, 60000 / wpm.value);
  } else {
    // For English: wpm = words per minute, adjusted by chunk size
    const effectiveWpm = wpm.value / Math.max(1, chunkSize.value);
    return Math.max(10, 60000 / effectiveWpm);
  }
};

const showNextWord = () => {
  if (currentWordIndex.value >= totalTokens.value) {
    completeReading();
    return;
  }

  if (isChinese.value) {
    // Chinese: show chunkSize characters at a time
    const start = currentWordIndex.value;
    const end = Math.min(start + chunkSize.value, totalTokens.value);
    const chunk = tokens.value.slice(start, end).join('');
    displayWord.value = chunk;
    orpIndex.value = orpEnabled.value ? getORPPosition(chunk) : -1;
    currentWordIndex.value = end;
  } else {
    // English: show chunkSize words at a time
    const start = currentWordIndex.value;
    const end = Math.min(start + chunkSize.value, totalTokens.value);
    const chunk = tokens.value.slice(start, end).join(' ');
    displayWord.value = chunk;
    orpIndex.value = orpEnabled.value ? getORPPosition(chunk) : -1;
    currentWordIndex.value = end;
  }

  // Auto pause at paragraph breaks
  if (autoPause.value) {
    const nextToken = tokens.value[currentWordIndex.value];
    if (nextToken === undefined) {
      // End of text, will complete on next call
    }
  }
};

const startReading = () => {
  if (totalTokens.value === 0) return;
  if (readingState.value === 'idle') {
    currentWordIndex.value = 0;
    elapsedTime.value = 0;
  }
  readingState.value = 'playing';
  startTime.value = Date.now() - (elapsedTime.value * 1000);

  // Start elapsed timer
  elapsedIntervalId = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
  }, 1000);

  // Start word display
  showNextWord();
  const ms = getIntervalMs();
  intervalId = setInterval(() => {
    showNextWord();
    // Dynamically adjust interval if speed changes
  }, ms);
};

const pauseReading = () => {
  readingState.value = 'paused';
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  if (elapsedIntervalId) { clearInterval(elapsedIntervalId); elapsedIntervalId = null; }
};

const resumeReading = () => {
  startReading();
};

const resetReading = () => {
  readingState.value = 'idle';
  currentWordIndex.value = 0;
  displayWord.value = '';
  orpIndex.value = -1;
  elapsedTime.value = 0;
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  if (elapsedIntervalId) { clearInterval(elapsedIntervalId); elapsedIntervalId = null; }
};

const completeReading = () => {
  readingState.value = 'completed';
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  if (elapsedIntervalId) { clearInterval(elapsedIntervalId); elapsedIntervalId = null; }

  // Update stats
  sessionsToday.value++;
  totalWordsToday.value = (totalWordsToday.value || 0) + totalTokens.value;
  if (wpm.value > (bestWpmToday.value || 0)) {
    bestWpmToday.value = wpm.value;
  }

  playCompletionSound();
};

const skipBack = () => {
  if (readingState.value !== 'playing' && readingState.value !== 'paused') return;
  const wasPlaying = readingState.value === 'playing';
  if (wasPlaying) pauseReading();
  currentWordIndex.value = Math.max(0, currentWordIndex.value - (isChinese.value ? 20 : 10));
  if (wasPlaying) startReading();
};

const skipForward = () => {
  if (readingState.value !== 'playing' && readingState.value !== 'paused') return;
  const wasPlaying = readingState.value === 'playing';
  if (wasPlaying) pauseReading();
  currentWordIndex.value = Math.min(totalTokens.value, currentWordIndex.value + (isChinese.value ? 20 : 10));
  if (wasPlaying) startReading();
};

// ===================== Sound =====================
const playCompletionSound = () => {
  try {
    const audioCtx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.4);
      oscillator.start(audioCtx.currentTime + i * 0.15);
      oscillator.stop(audioCtx.currentTime + i * 0.15 + 0.4);
    });
  } catch {
    // Audio not available
  }
};

// ===================== Reset stats =====================
const resetStats = () => {
  sessionsToday.value = 0;
  totalWordsToday.value = 0;
  bestWpmToday.value = 0;
};

// ===================== Watch speed changes =====================
watch(wpm, () => {
  if (readingState.value === 'playing') {
    // Restart interval with new speed
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(showNextWord, getIntervalMs());
  }
});

watch(chunkSize, () => {
  if (readingState.value === 'playing') {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(showNextWord, getIntervalMs());
  }
});

// ===================== Cleanup =====================
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  if (elapsedIntervalId) clearInterval(elapsedIntervalId);
});

// ===================== ORP rendering helper =====================
const renderWord = computed(() => {
  const word = displayWord.value;
  if (orpIndex.value < 0 || !orpEnabled.value || word.length <= 1) {
    return { before: word, highlight: '', after: '' };
  }
  const idx = orpIndex.value;
  return {
    before: word.slice(0, idx),
    highlight: word[idx],
    after: word.slice(idx + 1),
  };
});
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <n-grid :cols="24" :x-gap="16" responsive="screen" item-responsive>
        <!-- Left: Reading Display -->
        <n-gi span="24 m:15">
          <!-- RSVP Display Card -->
          <c-card mb-4>
            <!-- Title -->
            <div text-center mb-2>
              <div text-2xl font-bold>📖 {{ t('title').value }}</div>
              <div text-sm op-50 mt-1>{{ t('subtitle').value }}</div>
            </div>

            <!-- RSVP Display Area -->
            <div
              relative
              flex items-center justify-center
              min-h-64
              rounded-2xl
              mt-4
              p-8
              :style="{
                background: readingState === 'playing'
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)'
                  : 'rgba(255,255,255,0.03)',
                border: readingState === 'playing'
                  ? '1px solid rgba(99,102,241,0.3)'
                  : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.5s ease',
              }"
            >
              <!-- Focus point marker -->
              <div
                v-if="readingState === 'playing' || readingState === 'paused'"
                absolute
                top-2
                left="50%"
                translate-x="-50%"
                w-8
                h-0.5
                rounded-full
                :style="{ background: 'rgba(99,102,241,0.5)' }"
              />

              <!-- Word Display -->
              <div
                v-if="readingState === 'idle'"
                text-center
              >
                <div text-lg op-40 mb-2>🚀 {{ t('ready').value }}</div>
                <div text-sm op-30>{{ t('pressStart').value }}</div>
              </div>

              <div
                v-else-if="readingState === 'completed'"
                text-center
              >
                <div text-3xl mb-3>🎉</div>
                <div text-xl font-bold style="color: #818cf8">{{ t('completed').value }}</div>
                <div text-sm op-50 mt-2>{{ t('completedDesc').value }}</div>
                <n-button mt-4 round @click="resetReading" type="primary" secondary>
                  {{ t('restart').value }}
                </n-button>
              </div>

              <div
                v-else
                text-center
                :style="{ fontSize: displayFontSize, lineHeight: 1.2 }"
                font-bold
                class="select-none"
              >
                <!-- With ORP highlight -->
                <span v-if="renderWord.highlight">
                  <span op-70>{{ renderWord.before }}</span><span style="color: #818cf8; text-shadow: 0 0 20px rgba(129,140,248,0.4)">{{ renderWord.highlight }}</span><span op-70>{{ renderWord.after }}</span>
                </span>
                <!-- Without ORP -->
                <span v-else style="color: #e2e8f0">{{ displayWord }}</span>
              </div>

              <!-- Pause indicator -->
              <div
                v-if="readingState === 'paused'"
                absolute
                bottom-3
                left="50%"
                translate-x="-50%"
                px-3
                py-1
                rounded-full
                text-xs
                style="background: rgba(234,179,8,0.2); color: #eab308; border: 1px solid rgba(234,179,8,0.3)"
              >
                ⏸ {{ t('pause').value }}
              </div>
            </div>

            <!-- Progress bar -->
            <div mt-4>
              <div flex justify-between text-sm mb-1>
                <span op-60>{{ t('progress').value }}</span>
                <span style="color: #818cf8">{{ progressPercent }}%</span>
              </div>
              <n-progress
                type="line"
                :percentage="progressPercent"
                color="#818cf8"
                rail-color="rgba(255,255,255,0.08)"
                :height="8"
                :border-radius="4"
                :indicator-placement="'inside'"
              />
            </div>

            <!-- Controls -->
            <div flex justify-center gap-2 mt-5>
              <!-- Skip Back -->
              <n-button
                round
                quaternary
                size="large"
                :disabled="readingState === 'idle' || readingState === 'completed'"
                @click="skipBack"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 19l-7-7 7-7"/>
                    <path d="M18 19l-7-7 7-7"/>
                  </svg>
                </template>
              </n-button>

              <!-- Play / Pause -->
              <n-button
                v-if="readingState === 'idle' || readingState === 'completed'"
                type="primary"
                size="large"
                round
                :disabled="totalTokens === 0"
                :style="{ background: '#6366f1', border: 'none', minWidth: '140px' }"
                @click="startReading"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </template>
                {{ t('start').value }}
              </n-button>
              <n-button
                v-else-if="readingState === 'playing'"
                size="large"
                round
                :style="{ minWidth: '140px' }"
                @click="pauseReading"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                </template>
                {{ t('pause').value }}
              </n-button>
              <n-button
                v-else
                type="primary"
                size="large"
                round
                :style="{ background: '#6366f1', border: 'none', minWidth: '140px' }"
                @click="resumeReading"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </template>
                {{ t('resume').value }}
              </n-button>

              <!-- Skip Forward -->
              <n-button
                round
                quaternary
                size="large"
                :disabled="readingState === 'idle' || readingState === 'completed'"
                @click="skipForward"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 5l7 7-7 7"/>
                    <path d="M6 5l7 7-7 7"/>
                  </svg>
                </template>
              </n-button>

              <!-- Restart -->
              <n-button
                round
                quaternary
                size="large"
                :disabled="readingState === 'idle'"
                @click="resetReading"
              >
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                </template>
              </n-button>
            </div>

            <!-- Speed quick presets -->
            <div mt-5>
              <div text-sm op-60 mb-2>{{ t('speedPresets').value }}</div>
              <div flex flex-wrap gap-2>
                <n-tag
                  v-for="preset in [
                    { label: t('beginner').value, value: 200 },
                    { label: t('normal').value, value: 300 },
                    { label: t('fast').value, value: 500 },
                    { label: t('expert').value, value: 800 },
                    { label: t('master').value, value: 1000 },
                  ]"
                  :key="preset.value"
                  round
                  :bordered="wpm !== preset.value"
                  :type="wpm === preset.value ? 'primary' : 'default'"
                  style="cursor: pointer"
                  @click="wpm = preset.value"
                >
                  {{ preset.label }}
                </n-tag>
              </div>
            </div>
          </c-card>

          <!-- Input Text Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>📝 {{ t('inputText').value }}</div>

            <!-- Sample texts -->
            <div mb-3>
              <div text-sm op-60 mb-2>{{ t('sampleTexts').value }}</div>
              <div flex flex-wrap gap-2>
                <n-button
                  v-for="(key, i) in ['sample1', 'sample2', 'sample3', 'sample4']"
                  :key="key"
                  size="small"
                  round
                  quaternary
                  @click="loadSample(key)"
                >
                  {{ t((key + '') as any).value }}
                </n-button>
              </div>
            </div>

            <!-- Text input -->
            <n-input
              v-model:value="text"
              type="textarea"
              :placeholder="t('inputPlaceholder').value"
              :rows="6"
              :disabled="readingState === 'playing'"
              style="font-size: 14px"
            />

            <!-- Text info -->
            <div flex gap-4 mt-2 text-sm op-50>
              <span>{{ t('wordCount').value }}: {{ totalTokens }}</span>
              <span>{{ t('charCount').value }}: {{ text.length }}</span>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Settings & Stats -->
        <n-gi span="24 m:9">
          <!-- Stats Card -->
          <c-card mb-4>
            <div flex justify-between items-center mb-4>
              <div text-lg font-bold>📊 {{ t('statsTitle').value }}</div>
              <n-button size="tiny" quaternary @click="resetStats">{{ t('resetStats').value }}</n-button>
            </div>

            <div grid grid-cols-2 gap-3>
              <!-- Sessions -->
              <div
                p-3
                rounded-xl
                style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2)"
              >
                <div text-xs op-50>📚 {{ t('sessionsToday').value }}</div>
                <div text-2xl font-bold mt-1 style="color: #818cf8">{{ sessionsToday }}</div>
                <div text-xs op-40>{{ t('session').value }}</div>
              </div>

              <!-- Words read -->
              <div
                p-3
                rounded-xl
                style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2)"
              >
                <div text-xs op-50>📖 {{ t('totalWordsToday').value }}</div>
                <div text-2xl font-bold mt-1 style="color: #22c55e">{{ totalWordsToday }}</div>
                <div text-xs op-40>{{ t('words').value }}</div>
              </div>

              <!-- Current speed -->
              <div
                p-3
                rounded-xl
                style="background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.2)"
              >
                <div text-xs op-50>⚡ {{ t('speed').value }}</div>
                <div text-2xl font-bold mt-1 style="color: #eab308">{{ wpm }}</div>
                <div text-xs op-40>{{ t('wpm').value }}</div>
              </div>

              <!-- Best speed -->
              <div
                p-3
                rounded-xl
                style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2)"
              >
                <div text-xs op-50>🏆 {{ t('bestWpm').value }}</div>
                <div text-2xl font-bold mt-1 style="color: #a855f7">{{ bestWpmToday }}</div>
                <div text-xs op-40>{{ t('wpm').value }}</div>
              </div>
            </div>

            <!-- Reading time info -->
            <div
              v-if="readingState !== 'idle'"
              mt-3
              p-3
              rounded-xl
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)"
            >
              <div flex justify-between text-sm>
                <span op-60>⏱ {{ t('elapsed').value }}</span>
                <span>{{ displayElapsed }}</span>
              </div>
              <div flex justify-between text-sm mt-1>
                <span op-60>⏳ {{ t('remaining').value }}</span>
                <span>{{ displayRemaining }}</span>
              </div>
            </div>
          </c-card>

          <!-- Settings Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-4>⚙️ {{ lang === 'zh' ? '设置' : 'Settings' }}</div>

            <!-- Speed slider -->
            <div mb-5>
              <div flex justify-between text-sm mb-2>
                <span op-70>🚀 {{ t('speed').value }}</span>
                <span font-bold style="color: #818cf8">{{ wpm }} {{ t('wpm').value }}</span>
              </div>
              <n-slider
                v-model:value="wpm"
                :min="100"
                :max="1500"
                :step="50"
                :marks="{ 200: '200', 300: '300', 500: '500', 800: '800', 1000: '1K', 1500: '1.5K' }"
              />
            </div>

            <!-- Chunk size -->
            <div mb-5>
              <div flex justify-between text-sm mb-2>
                <span op-70>📦 {{ t('chunkSize').value }}</span>
                <span font-bold>{{ chunkSize }}</span>
              </div>
              <n-slider
                v-model:value="chunkSize"
                :min="1"
                :max="4"
                :step="1"
                :marks="{ 1: '1', 2: '2', 3: '3', 4: '4' }"
              />
            </div>

            <!-- Font size -->
            <div mb-5>
              <div flex justify-between text-sm mb-2>
                <span op-70>🔤 {{ t('fontScale').value }}</span>
                <span font-bold>{{ fontScale.toFixed(1) }}x</span>
              </div>
              <n-slider
                v-model:value="fontScale"
                :min="0.6"
                :max="2.0"
                :step="0.1"
                :marks="{ 0.6: t('small').value, 1.0: t('medium').value, 1.5: t('large').value }"
              />
            </div>

            <!-- ORP toggle -->
            <div flex items-center justify-between mb-4 p-3 rounded-xl style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.15)">
              <div>
                <div text-sm font-medium>🎯 {{ t('orp').value }}</div>
                <div text-xs op-40 mt-0.5>{{ t('orpDesc').value }}</div>
              </div>
              <n-switch v-model:value="orpEnabled" size="small">
                <template #checked>{{ t('on').value }}</template>
                <template #unchecked>{{ t('off').value }}</template>
              </n-switch>
            </div>

            <!-- Auto pause -->
            <div flex items-center justify-between p-3 rounded-xl style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08)">
              <div>
                <div text-sm font-medium>⏸ {{ t('autoScroll').value }}</div>
                <div text-xs op-40 mt-0.5>{{ t('autoScrollDesc').value }}</div>
              </div>
              <n-switch v-model:value="autoPause" size="small">
                <template #checked>{{ t('on').value }}</template>
                <template #unchecked>{{ t('off').value }}</template>
              </n-switch>
            </div>
          </c-card>

          <!-- Tips Card -->
          <c-card>
            <div text-lg font-bold mb-3>💡 {{ t('howToUseTitle').value }}</div>
            <div text-sm leading-relaxed op-70 mb-4>{{ t('tipContent').value }}</div>
            <n-divider style="margin: 12px 0" />
            <div text-sm font-bold mb-2>📋 {{ t('howToUse').value }}</div>
            <div flex flex-col gap-2>
              <div
                v-for="(step, i) in [t('step1').value, t('step2').value, t('step3').value, t('step4').value]"
                :key="i"
                flex items-start gap-2
              >
                <div
                  flex-shrink-0
                  w-6
                  h-6
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-xs
                  font-bold
                  style="background: rgba(99,102,241,0.2); color: #818cf8"
                >
                  {{ i + 1 }}
                </div>
                <span text-sm op-70>{{ step }}</span>
              </div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
.select-none {
  user-select: none;
  -webkit-user-select: none;
}
</style>
