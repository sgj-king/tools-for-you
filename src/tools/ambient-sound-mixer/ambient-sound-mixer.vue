<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import { NSlider, NButton, NIcon, NTooltip, NSwitch, NProgress } from 'naive-ui';

// i18n
const labels = {
  zh: {
    title: '白噪音混合器',
    subtitle: '混合多种环境声音，打造你的专注空间',
    playing: '播放中',
    paused: '已暂停',
    play: '播放',
    pause: '暂停',
    stop: '停止',
    volume: '主音量',
    reset: '重置',
    presets: '预设场景',
    presetRain: '雨夜',
    presetCampfire: '露营',
    presetOcean: '海边',
    presetCafe: '咖啡馆',
    presetForest: '森林',
    presetStorm: '暴风雨',
    timer: '定时关闭',
    noTimer: '不定时',
    min15: '15 分钟',
    min30: '30 分钟',
    min45: '45 分钟',
    min60: '60 分钟',
    min90: '90 分钟',
    remaining: '剩余',
    focusTip: '试试搭配番茄钟使用效果更佳',
    sounds: '环境声音',
    rain: '雨声',
    heavyRain: '大雨',
    thunder: '雷声',
    wind: '风声',
    ocean: '海浪',
    fire: '壁炉',
    birds: '鸟鸣',
    crickets: '虫鸣',
    coffee: '咖啡馆',
    train: '列车',
    fountain: '喷泉',
    night: '夜晚',
    stream: '溪流',
  },
  en: {
    title: 'Ambient Sound Mixer',
    subtitle: 'Mix ambient sounds to create your focus space',
    playing: 'Playing',
    paused: 'Paused',
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    volume: 'Master Volume',
    reset: 'Reset',
    presets: 'Presets',
    presetRain: 'Rainy Night',
    presetCampfire: 'Campfire',
    presetOcean: 'Ocean Side',
    presetCafe: 'Coffee Shop',
    presetForest: 'Forest',
    presetStorm: 'Thunderstorm',
    timer: 'Sleep Timer',
    noTimer: 'No Timer',
    min15: '15 min',
    min30: '30 min',
    min45: '45 min',
    min60: '60 min',
    min90: '90 min',
    remaining: 'Remaining',
    focusTip: 'Try combining with Pomodoro timer for best results',
    sounds: 'Ambient Sounds',
    rain: 'Rain',
    heavyRain: 'Heavy Rain',
    thunder: 'Thunder',
    wind: 'Wind',
    ocean: 'Ocean Waves',
    fire: 'Fireplace',
    birds: 'Birds',
    crickets: 'Crickets',
    coffee: 'Coffee Shop',
    train: 'Train',
    fountain: 'Fountain',
    night: 'Night',
    stream: 'Stream',
  },
};

const lang = useStorage<'zh' | 'en'>('ambient-mixer-lang', 'zh');
const t = (key: keyof typeof labels.zh) => labels[lang.value][key];

// Sound definitions
interface SoundDef {
  id: string;
  icon: string;
  color: string;
  labelKey: keyof typeof labels.zh;
}

const soundDefs: SoundDef[] = [
  { id: 'rain', icon: '🌧️', color: '#5b8def', labelKey: 'rain' },
  { id: 'heavyRain', icon: '⛈️', color: '#3b6dc9', labelKey: 'heavyRain' },
  { id: 'thunder', icon: '⚡', color: '#9b6dff', labelKey: 'thunder' },
  { id: 'wind', icon: '🌬️', color: '#7ec8c8', labelKey: 'wind' },
  { id: 'ocean', icon: '🌊', color: '#2da8d8', labelKey: 'ocean' },
  { id: 'fire', icon: '🔥', color: '#e8753a', labelKey: 'fire' },
  { id: 'birds', icon: '🐦', color: '#68c070', labelKey: 'birds' },
  { id: 'crickets', icon: '🦗', color: '#6daa40', labelKey: 'crickets' },
  { id: 'coffee', icon: '☕', color: '#a0784c', labelKey: 'coffee' },
  { id: 'train', icon: '🚂', color: '#8a8a9a', labelKey: 'train' },
  { id: 'fountain', icon: '⛲', color: '#4cb8d4', labelKey: 'fountain' },
  { id: 'night', icon: '🌙', color: '#5c5c9a', labelKey: 'night' },
  { id: 'stream', icon: '🏞️', color: '#5ab0b0', labelKey: 'stream' },
];

