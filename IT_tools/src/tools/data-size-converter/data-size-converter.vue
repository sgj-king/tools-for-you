<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import {
  NButton,
  NInput,
  NInputNumber,
  NGrid,
  NGi,
  NSelect,
  NSwitch,
  NIcon,
  NTooltip,
  NTag,
  NDivider,
  NScrollbar,
} from 'naive-ui';
import { Copy, Refresh, Database, ArrowsSort, InfoCircle, SwitchVertical } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '数据大小转换器',
    subtitle: '轻松换算数据存储单位，Bit/Byte/KB/MB/GB/TB/PB/EB 一键互转',
    input: '输入',
    inputValue: '数值',
    inputUnit: '单位',
    standard: '标准',
    decimalStandard: '十进制 (SI)',
    binaryStandard: '二进制 (IEC)',
    decimalDesc: '1 KB = 1000 Byte（硬盘/网络常用）',
    binaryDesc: '1 KiB = 1024 Byte（内存/系统常用）',
    results: '转换结果',
    allUnits: '全部单位',
    comparison: '直观对比',
    equals: '等于',
    copyValue: '复制',
    copied: '已复制！',
    swap: '交换',
    reset: '重置',
    whatIsThis: '关于数据单位',
    whatIsThisContent: '数据存储有两种标准：十进制(SI)使用1000为基数，是硬盘厂商和网络速度常用的标准；二进制(IEC)使用1024为基数，是操作系统和内存常用的标准。这就是为什么买的500GB硬盘在电脑上只显示约465GiB。',
    decimalNote: '硬盘容量、网络带宽通常使用十进制标准',
    binaryNote: '操作系统、内存容量通常使用二进制标准',
    bits: '比特',
    bytes: '字节',
    charApprox: '≈ 字符数',
    commonExamples: '常见示例',
    example1: '一张照片',
    example2: '一首MP3',
    example3: '一部电影',
    example4: '一款游戏',
    example5: '一块硬盘',
    example1Size: '3-10 MB',
    example2Size: '3-5 MB',
    example3Size: '1-4 GB',
    example4Size: '20-100 GB',
    example5Size: '500 GB - 2 TB',
    quickPresets: '快捷输入',
    preset4KVideo: '4K视频/分钟',
    preset4KVideoSize: '400 MB',
    presetPhoto: '高清照片',
    presetPhotoSize: '5 MB',
    presetSong: '高品质歌曲',
    presetSongSize: '8 MB',
    presetApp: '大型应用',
    presetAppSize: '200 MB',
    presetRAM: '内存条',
    presetRAMSize: '8 GB',
    presetSSD: '固态硬盘',
    presetSSDSize: '512 GB',
    presetHDD: '机械硬盘',
    presetHDDSize: '2000 GB',
    timeToTransfer: '传输时间估算',
    transferSpeed: '传输速度',
    transferTime: '预计耗时',
    speed100Mbps: '100 Mbps',
    speed1Gbps: '1 Gbps',
    speed10Gbps: '10 Gbps',
    speedWiFi6: 'WiFi 6',
    speed5G: '5G 网络',
    speedUSB3: 'USB 3.0',
    hour: '小时',
    minute: '分钟',
    second: '秒',
    ms: '毫秒',
    lessThan1ms: '< 1ms',
    instantly: '即时',
  },
  en: {
    title: 'Data Size Converter',
    subtitle: 'Easily convert between data storage units — Bit/Byte/KB/MB/GB/TB/PB/EB at a glance',
    input: 'Input',
    inputValue: 'Value',
    inputUnit: 'Unit',
    standard: 'Standard',
    decimalStandard: 'Decimal (SI)',
    binaryStandard: 'Binary (IEC)',
    decimalDesc: '1 KB = 1000 Bytes (drives/networks)',
    binaryDesc: '1 KiB = 1024 Bytes (OS/memory)',
    results: 'Results',
    allUnits: 'All Units',
    comparison: 'Visual Comparison',
    equals: 'equals',
    copyValue: 'Copy',
    copied: 'Copied!',
    swap: 'Swap',
    reset: 'Reset',
    whatIsThis: 'About Data Units',
    whatIsThisContent: 'Two standards exist: Decimal (SI) uses base-1000, common for hard drives and network speeds; Binary (IEC) uses base-1024, common for OS and memory. This is why a 500GB drive shows ~465GiB in your OS.',
    decimalNote: 'Hard drive capacity & network bandwidth typically use decimal standard',
    binaryNote: 'Operating system & RAM capacity typically use binary standard',
    bits: 'Bits',
    bytes: 'Bytes',
    charApprox: '≈ Characters',
    commonExamples: 'Common Examples',
    example1: 'A photo',
    example2: 'An MP3 song',
    example3: 'A movie',
    example4: 'A game',
    example5: 'A hard drive',
    example1Size: '3-10 MB',
    example2Size: '3-5 MB',
    example3Size: '1-4 GB',
    example4Size: '20-100 GB',
    example5Size: '500 GB - 2 TB',
    quickPresets: 'Quick Presets',
    preset4KVideo: '4K Video/min',
    preset4KVideoSize: '400 MB',
    presetPhoto: 'HD Photo',
    presetPhotoSize: '5 MB',
    presetSong: 'HQ Song',
    presetSongSize: '8 MB',
    presetApp: 'Large App',
    presetAppSize: '200 MB',
    presetRAM: 'RAM Stick',
    presetRAMSize: '8 GB',
    presetSSD: 'SSD Drive',
    presetSSDSize: '512 GB',
    presetHDD: 'HDD Drive',
    presetHDDSize: '2000 GB',
    timeToTransfer: 'Transfer Time Est.',
    transferSpeed: 'Transfer Speed',
    transferTime: 'Est. Time',
    speed100Mbps: '100 Mbps',
    speed1Gbps: '1 Gbps',
    speed10Gbps: '10 Gbps',
    speedWiFi6: 'WiFi 6',
    speed5G: '5G Network',
    speedUSB3: 'USB 3.0',
    hour: 'hr',
    minute: 'min',
    second: 'sec',
    ms: 'ms',
    lessThan1ms: '< 1ms',
    instantly: 'Instant',
  },
};

