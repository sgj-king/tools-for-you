<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NInputNumber, NSwitch, NSlider, NIcon, NGrid, NGi, NTag } from 'naive-ui';
import { Copy, Refresh, Check, AlertCircle } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '密码生成器',
    subtitle: '生成安全随机密码，保护你的账户安全',
    length: '密码长度',
    uppercase: '大写字母 (A-Z)',
    lowercase: '小写字母 (a-z)',
    numbers: '数字 (0-9)',
    symbols: '特殊符号 (!@#$...)',
    generate: '生成密码',
    batchSize: '批量生成',
    batch1: '1个',
    batch5: '5个',
    batch10: '10个',
    strength: '密码强度',
    veryWeak: '非常弱',
    weak: '弱',
    medium: '中等',
    strong: '强',
    veryStrong: '非常强',
    entropy: '信息熵',
    bits: '比特',
    crackTime: '暴力破解时间',
    instant: '瞬间',
    seconds: '秒',
    minutes: '分钟',
    hours: '小时',
    days: '天',
    months: '月',
    years: '年',
    centuries: '数百年',
    forever: '几乎不可能',
    charset: '字符集',
    charsetSize: '字符集大小',
    presets: '快捷预设',
    presetPin: '纯数字 PIN',
    presetSimple: '简单密码',
    presetStrong: '高强度密码',
    presetPassphrase: '口令短语',
    presetUltra: '超安全密码',
    excludeAmbiguous: '排除易混淆字符',
    customSymbols: '自定义符号',
    customSymbolsPlaceholder: '输入可用特殊符号',
    copied: '已复制！',
    copyAll: '全部复制',
    history: '生成历史',
    clearHistory: '清空',
    noHistory: '暂无历史记录',
    tip: '小贴士',
    tipContent: '推荐使用16位以上包含大小写字母、数字和特殊符号的密码，不同网站请使用不同密码。',
    characters: '个字符',
    passphraseWords: '个单词',
    wordSeparator: '分隔符',
    dash: '短横线 (-)',
    underscore: '下划线 (_)',
    dot: '点号 (.)',
    space: '空格',
    none: '无分隔',
  },
  en: {
    title: 'Password Generator',
    subtitle: 'Generate secure random passwords to protect your accounts',
    length: 'Password Length',
    uppercase: 'Uppercase (A-Z)',
    lowercase: 'Lowercase (a-z)',
    numbers: 'Numbers (0-9)',
    symbols: 'Symbols (!@#$...)',
    generate: 'Generate',
    batchSize: 'Batch',
    batch1: '1',
    batch5: '5',
    batch10: '10',
    strength: 'Strength',
    veryWeak: 'Very Weak',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    veryStrong: 'Very Strong',
    entropy: 'Entropy',
    bits: 'bits',
    crackTime: 'Crack Time',
    instant: 'Instant',
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    months: 'months',
    years: 'years',
    centuries: 'centuries',
    forever: 'Practically impossible',
    charset: 'Charset',
    charsetSize: 'Charset Size',
    presets: 'Presets',
    presetPin: 'PIN (Numbers)',
    presetSimple: 'Simple',
    presetStrong: 'Strong',
    presetPassphrase: 'Passphrase',
    presetUltra: 'Ultra Secure',
    excludeAmbiguous: 'Exclude Ambiguous Chars',
    customSymbols: 'Custom Symbols',
    customSymbolsPlaceholder: 'Enter allowed symbols',
    copied: 'Copied!',
    copyAll: 'Copy All',
    history: 'History',
    clearHistory: 'Clear',
    noHistory: 'No history yet',
    tip: 'Tip',
    tipContent: 'Use 16+ character passwords with uppercase, lowercase, numbers, and symbols. Use different passwords for each site.',
    characters: 'characters',
    passphraseWords: 'words',
    wordSeparator: 'Separator',
    dash: 'Dash (-)',
    underscore: 'Underscore (_)',
    dot: 'Dot (.)',
    space: 'Space',
    none: 'None',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Character sets
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'Il1O0';

// Word list for passphrase (EFF short list style)
const WORDS_ZH = ['苹果','月亮','星辰','大海','山川','云朵','阳光','微风','彩虹','雪花','花园','蝴蝶','森林','溪流','翡翠','琥珀','梦境','飞鸟','流星','浪潮','晨曦','微风','银河','极光','清泉','竹林','萤火','露珠','画笔','琴弦','旅途','远航','深海','苍穹','烈焰','冰晶','春雨','秋叶','冬雪','夏花'];
const WORDS_EN = ['apple','moon','star','ocean','river','cloud','sun','wind','rain','snow','tree','leaf','fire','wave','fish','bird','rose','gold','key','fox','bear','wolf','deer','hawk','stone','light','dream','path','gate','hill','lake','seed','bell','coin','drum','flag','glow','hue','ink','jet'];

// State
const passwordLength = ref(16);
const useUppercase = ref(true);
const useLowercase = ref(true);
const useNumbers = ref(true);
const useSymbols = ref(true);
const excludeAmbiguous = ref(false);
const customSymbols = ref('');
const batchSize = ref(1);
const generatedPasswords = ref<string[]>([]);
const passphraseMode = ref(false);
const wordCount = ref(4);
const separator = ref<'dash' | 'underscore' | 'dot' | 'space' | 'none'>('dash');
const history = ref<string[]>([]);

// Build charset
const charset = computed(() => {
  let cs = '';
  if (useUppercase.value) cs += UPPER;
  if (useLowercase.value) cs += LOWER;
  if (useNumbers.value) cs += DIGITS;
  if (useSymbols.value) {
    cs += customSymbols.value || SYMBOLS;
  }
  if (excludeAmbiguous.value) {
    cs = cs.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
  }
  return cs;
});

// Password strength analysis
const strengthInfo = computed(() => {
  const cs = charset.value;
  const charsetLen = cs.length;
  if (charsetLen === 0) return { level: 0, label: 'veryWeak' as const, color: '#ef4444', percent: 0 };

  const len = passphraseMode.value ? wordCount.value : passwordLength.value;
  const effectiveCharset = passphraseMode.value ? 10000 : charsetLen;
  const entropy = len * Math.log2(effectiveCharset);

  if (entropy < 28) return { level: 1, label: 'veryWeak' as const, color: '#ef4444', percent: 10, entropy };
  if (entropy < 36) return { level: 2, label: 'weak' as const, color: '#f97316', percent: 25, entropy };
  if (entropy < 60) return { level: 3, label: 'medium' as const, color: '#eab308', percent: 50, entropy };
  if (entropy < 80) return { level: 4, label: 'strong' as const, color: '#22c55e', percent: 75, entropy };
  return { level: 5, label: 'veryStrong' as const, color: '#10b981', percent: 100, entropy };
});

// Crack time estimation
const crackTime = computed(() => {
  const entropy = strengthInfo.value.entropy || 0;
  if (entropy === 0) return t('instant').value;
  // Assume 10 billion guesses per second
  const seconds = Math.pow(2, entropy) / 10e9 / 2;
  if (seconds < 1) return t('instant').value;
  if (seconds < 60) return `${Math.ceil(seconds)} ${t('seconds').value}`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} ${t('minutes').value}`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} ${t('hours').value}`;
  if (seconds < 86400 * 30) return `${Math.ceil(seconds / 86400)} ${t('days').value}`;
  if (seconds < 86400 * 365) return `${Math.ceil(seconds / (86400 * 30))} ${t('months').value}`;
  if (seconds < 86400 * 365 * 100) return `${Math.ceil(seconds / (86400 * 365))} ${t('years').value}`;
  if (seconds < 86400 * 365 * 1e9) return `${Math.ceil(seconds / (86400 * 365 * 100))} ${t('centuries').value}`;
  return t('forever').value;
});