// Sound state
const soundStates = reactive<Record<string, { volume: number; active: boolean }>>(
  Object.fromEntries(soundDefs.map(s => [s.id, { volume: 50, active: false }]))
);

const masterVolume = ref(75);
const isPlaying = ref(false);

// Audio context & nodes
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const soundNodes: Record<string, { gain: GainNode; sources: AudioNode[]; intervals: number[] }> = {};

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = masterVolume.value / 100;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return { ctx: audioCtx, master: masterGain! };
}

// Noise generator helpers
function createNoiseBuffer(ctx: AudioContext, type: 'white' | 'brown' | 'pink', duration = 2): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
    } else {
      // Pink noise
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
  }
  return buffer;
}

function createLoopingNoise(ctx: AudioContext, dest: AudioNode, type: 'white' | 'brown' | 'pink'): { source: AudioBufferSourceNode } {
  const buffer = createNoiseBuffer(ctx, type, 4);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(dest);
  source.start();
  return { source };
}

function createFilteredNoise(ctx: AudioContext, dest: AudioNode, noiseType: 'white' | 'brown' | 'pink', filterType: BiquadFilterType, freq: number, Q?: number): { source: AudioBufferSourceNode; filter: BiquadFilterNode } {
  const buffer = createNoiseBuffer(ctx, noiseType, 4);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = freq;
  if (Q !== undefined) filter.Q.value = Q;
  source.connect(filter);
  filter.connect(dest);
  source.start();
  return { source, filter };
}