// Language
const lang = useStorage<'zh' | 'en'>('data-size-converter-lang', 'zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Unit Definitions =====================
interface UnitDef {
  name: string;
  nameZh: string;
  symbol: string;
  decimalPower: number;  // power of 1000
  binaryPower: number;   // power of 1024
  isBit?: boolean;
}

const units: UnitDef[] = [
  { name: 'Bit', nameZh: '比特', symbol: 'bit', decimalPower: 0, binaryPower: 0, isBit: true },
  { name: 'Byte', nameZh: '字节', symbol: 'B', decimalPower: 0, binaryPower: 0 },
  { name: 'Kilobyte', nameZh: '千字节', symbol: 'KB', decimalPower: 1, binaryPower: 1 },
  { name: 'Megabyte', nameZh: '兆字节', symbol: 'MB', decimalPower: 2, binaryPower: 2 },
  { name: 'Gigabyte', nameZh: '吉字节', symbol: 'GB', decimalPower: 3, binaryPower: 3 },
  { name: 'Terabyte', nameZh: '太字节', symbol: 'TB', decimalPower: 4, binaryPower: 4 },
  { name: 'Petabyte', nameZh: '拍字节', symbol: 'PB', decimalPower: 5, binaryPower: 5 },
  { name: 'Exabyte', nameZh: '艾字节', symbol: 'EB', decimalPower: 6, binaryPower: 6 },
];

// IEC binary symbols
const binarySymbols: Record<string, string> = {
  'KB': 'KiB',
  'MB': 'MiB',
  'GB': 'GiB',
  'TB': 'TiB',
  'PB': 'PiB',
  'EB': 'EiB',
};

// ===================== State =====================
const inputValue = ref<number>(1);
const inputUnitIndex = ref<number>(4); // Default: GB
const isBinary = ref<boolean>(false); // Default: decimal (SI)
const copiedTag = ref<string>('');

// ===================== Conversion Logic =====================
const convertToBytes = (value: number, unitIndex: number, binary: boolean): number => {
  const unit = units[unitIndex];
  let bytes = value;

  if (unit.isBit) {
    return value / 8; // bits to bytes
  }

  if (unit.symbol === 'B') {
    return value;
  }

  if (binary) {
    bytes = value * Math.pow(1024, unit.binaryPower);
  } else {
    bytes = value * Math.pow(1000, unit.decimalPower);
  }

  return bytes;
};

const convertFromBytes = (bytes: number, unitIndex: number, binary: boolean): number => {
  const unit = units[unitIndex];

  if (unit.isBit) {
    return bytes * 8;
  }

  if (unit.symbol === 'B') {
    return bytes;
  }

  if (binary) {
    return bytes / Math.pow(1024, unit.binaryPower);
  } else {
    return bytes / Math.pow(1000, unit.decimalPower);
  }
};

// All conversions
const conversions = computed(() => {
  const bytes = convertToBytes(inputValue.value, inputUnitIndex.value, isBinary.value);
  return units.map((unit, index) => {
    const value = convertFromBytes(bytes, index, isBinary.value);
    return {
      unit,
      index,
      value,
      formatted: formatValue(value),
      symbol: isBinary.value && binarySymbols[unit.symbol] ? binarySymbols[unit.symbol] : unit.symbol,
      fullName: lang.value === 'zh' ? unit.nameZh : unit.name,
    };
  });
});

// Format value with appropriate precision
const formatValue = (val: number): string => {
  if (val === 0) return '0';
  if (Number.isNaN(val) || !Number.isFinite(val)) return '—';
  if (Math.abs(val) >= 1e15) return val.toExponential(4);
  if (Math.abs(val) >= 1e12) return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (Math.abs(val) >= 1e9) return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (Math.abs(val) >= 1e6) return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (Math.abs(val) >= 1e3) return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (Math.abs(val) >= 1) return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
  if (Math.abs(val) >= 0.001) return val.toFixed(6);
  return val.toExponential(4);
};

// Visual comparison - how many of common items
const visualComparison = computed(() => {
  const bytes = convertToBytes(inputValue.value, inputUnitIndex.value, isBinary.value);
  const mb = bytes / (1000 * 1000);

  const items: { icon: string; labelZh: string; labelEn: string; sizeMB: number }[] = [
    { icon: '📷', labelZh: '张高清照片', labelEn: 'HD photos', sizeMB: 5 },
    { icon: '🎵', labelZh: '首高品质歌曲', labelEn: 'HQ songs', sizeMB: 8 },
    { icon: '🎬', labelZh: '部高清电影', labelEn: 'HD movies', sizeMB: 4000 },
    { icon: '📄', labelZh: '页文本文档', labelEn: 'text pages', sizeMB: 0.002 },
    { icon: '📧', labelZh: '封邮件', labelEn: 'emails', sizeMB: 0.05 },
    { icon: '🎮', labelZh: '个大型游戏', labelEn: 'large games', sizeMB: 50000 },
  ];

  return items.map(item => {
    const count = mb / item.sizeMB;
    let display: string;
    if (count < 0.001) display = '< 0.001';
    else if (count < 1) display = count.toFixed(3);
    else if (count < 1000) display = count.toFixed(count < 10 ? 1 : 0);
    else if (count < 1000000) display = `${(count / 1000).toFixed(1)}K`;
    else display = `${(count / 1000000).toFixed(1)}M`;

    return {
      icon: item.icon,
      label: lang.value === 'zh' ? item.labelZh : item.labelEn,
      display,
    };
  });
});

// Transfer time estimation
const transferSpeeds = computed(() => [
  { name: t('speed100Mbps').value, bitsPerSec: 100 * 1e6 },
  { name: t('speed1Gbps').value, bitsPerSec: 1 * 1e9 },
  { name: t('speed10Gbps').value, bitsPerSec: 10 * 1e9 },
  { name: t('speedWiFi6').value, bitsPerSec: 1.2 * 1e9 },
  { name: t('speed5G').value, bitsPerSec: 200 * 1e6 },
  { name: t('speedUSB3').value, bitsPerSec: 5 * 1e9 },
]);

const transferTimes = computed(() => {
  const bits = convertToBytes(inputValue.value, inputUnitIndex.value, isBinary.value) * 8;
  return transferSpeeds.value.map(speed => {
    const seconds = bits / speed.bitsPerSec;
    return {
      name: speed.name,
      time: formatTime(seconds),
    };
  });
});

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 0.001) return t('lessThan1ms').value;
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ${t('ms').value}`;
  if (seconds < 60) return `${seconds.toFixed(1)} ${t('second').value}`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m} ${t('minute').value} ${s} ${t('second').value}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} ${t('hour').value} ${m} ${t('minute').value}`;
};