// Generate password
function generatePassword(): string {
  if (passphraseMode.value) {
    return generatePassphrase();
  }
  const cs = charset.value;
  if (cs.length === 0) return '';
  const arr = new Uint32Array(passwordLength.value);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => cs[v % cs.length]).join('');
}

function generatePassphrase(): string {
  const wordList = lang.value === 'zh' ? WORDS_ZH : WORDS_EN;
  const sep = separator.value === 'dash' ? '-' : separator.value === 'underscore' ? '_' : separator.value === 'dot' ? '.' : separator.value === 'space' ? ' ' : '';
  const arr = new Uint32Array(wordCount.value);
  crypto.getRandomValues(arr);
  const words = Array.from(arr, v => wordList[v % wordList.length]);
  // Capitalize first letter for English
  if (lang.value === 'en') {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(sep);
  }
  return words.join(sep);
}

function generate() {
  const passwords: string[] = [];
  for (let i = 0; i < batchSize.value; i++) {
    passwords.push(generatePassword());
  }
  generatedPasswords.value = passwords;
  // Add to history (limit 20)
  history.value = [...passwords, ...history.value].slice(0, 20);
}

// Copy
const justCopied = ref<string | null>(null);
function copyPassword(pw: string) {
  navigator.clipboard.writeText(pw);
  justCopied.value = pw;
  setTimeout(() => { justCopied.value = null; }, 1500);
}