// Individual sound generators using Web Audio API
function startSound(id: string) {
  const { ctx, master } = getAudioCtx();
  if (soundNodes[id]) return;

  const gain = ctx.createGain();
  gain.gain.value = soundStates[id].volume / 100;
  gain.connect(master);

  const sources: AudioNode[] = [];
  const intervals: number[] = [];

  switch (id) {
    case 'rain': {
      // Light rain - filtered brown noise
      const n = createFilteredNoise(ctx, gain, 'brown', 'highpass', 400);
      const n2 = createFilteredNoise(ctx, gain, 'white', 'bandpass', 3000, 0.5);
      const n2Gain = ctx.createGain();
      n2Gain.gain.value = 0.15;
      n2.source.disconnect();
      n2.source.connect(n2Gain);
      n2Gain.connect(gain);
      sources.push(n.source, n2.source);
      break;
    }
    case 'heavyRain': {
      const n = createFilteredNoise(ctx, gain, 'brown', 'highpass', 200);
      const n2 = createFilteredNoise(ctx, gain, 'white', 'bandpass', 2000, 0.3);
      const n2Gain = ctx.createGain();
      n2Gain.gain.value = 0.25;
      n2.source.disconnect();
      n2.source.connect(n2Gain);
      n2Gain.connect(gain);
      sources.push(n.source, n2.source);
      break;
    }
    case 'thunder': {
      // Thunder rumble - low frequency modulated brown noise
      const n = createFilteredNoise(ctx, gain, 'brown', 'lowpass', 200);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      // Periodic louder rumbles
      const rumbleInterval = window.setInterval(() => {
        if (gain.gain.value > 0.01) {
          const now = ctx.currentTime;
          gain.gain.setValueAtTime(gain.gain.value * 0.3, now);
          gain.gain.linearRampToValueAtTime(gain.gain.value * 1.2, now + 0.3);
          gain.gain.linearRampToValueAtTime(gain.gain.value * 0.5, now + 2);
          gain.gain.linearRampToValueAtTime(soundStates[id].volume / 100, now + 4);
        }
      }, 8000 + Math.random() * 12000);
      sources.push(n.source, lfo);
      intervals.push(rumbleInterval);
      break;
    }
    case 'wind': {
      const n = createFilteredNoise(ctx, gain, 'pink', 'bandpass', 500, 0.2);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(n.filter.frequency);
      lfo.start();
      sources.push(n.source, lfo);
      break;
    }
    case 'ocean': {
      // Ocean waves - brown noise with slow LFO modulation
      const n = createFilteredNoise(ctx, gain, 'brown', 'lowpass', 800);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 400;
      lfo.connect(lfoGain);
      lfoGain.connect(n.filter.frequency);
      lfo.start();
      // Wave volume modulation
      const volLfo = ctx.createOscillator();
      volLfo.frequency.value = 0.06;
      const volLfoGain = ctx.createGain();
      volLfoGain.gain.value = 0.25;
      volLfo.connect(volLfoGain);
      volLfoGain.connect(gain.gain);
      volLfo.start();
      sources.push(n.source, lfo, volLfo);
      break;
    }
    case 'fire': {
      // Fire crackling - filtered white noise with random pops
      const n = createFilteredNoise(ctx, gain, 'white', 'bandpass', 800, 1);
      // Add crackle
      const crackleInterval = window.setInterval(() => {
        if (Math.random() > 0.4) {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.frequency.value = 200 + Math.random() * 400;
          osc.type = 'square';
          oscGain.gain.value = 0.02 + Math.random() * 0.03;
          osc.connect(oscGain);
          oscGain.connect(gain);
          osc.start();
          osc.stop(ctx.currentTime + 0.01 + Math.random() * 0.03);
        }
      }, 80);
      sources.push(n.source);
      intervals.push(crackleInterval);
      break;
    }
    case 'birds': {
      // Bird chirps - periodic oscillator bursts
      const chirpInterval = window.setInterval(() => {
        if (!soundStates.birds.active) return;
        const numChirps = 2 + Math.floor(Math.random() * 4);
        for (let c = 0; c < numChirps; c++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            const baseFreq = 1800 + Math.random() * 2000;
            osc.frequency.value = baseFreq;
            osc.type = 'sine';
            oscGain.gain.value = 0;
            osc.connect(oscGain);
            oscGain.connect(gain);
            const now = ctx.currentTime;
            oscGain.gain.setValueAtTime(0, now);
            oscGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
            osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, now + 0.06);
            osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + 0.1);
            oscGain.gain.linearRampToValueAtTime(0, now + 0.12 + Math.random() * 0.05);
            osc.start(now);
            osc.stop(now + 0.2);
          }, c * (60 + Math.random() * 100));
        }
      }, 1500 + Math.random() * 3000);
      // Add soft background
      const bg = createFilteredNoise(ctx, gain, 'white', 'highpass', 4000);
      const bgGain = ctx.createGain();
      bgGain.gain.value = 0.02;
      bg.source.disconnect();
      bg.source.connect(bgGain);
      bgGain.connect(gain);
      sources.push(bg.source);
      intervals.push(chirpInterval);
      break;
    }
    case 'crickets': {
      // Cricket chirps - high frequency oscillator pulses
      const cricketInterval = window.setInterval(() => {
        if (!soundStates.crickets.active) return;
        for (let c = 0; c < 3; c++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.frequency.value = 4500 + Math.random() * 500;
            osc.type = 'sine';
            oscGain.gain.value = 0;
            osc.connect(oscGain);
            oscGain.connect(gain);
            const now = ctx.currentTime;
            oscGain.gain.setValueAtTime(0.04, now);
            oscGain.gain.linearRampToValueAtTime(0, now + 0.015);
            osc.start(now);
            osc.stop(now + 0.02);
          }, c * 40);
        }
      }, 200 + Math.random() * 300);
      // Another cricket with different timing
      const cricket2Interval = window.setInterval(() => {
        if (!soundStates.crickets.active) return;
        for (let c = 0; c < 4; c++) {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.frequency.value = 3800 + Math.random() * 400;
            osc.type = 'sine';
            oscGain.gain.value = 0;
            osc.connect(oscGain);
            oscGain.connect(gain);
            const now = ctx.currentTime;
            oscGain.gain.setValueAtTime(0.025, now);
            oscGain.gain.linearRampToValueAtTime(0, now + 0.012);
            osc.start(now);
            osc.stop(now + 0.015);
          }, c * 55);
        }
      }, 500 + Math.random() * 600);
      const bg = createFilteredNoise(ctx, gain, 'white', 'highpass', 3000);
      const bgGain = ctx.createGain();
      bgGain.gain.value = 0.008;
      bg.source.disconnect();
      bg.source.connect(bgGain);
      bgGain.connect(gain);
      sources.push(bg.source);
      intervals.push(cricketInterval, cricket2Interval);
      break;
    }
    case 'coffee': {
      // Coffee shop ambience - soft brown noise + muffled sounds
      const n = createFilteredNoise(ctx, gain, 'brown', 'lowpass', 1500);
      const n2 = createFilteredNoise(ctx, gain, 'pink', 'bandpass', 600, 0.5);
      const n2Gain = ctx.createGain();
      n2Gain.gain.value = 0.08;
      n2.source.disconnect();
      n2.source.connect(n2Gain);
      n2Gain.connect(gain);
      // Clinking sounds
      const clinkInterval = window.setInterval(() => {
        if (!soundStates.coffee.active) return;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.frequency.value = 2500 + Math.random() * 2000;
        osc.type = 'sine';
        oscGain.gain.value = 0.015;
        osc.connect(oscGain);
        oscGain.connect(gain);
        const now = ctx.currentTime;
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.1);
      }, 3000 + Math.random() * 5000);
      sources.push(n.source, n2.source);
      intervals.push(clinkInterval);
      break;
    }
    case 'train': {
      // Train rhythm - low rumble with periodic clicks
      const n = createFilteredNoise(ctx, gain, 'brown', 'lowpass', 300);
      const n2 = createFilteredNoise(ctx, gain, 'white', 'bandpass', 200, 2);
      const n2Gain = ctx.createGain();
      n2Gain.gain.value = 0.1;
      n2.source.disconnect();
      n2.source.connect(n2Gain);
      n2Gain.connect(gain);
      // Rhythmic click-clack
      const clickInterval = window.setInterval(() => {
        if (!soundStates.train.active) return;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.frequency.value = 150 + Math.random() * 50;
        osc.type = 'square';
        oscGain.gain.value = 0.03;
        osc.connect(oscGain);
        oscGain.connect(gain);
        const now = ctx.currentTime;
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
      }, 250);
      sources.push(n.source, n2.source);
      intervals.push(clickInterval);
      break;
    }
    case 'fountain': {
      // Fountain - filtered white noise with shimmer
      const n = createFilteredNoise(ctx, gain, 'white', 'bandpass', 2500, 0.8);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.3;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.2;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      const n2 = createFilteredNoise(ctx, gain, 'brown', 'lowpass', 500);
      const n2Gain = ctx.createGain();
      n2Gain.gain.value = 0.3;
      n2.source.disconnect();
      n2.source.connect(n2Gain);
      n2Gain.connect(gain);
      sources.push(n.source, lfo, n2.source);
      break;
    }
    case 'night': {
      // Night ambience - very soft low noise with occasional owl-like sounds
      const n = createFilteredNoise(ctx, gain, 'brown', 'lowpass', 400);
      const n2 = createFilteredNoise(ctx, gain, 'pink', 'highpass', 2000);
      const n2Gain = ctx.createGain();
      n2Gain.gain.value = 0.015;
      n2.source.disconnect();
      n2.source.connect(n2Gain);
      n2Gain.connect(gain);
      sources.push(n.source, n2.source);
      break;
    }
    case 'stream': {
      // Babbling brook - bandpass filtered noise with modulation
      const n = createFilteredNoise(ctx, gain, 'white', 'bandpass', 1500, 0.5);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(n.filter.frequency);
      lfo.start();
      const n2 = createFilteredNoise(ctx, gain, 'pink', 'highpass', 2000);
      const n2Gain = ctx.createGain();
      n2Gain.gain.value = 0.1;
      n2.source.disconnect();
      n2.source.connect(n2Gain);
      n2Gain.connect(gain);
      sources.push(n.source, lfo, n2.source);
      break;
    }
  }

  soundNodes[id] = { gain, sources, intervals };
}