// Unit options for select
const unitOptions = computed(() =>
  units.map((unit, index) => ({
    label: `${unit.symbol} — ${lang.value === 'zh' ? unit.nameZh : unit.name}`,
    value: index,
  })),
);

// ===================== Actions =====================
const copyValue = (text: string, tag: string) => {
  navigator.clipboard.writeText(text);
  copiedTag.value = tag;
  setTimeout(() => { copiedTag.value = ''; }, 1500);
};

const reset = () => {
  inputValue.value = 1;
  inputUnitIndex.value = 4;
  isBinary.value = false;
};

// Quick presets
const applyPreset = (value: number, unitIndex: number) => {
  inputValue.value = value;
  inputUnitIndex.value = unitIndex;
};

const presetList = computed(() => [
  { label: t('preset4KVideo').value, value: 400, unit: 3, badge: '400 MB' },
  { label: t('presetPhoto').value, value: 5, unit: 3, badge: '5 MB' },
  { label: t('presetSong').value, value: 8, unit: 3, badge: '8 MB' },
  { label: t('presetApp').value, value: 200, unit: 3, badge: '200 MB' },
  { label: t('presetRAM').value, value: 8, unit: 4, badge: '8 GB' },
  { label: t('presetSSD').value, value: 512, unit: 4, badge: '512 GB' },
  { label: t('presetHDD').value, value: 2000, unit: 4, badge: '2 TB' },
]);