function copyAll() {
  navigator.clipboard.writeText(generatedPasswords.value.join('\n'));
  justCopied.value = '__all__';
  setTimeout(() => { justCopied.value = null; }, 1500);
}

// Presets
function applyPreset(preset: string) {
  passphraseMode.value = false;
  switch (preset) {
    case 'pin':
      useUppercase.value = false; useLowercase.value = false;
      useNumbers.value = true; useSymbols.value = false;
      passwordLength.value = 6; excludeAmbiguous.value = false;
      break;
    case 'simple':
      useUppercase.value = true; useLowercase.value = true;
      useNumbers.value = true; useSymbols.value = false;
      passwordLength.value = 8; excludeAmbiguous.value = false;
      break;
    case 'strong':
      useUppercase.value = true; useLowercase.value = true;
      useNumbers.value = true; useSymbols.value = true;
      passwordLength.value = 16; excludeAmbiguous.value = false;
      break;
    case 'passphrase':
      passphraseMode.value = true;
      wordCount.value = 4;
      break;
    case 'ultra':
      useUppercase.value = true; useLowercase.value = true;
      useNumbers.value = true; useSymbols.value = true;
      passwordLength.value = 32; excludeAmbiguous.value = true;
      break;
  }
  generate();
}

// Initialize
generate();
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 960px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <n-grid :cols="24" :x-gap="16" responsive="screen" item-responsive>
        <!-- Left: Settings -->
        <n-gi span="24 m:10">
          <c-card mb-4>
            <div text-lg font-bold mb-4>⚙️ {{ t('title').value }}</div>

            <!-- Mode Toggle -->
            <div mb-4>
              <n-button-group style="width: 100%">
                <n-button
                  :type="!passphraseMode ? 'primary' : 'default'"
                  style="flex: 1"
                  @click="passphraseMode = false; generate()"
                >
                  🔑 {{ lang === 'zh' ? '密码模式' : 'Password' }}
                </n-button>
                <n-button
                  :type="passphraseMode ? 'primary' : 'default'"
                  style="flex: 1"
                  @click="passphraseMode = true; generate()"
                >
                  📝 {{ lang === 'zh' ? '口令模式' : 'Passphrase' }}
                </n-button>
              </n-button-group>
            </div>

            <!-- Presets -->
            <div mb-4>
              <div text-sm op-70 mb-2>{{ t('presets').value }}</div>
              <div flex flex-wrap gap-2>
                <n-tag
                  v-for="p in [
                    { key: 'pin', emoji: '🔢', label: t('presetPin').value },
                    { key: 'simple', emoji: '🌱', label: t('presetSimple').value },
                    { key: 'strong', emoji: '💪', label: t('presetStrong').value },
                    { key: 'passphrase', emoji: '📝', label: t('presetPassphrase').value },
                    { key: 'ultra', emoji: '🛡️', label: t('presetUltra').value },
                  ]"
                  :key="p.key"
                  round
                  bordered
                  style="cursor: pointer; transition: all 0.2s;"
                  @click="applyPreset(p.key)"
                >
                  {{ p.emoji }} {{ p.label }}
                </n-tag>
              </div>
            </div>

            <!-- Password Mode Settings -->
            <template v-if="!passphraseMode">
              <!-- Length Slider -->
              <div mb-4>
                <div flex justify-between mb-1>
                  <span text-sm op-70>{{ t('length').value }}</span>
                  <span text-sm font-bold>{{ passwordLength }} {{ t('characters').value }}</span>
                </div>
                <n-slider v-model:value="passwordLength" :min="4" :max="64" :step="1" :marks="{ 4: '4', 16: '16', 32: '32', 64: '64' }" />
              </div>

              <!-- Character Options -->
              <div flex flex-col gap-3 mb-4>
                <div flex items-center justify-between p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <span text-sm>🔠 {{ t('uppercase').value }}</span>
                  <n-switch v-model:value="useUppercase" size="small" />
                </div>
                <div flex items-center justify-between p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <span text-sm>🔡 {{ t('lowercase').value }}</span>
                  <n-switch v-model:value="useLowercase" size="small" />
                </div>
                <div flex items-center justify-between p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <span text-sm>🔢 {{ t('numbers').value }}</span>
                  <n-switch v-model:value="useNumbers" size="small" />
                </div>
                <div flex items-center justify-between p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <span text-sm>🔣 {{ t('symbols').value }}</span>
                  <n-switch v-model:value="useSymbols" size="small" />
                </div>
                <div flex items-center justify-between p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <span text-sm>🚫 {{ t('excludeAmbiguous').value }}</span>
                  <n-switch v-model:value="excludeAmbiguous" size="small" />
                </div>
              </div>

              <!-- Custom Symbols -->
              <div v-if="useSymbols" mb-4>
                <div text-sm op-70 mb-1>{{ t('customSymbols').value }}</div>
                <input
                  v-model="customSymbols"
                  :placeholder="t('customSymbolsPlaceholder').value"
                  class="custom-input"
                />
              </div>
            </template>

            <!-- Passphrase Mode Settings -->
            <template v-else>
              <!-- Word Count -->
              <div mb-4>
                <div flex justify-between mb-1>
                  <span text-sm op-70>{{ t('length').value }}</span>
                  <span text-sm font-bold>{{ wordCount }} {{ t('passphraseWords').value }}</span>
                </div>
                <n-slider v-model:value="wordCount" :min="3" :max="10" :step="1" :marks="{ 3: '3', 4: '4', 6: '6', 10: '10' }" />
              </div>

              <!-- Separator -->
              <div mb-4>
                <div text-sm op-70 mb-2>{{ t('wordSeparator').value }}</div>
                <n-button-group style="width: 100%">
                  <n-button
                    v-for="s in ([
                      { key: 'dash', label: t('dash').value },
                      { key: 'underscore', label: t('underscore').value },
                      { key: 'dot', label: t('dot').value },
                      { key: 'space', label: t('space').value },
                      { key: 'none', label: t('none').value },
                    ] as const)"
                    :key="s.key"
                    :type="separator === s.key ? 'primary' : 'default'"
                    style="flex: 1"
                    size="small"
                    @click="separator = s.key"
                  >
                    {{ s.label }}
                  </n-button>
                </n-button-group>
              </div>
            </template>

            <!-- Batch Size -->
            <div mb-4>
              <div text-sm op-70 mb-2>{{ t('batchSize').value }}</div>
              <n-button-group style="width: 100%">
                <n-button :type="batchSize === 1 ? 'primary' : 'default'" style="flex: 1" @click="batchSize = 1">{{ t('batch1').value }}</n-button>
                <n-button :type="batchSize === 5 ? 'primary' : 'default'" style="flex: 1" @click="batchSize = 5">{{ t('batch5').value }}</n-button>
                <n-button :type="batchSize === 10 ? 'primary' : 'default'" style="flex: 1" @click="batchSize = 10">{{ t('batch10').value }}</n-button>
              </n-button-group>
            </div>

            <!-- Generate Button -->
            <n-button type="primary" block size="large" round @click="generate">
              <template #icon><n-icon><Refresh /></n-icon></template>
              {{ t('generate').value }}
            </n-button>
          </c-card>

          <!-- Strength Info Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>🛡️ {{ t('strength').value }}</div>

            <!-- Strength Bar -->
            <div mb-4>
              <div relative h-3 rounded-full overflow-hidden style="background: rgba(255,255,255,0.08);">
                <div
                  h-full rounded-full
                  :style="{
                    width: `${strengthInfo.percent}%`,
                    background: `linear-gradient(90deg, ${strengthInfo.color}, ${strengthInfo.color}88)`,
                    transition: 'all 0.5s ease',
                    boxShadow: `0 0 12px ${strengthInfo.color}44`,
                  }"
                />
              </div>
              <div flex justify-between mt-2>
                <n-tag :color="{ color: strengthInfo.color + '22', borderColor: strengthInfo.color + '44', textColor: strengthInfo.color }" round size="small">
                  {{ t(strengthInfo.label).value }}
                </n-tag>
                <span text-xs op-50>
                  {{ t('entropy').value }}: {{ Math.round(strengthInfo.entropy || 0) }} {{ t('bits').value }}
                </span>
              </div>
            </div>

            <!-- Crack Time -->
            <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
              <div flex items-center gap-2>
                <span>⏱️</span>
                <span text-sm op-70>{{ t('crackTime').value }}:</span>
                <span text-sm font-bold :style="{ color: strengthInfo.color }">{{ crackTime.value }}</span>
              </div>
              <div text-xs op-40 mt-1>
                {{ t('charsetSize').value }}: {{ charset.value.length || (passphraseMode ? 40 : 0) }}
              </div>
            </div>
          </c-card>

          <!-- Tip Card -->
          <c-card>
            <div p-3 rounded-lg style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);">
              <div text-sm text-emerald-400 mb-1>💡 {{ t('tip').value }}</div>
              <div text-xs op-70>{{ t('tipContent').value }}</div>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Results -->
        <n-gi span="24 m:14">
          <!-- Generated Passwords -->
          <c-card mb-4>
            <div flex justify-between items-center mb-4>
              <div text-lg font-bold>🔑 {{ lang === 'zh' ? '生成结果' : 'Results' }}</div>
              <n-button v-if="batchSize > 1" size="small" round quaternary @click="copyAll">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ justCopied === '__all__' ? t('copied').value : t('copyAll').value }}
              </n-button>
            </div>

            <div flex flex-col gap-3>
              <div
                v-for="(pw, idx) in generatedPasswords"
                :key="idx"
                p-4 rounded-xl
                style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); transition: all 0.2s;"
                hover:border-color="rgba(34,197,94,0.3)"
              >
                <!-- Password Display with Color Coding -->
                <div flex items-center gap-3>
                  <div flex-1 font-mono text-base break-all select-all style="letter-spacing: 0.5px; line-height: 1.8;">
                    <template v-if="!passphraseMode">
                      <span v-for="(ch, i) in pw" :key="i" :class="{
                        'text-blue-400': UPPER.includes(ch),
                        'text-green-400': LOWER.includes(ch),
                        'text-amber-400': DIGITS.includes(ch),
                        'text-rose-400': SYMBOLS.includes(ch) || (customSymbols && customSymbols.includes(ch)),
                      }">{{ ch }}</span>
                    </template>
                    <template v-else>
                      <span style="color: #a78bfa;">{{ pw }}</span>
                    </template>
                  </div>
                  <n-button quaternary circle size="small" @click="copyPassword(pw)">
                    <template #icon>
                      <n-icon :color="justCopied === pw ? '#22c55e' : undefined">
                        <Check v-if="justCopied === pw" />
                        <Copy v-else />
                      </n-icon>
                    </template>
                  </n-button>
                </div>

                <!-- Password Meta -->
                <div flex items-center gap-3 mt-2 text-xs op-40>
                  <span>{{ pw.length }} {{ t('characters').value }}</span>
                  <span>·</span>
                  <span>{{ Math.round((passphraseMode ? wordCount * Math.log2(40) : pw.length * Math.log2(charset.value.length || 1))) }} {{ t('bits').value }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="generatedPasswords.length === 0" text-center py-8>
              <div text-4xl mb-3>🔐</div>
              <div text-sm op-50>{{ lang === 'zh' ? '点击生成按钮创建密码' : 'Click generate to create a password' }}</div>
            </div>
          </c-card>

          <!-- History -->
          <c-card v-if="history.length > 0">
            <div flex justify-between items-center mb-3>
              <div text-lg font-bold>📜 {{ t('history').value }}</div>
              <n-button size="tiny" quaternary round @click="history = []">
                {{ t('clearHistory').value }}
              </n-button>
            </div>
            <div flex flex-col gap-2>
              <div
                v-for="(pw, idx) in history.slice(0, 8)"
                :key="idx"
                flex items-center gap-2 p-2 rounded-lg
                style="background: rgba(255,255,255,0.02);"
              >
                <div flex-1 font-mono text-xs truncate op-60>{{ pw }}</div>
                <n-button quaternary circle size="tiny" @click="copyPassword(pw)">
                  <template #icon>
                    <n-icon :color="justCopied === pw ? '#22c55e' : undefined" size="12">
                      <Check v-if="justCopied === pw" />
                      <Copy v-else />
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
.custom-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
}
.custom-input:focus {
  border-color: rgba(34, 197, 94, 0.4);
}
.custom-input::placeholder {
  opacity: 0.4;
}
</style>