function stopSound(id: string) {
  const node = soundNodes[id];
  if (!node) return;
  node.intervals.forEach(i => clearInterval(i));
  node.sources.forEach(s => {
    try {
      if (s instanceof AudioBufferSourceNode || s instanceof OscillatorNode) {
        s.stop();
      }
      s.disconnect();
    } catch {}
  });
  node.gain.disconnect();
  delete soundNodes[id];
}

function toggleSound(id: string) {
  if (soundStates[id].active) {
    soundStates[id].active = false;
    stopSound(id);
  } else {
    soundStates[id].active = true;
    startSound(id);
  }
  if (!isPlaying.value && Object.values(soundStates).some(s => s.active)) {
    isPlaying.value = true;
  }
  if (!Object.values(soundStates).some(s => s.active)) {
    isPlaying.value = false;
  }
  savePreset();
}

function updateSoundVolume(id: string, vol: number) {
  soundStates[id].volume = vol;
  const node = soundNodes[id];
  if (node) {
    node.gain.gain.setTargetAtTime(vol / 100, audioCtx!.currentTime, 0.1);
  }
  savePreset();
}

const onMasterVolumeChange = (val: number) => {
  masterVolume.value = val;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(val / 100, audioCtx!.currentTime, 0.1);
  }
};

const stopAll = () => {
  Object.keys(soundNodes).forEach(id => stopSound(id));
  Object.keys(soundStates).forEach(id => { soundStates[id].active = false; });
  isPlaying.value = false;
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
    timerRemaining.value = 0;
    timerMinutes.value = 0;
  }
  savePreset();
};