// Decimal vs Binary difference highlight
const decimalVsBinary = computed(() => {
  if (!isBinary.value) return null;
  const bytesDec = convertToBytes(inputValue.value, inputUnitIndex.value, false);
  const bytesBin = convertToBytes(inputValue.value, inputUnitIndex.value, true);
  const diff = ((bytesBin - bytesDec) / bytesDec * 100);
  return diff.toFixed(2);
});

// ===================== Style =====================ън
</script>

<template>
  <div class="data-size-converter">
    <!-- Header -->
    <div class="dsc-header">
      <div class="dsc-title-row">
        <NIcon size="28" class="dsc-icon"><Database /></NIcon>
        <div>
          <h2 class="dsc-title">{{ t('title').value }}</h2>
          <p class="dsc-subtitle">{{ t('subtitle').value }}</p>
        </div>
      </div>
      <!-- Lang switch -->
      <NButton size="tiny" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
        {{ lang === 'zh' ? 'EN' : '中' }}
      </NButton>
    </div>

    <!-- Standard toggle -->
    <div class="dsc-standard">
      <div class="dsc-standard-toggle">
        <span :class="{ active: !isBinary }">{{ t('decimalStandard').value }}</span>
        <NSwitch v-model:value="isBinary" />
        <span :class="{ active: isBinary }">{{ t('binaryStandard').value }}</span>
      </div>
      <p class="dsc-standard-desc">
        <NIcon size="14" style="margin-right:4px"><InfoCircle /></NIcon>
        {{ isBinary ? t('binaryDesc').value : t('decimalDesc').value }}
      </p>
    </div>

    <!-- Quick presets -->
    <div class="dsc-presets">
      <span class="dsc-presets-label">{{ t('quickPresets').value }}</span>
      <div class="dsc-presets-list">
        <NButton
          v-for="preset in presetList"
          :key="preset.label"
          size="tiny"
          secondary
          @click="applyPreset(preset.value, preset.unit)"
        >
          {{ preset.label }} <NTag size="tiny" :bordered="false" type="info" style="margin-left:4px">{{ preset.badge }}</NTag>
        </NButton>
      </div>
    </div>

    <!-- Input -->
    <div class="dsc-input-section">
      <div class="dsc-input-row">
        <NInputNumber
          v-model:value="inputValue"
          :min="0"
          :step="1"
          size="large"
          class="dsc-value-input"
          :placeholder="t('inputValue').value"
        />
        <NSelect
          v-model:value="inputUnitIndex"
          :options="unitOptions"
          size="large"
          class="dsc-unit-select"
        />
      </div>
    </div>

    <!-- Results -->
    <div class="dsc-results">
      <h3 class="dsc-section-title">{{ t('allUnits').value }}</h3>
      <div class="dsc-conversion-grid">
        <div
          v-for="conv in conversions"
          :key="conv.index"
          class="dsc-conversion-card"
          :class="{ 'dsc-current': conv.index === inputUnitIndex }"
        >
          <div class="dsc-card-top">
            <span class="dsc-card-symbol">{{ conv.symbol }}</span>
            <span class="dsc-card-name">{{ conv.fullName }}</span>
          </div>
          <div class="dsc-card-value">{{ conv.formatted }}</div>
          <NButton
            size="tiny"
            quaternary
            class="dsc-copy-btn"
            @click="copyValue(`${conv.formatted} ${conv.symbol}`, conv.symbol)"
          >
            <template #icon><NIcon size="14"><Copy /></NIcon></template>
            {{ copiedTag === conv.symbol ? t('copied').value : '' }}
          </NButton>
        </div>
      </div>
    </div>

    <!-- Visual comparison -->
    <div class="dsc-comparison">
      <h3 class="dsc-section-title">{{ t('comparison').value }}</h3>
      <div class="dsc-comparison-grid">
        <div v-for="item in visualComparison" :key="item.label" class="dsc-compare-item">
          <span class="dsc-compare-icon">{{ item.icon }}</span>
          <span class="dsc-compare-count">{{ item.display }}</span>
          <span class="dsc-compare-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- Transfer time -->
    <div class="dsc-transfer">
      <h3 class="dsc-section-title">{{ t('timeToTransfer').value }}</h3>
      <div class="dsc-transfer-grid">
        <div v-for="tt in transferTimes" :key="tt.name" class="dsc-transfer-item">
          <span class="dsc-transfer-name">{{ tt.name }}</span>
          <span class="dsc-transfer-time">{{ tt.time }}</span>
        </div>
      </div>
    </div>

    <!-- Info section -->
    <div class="dsc-info">
      <h3 class="dsc-section-title">{{ t('whatIsThis').value }}</h3>
      <p class="dsc-info-text">{{ t('whatIsThisContent').value }}</p>
      <div class="dsc-info-cards">
        <div class="dsc-info-card">
          <NTag type="info" size="small">SI / Decimal</NTag>
          <p>{{ t('decimalNote').value }}</p>
          <code>1 KB = 1,000 B</code>
        </div>
        <div class="dsc-info-card">
          <NTag type="warning" size="small">IEC / Binary</NTag>
          <p>{{ t('binaryNote').value }}</p>
          <code>1 KiB = 1,024 B</code>
        </div>
      </div>
    </div>

    <!-- Reset -->
    <div class="dsc-actions">
      <NButton @click="reset" secondary>
        <template #icon><NIcon><Refresh /></NIcon></template>
        {{ t('reset').value }}
      </NButton>
    </div>
  </div>