// Presets
interface Preset {
  name: string;
  nameKey: keyof typeof labels.zh;
  sounds: Record<string, number>;
}

const presets: Preset[] = [
  { nameKey: 'presetRain', name: 'rain', sounds: { rain: 65, thunder: 25, wind: 30 } },
  { nameKey: 'presetCampfire', name: 'campfire', sounds: { fire: 70, crickets: 35, wind: 15 } },
  { nameKey: 'presetOcean', name: 'ocean', sounds: { ocean: 70, wind: 25, birds: 20 } },
  { nameKey: 'presetCafe', name: 'cafe', sounds: { coffee: 65, rain: 20 } },
  { nameKey: 'presetForest', name: 'forest', sounds: { birds: 55, stream: 45, wind: 20 } },
  { nameKey: 'presetStorm', name: 'storm', sounds: { heavyRain: 70, thunder: 50, wind: 40 } },
];

const applyPreset = (preset: Preset) => {
  // Stop all first
  Object.keys(soundNodes).forEach(id => stopSound(id));
  Object.keys(soundStates).forEach(id => {
    soundStates[id].active = false;
    soundStates[id].volume = 50;
  });

  // Apply preset
  Object.entries(preset.sounds).forEach(([id, vol]) => {
    if (soundStates[id]) {
      soundStates[id].volume = vol;
      soundStates[id].active = true;
      startSound(id);
    }
  });

  isPlaying.value = true;
  savePreset();
};

// Timer
const timerMinutes = ref(0);
const timerRemaining = ref(0);
const timerInterval = ref<number | null>(null);

const timerOptions = computed(() => [
  { label: t('noTimer'), value: 0 },
  { label: t('min15'), value: 15 },
  { label: t('min30'), value: 30 },
  { label: t('min45'), value: 45 },
  { label: t('min60'), value: 60 },
  { label: t('min90'), value: 90 },
]);

const timerDisplay = computed(() => {
  if (timerRemaining.value <= 0) return '';
  const m = Math.floor(timerRemaining.value / 60);
  const s = timerRemaining.value % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
});

const timerProgress = computed(() => {
  if (timerMinutes.value <= 0) return 0;
  return ((timerMinutes.value * 60 - timerRemaining.value) / (timerMinutes.value * 60)) * 100;
});

function setTimer(minutes: number) {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
  if (minutes <= 0) {
    timerMinutes.value = 0;
    timerRemaining.value = 0;
    return;
  }
  timerMinutes.value = minutes;
  timerRemaining.value = minutes * 60;
  timerInterval.value = window.setInterval(() => {
    timerRemaining.value--;
    if (timerRemaining.value <= 0) {
      clearInterval(timerInterval.value!);
      timerInterval.value = null;
      timerMinutes.value = 0;
      stopAll();
    }
  }, 1000);
}

// Save/Load state
const savedState = useStorage('ambient-mixer-state', {
  volumes: {} as Record<string, number>,
  active: [] as string[],
  masterVolume: 75,
});

function savePreset() {
  const volumes: Record<string, number> = {};
  const active: string[] = [];
  Object.entries(soundStates).forEach(([id, state]) => {
    volumes[id] = state.volume;
    if (state.active) active.push(id);
  });
  savedState.value = { volumes, active, masterVolume: masterVolume.value };
}

function loadPreset() {
  const { volumes, active, masterVolume: mv } = savedState.value;
  if (mv) {
    masterVolume.value = mv;
  }
  // Don't auto-start sounds on load, just restore volumes
  Object.entries(volumes).forEach(([id, vol]) => {
    if (soundStates[id]) {
      soundStates[id].volume = vol;
    }
  });
}

// Active sound count
const activeCount = computed(() => Object.values(soundStates).filter(s => s.active).length);

// Helper for template
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

onMounted(() => {
  loadPreset();
});

onUnmounted(() => {
  stopAll();
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
});
</script>