</template>

<style scoped>
.data-size-converter {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px;
}

.dsc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.dsc-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dsc-icon {
  color: #63e2b7;
}

.dsc-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.dsc-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

/* Standard toggle */
.dsc-standard {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.dsc-standard-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
}

.dsc-standard-toggle .active {
  color: #63e2b7;
  font-weight: 600;
}

.dsc-standard-desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
}

/* Quick presets */
.dsc-presets {
  margin-bottom: 16px;
}

.dsc-presets-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
  display: block;
}

.dsc-presets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* Input */
.dsc-input-section {
  margin-bottom: 20px;
}

.dsc-input-row {
  display: flex;
  gap: 10px;
}

.dsc-value-input {
  flex: 1;
}

.dsc-unit-select {
  width: 200px;
}

/* Section title */
.dsc-section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

/* Conversion grid */
.dsc-conversion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 24px;
}

.dsc-conversion-card {
  position: relative;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: all 0.2s;
}

.dsc-conversion-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(99, 226, 183, 0.2);
}

.dsc-conversion-card.dsc-current {
  background: rgba(99, 226, 183, 0.08);
  border-color: rgba(99, 226, 183, 0.3);
}

.dsc-card-top {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.dsc-card-symbol {
  font-size: 15px;
  font-weight: 700;
  color: #63e2b7;
}

.dsc-card-name {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.dsc-card-value {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  word-break: break-all;
  font-variant-numeric: tabular-nums;
}

.dsc-copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.dsc-conversion-card:hover .dsc-copy-btn {
  opacity: 1;
}

/* Comparison */
.dsc-comparison {
  margin-bottom: 24px;
}

.dsc-comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.dsc-compare-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.dsc-compare-icon {
  font-size: 22px;
  margin-bottom: 4px;
}

.dsc-compare-count {
  font-size: 16px;
  font-weight: 700;
  color: #f2c97d;
}

.dsc-compare-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

/* Transfer time */
.dsc-transfer {
  margin-bottom: 24px;
}

.dsc-transfer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 6px;
}

.dsc-transfer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.dsc-transfer-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.dsc-transfer-time {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  font-variant-numeric: tabular-nums;
}

/* Info */
.dsc-info {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.dsc-info-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  margin: 0 0 12px;
}

.dsc-info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.dsc-info-card {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.dsc-info-card p {
  margin: 6px 0 4px;
  line-height: 1.5;
}

.dsc-info-card code {
  display: block;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-size: 12px;
  color: #63e2b7;
}

/* Actions */
.dsc-actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

/* Responsive */
@media (max-width: 600px) {
  .dsc-conversion-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dsc-input-row {
    flex-direction: column;
  }
  .dsc-unit-select {
    width: 100%;
  }
  .dsc-info-cards {
    grid-template-columns: 1fr;
  }
}
</style>