<template>
  <div class="ambient-mixer" min-h-100vh>
    <!-- Header -->
    <div class="mixer-header" text-center mb-8>
      <h2 text-3xl font-bold mb-2>{{ t('title') }}</h2>
      <p text-base op-60>{{ t('subtitle') }}</p>

      <!-- Status -->
      <div mt-4 flex items-center justify-center gap-4>
        <div
          class="status-badge"
          :class="isPlaying ? 'status-playing' : 'status-paused'"
          flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        >
          <span class="status-dot" :class="isPlaying ? 'dot-active' : ''" />
          {{ isPlaying ? t('playing') : t('paused') }}
          <span v-if="activeCount > 0" op-70>({{ activeCount }})</span>
        </div>
      </div>
    </div>

    <!-- Master Controls -->
    <div class="master-controls" mb-8 p-5 rounded-xl
      style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);"
    >
      <div flex items-center justify-between mb-4>
        <span text-lg font-600>{{ t('volume') }}</span>
        <span op-60>{{ masterVolume }}%</span>
      </div>
      <n-slider
        :value="masterVolume"
        :min="0" :max="100" :step="1"
        :format-tooltip="(v: number) => v + '%'"
        @update:value="onMasterVolumeChange"
        mb-4
      />
      <div flex items-center justify-between gap-3>
        <div flex gap-2>
          <n-button
            :type="isPlaying ? 'warning' : 'primary'"
            size="large"
            round
            @click="isPlaying ? stopAll() : null"
          >
            <template #icon>
              <span text-lg>{{ isPlaying ? '⏹️' : '▶️' }}</span>
            </template>
            {{ isPlaying ? t('stop') : t('play') }}
          </n-button>
        </div>
        <n-button size="large" quaternary circle @click="stopAll">
          <span text-lg>🔄</span>
        </n-button>
      </div>
    </div>

    <!-- Presets -->
    <div mb-8>
      <h3 text-lg font-600 mb-4>✨ {{ t('presets') }}</h3>
      <div class="preset-grid" grid grid-cols-3 gap-3>
        <div
          v-for="preset in presets"
          :key="preset.name"
          class="preset-card"
          p-4 rounded-xl cursor-pointer text-center
          transition-all duration-300
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);"
          @click="applyPreset(preset)"
        >
          <div text-2xl mb-2>
            {{ preset.name === 'rain' ? '🌧️' : preset.name === 'campfire' ? '🏕️' : preset.name === 'ocean' ? '🏖️' : preset.name === 'cafe' ? '☕' : preset.name === 'forest' ? '🌲' : '⛈️' }}
          </div>
          <div text-sm font-500>{{ t(preset.nameKey) }}</div>
        </div>
      </div>
    </div>

    <!-- Timer -->
    <div mb-8 p-5 rounded-xl
      style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);"
    >
      <h3 text-lg font-600 mb-4>⏰ {{ t('timer') }}</h3>
      <div flex flex-wrap gap-2 mb-3>
        <n-button
          v-for="opt in timerOptions"
          :key="opt.value"
          :type="timerMinutes === opt.value ? 'primary' : 'default'"
          size="small"
          round
          @click="setTimer(opt.value)"
        >
          {{ opt.label }}
        </n-button>
      </div>
      <div v-if="timerRemaining > 0" mt-3>
        <div flex items-center justify-between mb-2>
          <span text-sm op-60>{{ t('remaining') }}</span>
          <span text-lg font-mono font-600>{{ timerDisplay }}</span>
        </div>
        <n-progress
          type="line"
          :percentage="timerProgress"
          :show-indicator="false"
          status="info"
          :height="6"
          :border-radius="3"
        />
      </div>
    </div>

    <!-- Sound Grid -->
    <div>
      <h3 text-lg font-600 mb-4>🎵 {{ t('sounds') }}</h3>
      <div class="sound-grid" grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4>
        <div
          v-for="sound in soundDefs"
          :key="sound.id"
          class="sound-card"
          :class="{ 'sound-active': soundStates[sound.id].active }"
          p-4 rounded-xl cursor-pointer
          transition-all duration-300
          :style="{
            background: soundStates[sound.id].active
              ? `rgba(${hexToRgb(sound.color)}, 0.15)`
              : 'rgba(255,255,255,0.04)',
            border: soundStates[sound.id].active
              ? `1px solid ${sound.color}40`
              : '1px solid rgba(255,255,255,0.08)',
          }"
          @click="toggleSound(sound.id)"
        >
          <!-- Icon & Label -->
          <div flex items-center gap-3 mb-3>
            <div
              w-10 h-10 rounded-lg flex items-center justify-center text-xl
              :style="{
                background: soundStates[sound.id].active
                  ? `${sound.color}25`
                  : 'rgba(255,255,255,0.06)',
              }"
            >
              {{ sound.icon }}
            </div>
            <div flex-1>
              <div text-sm font-600>{{ t(sound.labelKey) }}</div>
              <div text-xs op-40>{{ soundStates[sound.id].volume }}%</div>
            </div>
            <div
              class="toggle-indicator"
              w-3 h-3 rounded-full
              :style="{
                background: soundStates[sound.id].active ? sound.color : 'rgba(255,255,255,0.15)',
                boxShadow: soundStates[sound.id].active ? `0 0 8px ${sound.color}60` : 'none',
              }"
            />
          </div>

          <!-- Volume Slider (show when active) -->
          <div v-if="soundStates[sound.id].active" @click.stop>
            <n-slider
              :value="soundStates[sound.id].volume"
              :min="0" :max="100" :step="1"
              :format-tooltip="(v: number) => v + '%'"
              @update:value="(v: number) => updateSoundVolume(sound.id, v)"
            />
          </div>

          <!-- Inactive indicator -->
          <div v-else op-20 text-xs text-center mt-2>
            {{ lang === 'zh' ? '点击开启' : 'Tap to enable' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Tip -->
    <div mt-8 text-center op-40 text-sm>
      💡 {{ t('focusTip') }}
    </div>
  </div>
</template>



<style scoped>
.ambient-mixer {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.dot-active {
  background: #18a058;
  box-shadow: 0 0 8px rgba(24, 160, 88, 0.5);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-playing {
  background: rgba(24, 160, 88, 0.12);
  color: #18a058;
  border: 1px solid rgba(24, 160, 88, 0.2);
}

.status-paused {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preset-card:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  transform: translateY(-2px);
}

.sound-card:hover {
  transform: translateY(-2px);
}

.sound-card:hover:not(.sound-active) {
  background: rgba(255, 255, 255, 0.07) !important;
}

.sound-active {
  transform: none;
}

.sound-active:hover {
  transform: translateY(-1px);
}

.toggle-indicator {
  transition: all 0.3s ease;
}
</style>
