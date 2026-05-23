<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStorage } from '@vueuse/core';
import {
  NButton, NInput, NIcon, NTag, NSwitch, NTooltip, NScrollbar,
  NCheckbox, NCheckboxGroup, NDivider, NStatistic, NSpace, NAlert,
} from 'naive-ui';
import {
  Copy, Trash, EyeOff, Eye, Shield, Settings, Checkmark,
  Bolt, Refresh, Download,
} from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '隐私数据脱敏',
    subtitle: '自动识别并遮蔽文本中的敏感信息，安全分享无忧',
    inputLabel: '原始文本',
    inputPlaceholder: '粘贴包含敏感信息的文本...\n例如：\n姓名：张三，手机：13812345678，邮箱：zhangsan@qq.com\n身份证：110101199003071234，银行卡：6222021234567890123\nIP地址：192.168.1.100，地址：北京市朝阳区某某路123号',
    outputLabel: '脱敏结果',
    outputPlaceholder: '脱敏后的文本将显示在这里...',
    redact: '脱敏',
    clear: '清空',
    copy: '复制结果',
    copied: '已复制！',
    swap: '交换',
    rules: '脱敏规则',
    presets: '快捷预设',
    presetAll: '全选',
    presetNone: '全不选',
    presetCommon: '常用',
    presetStrict: '严格',
    stats: '检测统计',
    totalFound: '发现敏感项',
    items: '项',
    rulePhone: '手机号码',
    ruleIdCard: '身份证号',
    ruleEmail: '电子邮箱',
    ruleBankCard: '银行卡号',
    ruleIp: 'IP 地址',
    ruleName: '中文姓名',
    ruleAddress: '详细地址',
    rulePassport: '护照号',
    rulePlate: '车牌号',
    ruleWechat: '微信号',
    detailTitle: '脱敏明细',
    type: '类型',
    original: '原文',
    redacted: '脱敏',
    count: '数量',
    noInput: '请在左侧输入需要脱敏的文本',
    noResult: '未检测到敏感信息',
    maskMode: '遮蔽方式',
    maskPartial: '部分遮蔽',
    maskFull: '完全遮蔽',
    maskReplace: '类型替换',
    customMask: '遮蔽字符',
    exportResult: '导出结果',
    history: '历史记录',
    noHistory: '暂无历史记录',
  },
  en: {
    title: 'Privacy Redactor',
    subtitle: 'Auto-detect & mask sensitive info in text for safe sharing',
    inputLabel: 'Original Text',
    inputPlaceholder: 'Paste text with sensitive information...\ne.g.:\nName: John Doe, Phone: +1-555-123-4567, Email: john@example.com\nSSN: 123-45-6789, Card: 4111-1111-1111-1111\nIP: 192.168.1.100, Address: 123 Main St, New York',
    outputLabel: 'Redacted Result',
    outputPlaceholder: 'Redacted text will appear here...',
    redact: 'Redact',
    clear: 'Clear',
    copy: 'Copy Result',
    copied: 'Copied!',
    swap: 'Swap',
    rules: 'Redaction Rules',
    presets: 'Quick Presets',
    presetAll: 'Select All',
    presetNone: 'Deselect All',
    presetCommon: 'Common',
    presetStrict: 'Strict',
    stats: 'Detection Stats',
    totalFound: 'Sensitive Items',
    items: 'items',
    rulePhone: 'Phone Number',
    ruleIdCard: 'ID Card Number',
    ruleEmail: 'Email Address',
    ruleBankCard: 'Bank Card Number',
    ruleIp: 'IP Address',
    ruleName: 'Chinese Name',
    ruleAddress: 'Detailed Address',
    rulePassport: 'Passport Number',
    rulePlate: 'License Plate',
    ruleWechat: 'WeChat ID',
    detailTitle: 'Redaction Details',
    type: 'Type',
    original: 'Original',
    redacted: 'Redacted',
    count: 'Count',
    noInput: 'Paste text on the left to start',
    noResult: 'No sensitive information detected',
    maskMode: 'Mask Mode',
    maskPartial: 'Partial Mask',
    maskFull: 'Full Mask',
    maskReplace: 'Type Label',
    customMask: 'Mask Character',
    exportResult: 'Export Result',
    history: 'History',
    noHistory: 'No history yet',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Types =====================
type RuleKey = 'phone' | 'idCard' | 'email' | 'bankCard' | 'ip' | 'name' | 'address' | 'passport' | 'plate' | 'wechat';
type MaskMode = 'partial' | 'full' | 'replace';

interface RedactionRule {
  key: RuleKey;
  labelKey: keyof typeof labels.zh;
  pattern: RegExp;
  partialMask: (match: string) => string;
  replaceLabel: string;
  replaceLabelEn: string;
  color: string;
}

interface RedactionItem {
  type: string;
  original: string;
  redacted: string;
  ruleKey: RuleKey;
  color: string;
}

// ===================== State =====================
const inputText = ref('');
const outputText = ref('');
const enabledRules = useStorage<RuleKey[]>('privacy-redactor-rules', ['phone', 'idCard', 'email', 'bankCard', 'ip', 'name']);
const maskMode = useStorage<MaskMode>('privacy-redactor-mask-mode', 'partial');
const maskChar = useStorage<string>('privacy-redactor-mask-char', '*');
const redactionDetails = ref<RedactionItem[]>([]);
const copied = ref(false);
const showSettings = ref(true);

// ===================== Rules =====================
const allRules: RedactionRule[] = [
  {
    key: 'phone',
    labelKey: 'rulePhone',
    pattern: /1[3-9]\d{9}/g,
    partialMask: (m) => m.slice(0, 3) + '****' + m.slice(7),
    replaceLabel: '[手机号]',
    replaceLabelEn: '[Phone]',
    color: '#f56c6c',
  },
  {
    key: 'idCard',
    labelKey: 'ruleIdCard',
    pattern: /[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g,
    partialMask: (m) => m.slice(0, 6) + '********' + m.slice(14),
    replaceLabel: '[身份证]',
    replaceLabelEn: '[ID Card]',
    color: '#e6a23c',
  },
  {
    key: 'email',
    labelKey: 'ruleEmail',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    partialMask: (m) => {
      const [local, domain] = m.split('@');
      const masked = local.length > 2
        ? local[0] + '***' + local.slice(-1)
        : '***';
      return masked + '@' + domain;
    },
    replaceLabel: '[邮箱]',
    replaceLabelEn: '[Email]',
    color: '#409eff',
  },
  {
    key: 'bankCard',
    labelKey: 'ruleBankCard',
    pattern: /(?:62|45|51|35|37|40|41|42|43|44|49)\d{14,17}/g,
    partialMask: (m) => m.slice(0, 4) + ' **** **** ' + m.slice(-4),
    replaceLabel: '[银行卡]',
    replaceLabelEn: '[Bank Card]',
    color: '#67c23a',
  },
  {
    key: 'ip',
    labelKey: 'ruleIp',
    pattern: /(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)/g,
    partialMask: (m) => m.split('.').map((seg, i) => i < 2 ? seg : '***').join('.'),
    replaceLabel: '[IP地址]',
    replaceLabelEn: '[IP Address]',
    color: '#909399',
  },
  {
    key: 'name',
    labelKey: 'ruleName',
    pattern: /[\u4e00-\u9fa5]{2,4}(?=，|,|。|\.|、|：|:|的|是|有|在|和|与|了|到|把|被|让|给|对|向|从|为|而|又|也|还|就|都|已|将|会|能|可|应|需|须|要|想|肯|敢|该|当|应|曾|刚|正|将|方|始|终|已|曾|偏|好|最|更|很|极|太|挺|真|多|少|大|小|长|短|高|低|快|慢|早|晚|深|浅|厚|薄|宽|窄|远|近|老|少|新|旧|好|坏|美|丑|善|恶|优|劣|强|弱|轻|重|明|暗|冷|热|干|湿|硬|软|粗|细|黑|白|红|绿|蓝|黄|紫|灰|金|银|铜|铁|锡|铅|铝|锌|镁|钠|钾|钙|碳|氢|氧|氮|硫|磷|硅|氯|氟|碘|氦|氖|氩|氪|氙|氡)/g,
    partialMask: (m) => m[0] + (lang.value === 'zh' ? '**' : '**'),
    replaceLabel: '[姓名]',
    replaceLabelEn: '[Name]',
    color: '#b37feb',
  },
  {
    key: 'address',
    labelKey: 'ruleAddress',
    pattern: /(?:北京市|上海市|天津市|重庆市|广东省|浙江省|江苏省|山东省|河南省|河北省|湖南省|湖北省|四川省|安徽省|福建省|江西省|陕西省|山西省|辽宁省|吉林省|黑龙江省|甘肃省|青海省|贵州省|云南省|台湾省|内蒙古自治区|广西壮族自治区|西藏自治区|宁夏回族自治区|新疆维吾尔自治区|香港特别行政区|澳门特别行政区)[\u4e00-\u9fa5]{2,}(?:路|街|道|巷|弄|号|楼|室|区|村|镇|乡|城|州|县|市|镇|开发区|新区|园区)[\u4e00-\u9fa5\d]*号?/g,
    partialMask: (m) => {
      const province = m.match(/^(?:北京市|上海市|天津市|重庆市|[\u4e00-\u9fa5]{2,}(?:省|自治区|特别行政区))/)?.[0] || '';
      return province + '***';
    },
    replaceLabel: '[地址]',
    replaceLabelEn: '[Address]',
    color: '#13c2c2',
  },
  {
    key: 'passport',
    labelKey: 'rulePassport',
    pattern: /(?:[EDK][A-Z]|G|S|P|H|C|W)[A-Z0-9]{7,9}/g,
    partialMask: (m) => m.slice(0, 2) + '***' + m.slice(-2),
    replaceLabel: '[护照]',
    replaceLabelEn: '[Passport]',
    color: '#fa8c16',
  },
  {
    key: 'plate',
    labelKey: 'rulePlate',
    pattern: /[\u4e00-\u9fa5][A-Z][A-Z0-9]{5,6}/g,
    partialMask: (m) => m.slice(0, 2) + '***' + m.slice(-2),
    replaceLabel: '[车牌]',
    replaceLabelEn: '[Plate]',
    color: '#eb2f96',
  },
  {
    key: 'wechat',
    labelKey: 'ruleWechat',
    pattern: /(?:微信[：:]\s*|WeChat[：:]\s*|wx[：:_]\s*|微信号[：:]\s*)[a-zA-Z0-9_-]{6,20}/gi,
    partialMask: (m) => {
      const prefix = m.match(/^(?:微信[：:]\s*|WeChat[：:]\s*|wx[：:_]\s*|微信号[：:]\s*)/i)?.[0] || '';
      return prefix + '***';
    },
    replaceLabel: '[微信号]',
    replaceLabelEn: '[WeChat]',
    color: '#52c41a',
  },
];

// ===================== Computed =====================
const activeRules = computed(() => allRules.filter(r => enabledRules.value.includes(r.key)));

const totalFound = computed(() => redactionDetails.value.length);

const statsByType = computed(() => {
  const map = new Map<string, number>();
  redactionDetails.value.forEach(item => {
    map.set(item.type, (map.get(item.type) || 0) + 1);
  });
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
});

// ===================== Functions =====================
function performRedaction() {
  if (!inputText.value.trim()) {
    outputText.value = '';
    redactionDetails.value = [];
    return;
  }

  let text = inputText.value;
  const details: RedactionItem[] = [];

  for (const rule of activeRules.value) {
    // Reset lastIndex for regex with /g flag
    rule.pattern.lastIndex = 0;
    const matches = text.match(rule.pattern);
    if (!matches) continue;

    // Deduplicate matches
    const uniqueMatches = [...new Set(matches)];

    for (const match of uniqueMatches) {
      let redacted: string;
      switch (maskMode.value) {
        case 'partial':
          redacted = rule.partialMask(match);
          break;
        case 'full':
          redacted = maskChar.value.repeat(match.length);
          break;
        case 'replace':
          redacted = lang.value === 'zh' ? rule.replaceLabel : rule.replaceLabelEn;
          break;
        default:
          redacted = rule.partialMask(match);
      }

      details.push({
        type: lang.value === 'zh' ? labels.zh[rule.labelKey] : labels.en[rule.labelKey],
        original: match,
        redacted,
        ruleKey: rule.key,
        color: rule.color,
      });

      // Replace all occurrences
      text = text.split(match).join(redacted);
    }
  }

  outputText.value = text;
  redactionDetails.value = details;

  // Save to history
  if (details.length > 0) {
    saveHistory(inputText.value, outputText.value, details.length);
  }
}

// History
interface HistoryItem {
  id: string;
  input: string;
  output: string;
  count: number;
  time: number;
}

const history = useStorage<HistoryItem[]>('privacy-redactor-history', []);

function saveHistory(input: string, output: string, count: number) {
  history.value.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    input: input.slice(0, 200),
    output: output.slice(0, 200),
    count,
    time: Date.now(),
  });
  if (history.value.length > 20) {
    history.value = history.value.slice(0, 20);
  }
}

function applyHistory(item: HistoryItem) {
  inputText.value = item.input;
  performRedaction();
}

function clearHistory() {
  history.value = [];
}

function copyResult() {
  if (!outputText.value) return;
  navigator.clipboard.writeText(outputText.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

function exportResult() {
  if (!outputText.value) return;
  const blob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `redacted-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function clearAll() {
  inputText.value = '';
  outputText.value = '';
  redactionDetails.value = [];
}

function applyPreset(preset: 'all' | 'none' | 'common' | 'strict') {
  switch (preset) {
    case 'all':
      enabledRules.value = allRules.map(r => r.key);
      break;
    case 'none':
      enabledRules.value = [];
      break;
    case 'common':
      enabledRules.value = ['phone', 'idCard', 'email', 'bankCard'];
      break;
    case 'strict':
      enabledRules.value = allRules.map(r => r.key);
      break;
  }
}

// Auto redact on input change (debounced)
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(inputText, () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(performRedaction, 300);
});

watch([enabledRules, maskMode, maskChar], () => {
  performRedaction();
});

// Detect language
onMounted(() => {
  const navLang = navigator.language;
  lang.value = navLang.startsWith('zh') ? 'zh' : 'en';
});
</script>

<template>
  <div class="privacy-redactor">
    <!-- Header -->
    <div class="pr-header">
      <div class="pr-header-left">
        <n-icon size="28" :color="'var(--n-color-primary, #409eff)'">
          <Shield />
        </n-icon>
        <div>
          <h2 class="pr-title">{{ t('title').value }}</h2>
          <p class="pr-subtitle">{{ t('subtitle').value }}</p>
        </div>
      </div>
      <div class="pr-header-right">
        <n-button size="small" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
          {{ lang === 'zh' ? 'EN' : '中' }}
        </n-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="pr-main">
      <!-- Left: Input & Output -->
      <div class="pr-editor">
        <div class="pr-editor-block">
          <div class="pr-editor-label">
            <span>{{ t('inputLabel').value }}</span>
            <div class="pr-editor-actions">
              <n-button size="tiny" quaternary @click="clearAll">
                <template #icon><n-icon><Trash /></n-icon></template>
                {{ t('clear').value }}
              </n-button>
            </div>
          </div>
          <n-input
            v-model:value="inputText"
            type="textarea"
            :placeholder="t('inputPlaceholder').value"
            :rows="12"
            class="pr-textarea"
          />
        </div>

        <div class="pr-editor-block">
          <div class="pr-editor-label">
            <span>{{ t('outputLabel').value }}</span>
            <div class="pr-editor-actions">
              <n-button size="tiny" quaternary :type="copied ? 'success' : 'default'" @click="copyResult">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ copied ? t('copied').value : t('copy').value }}
              </n-button>
              <n-button size="tiny" quaternary @click="exportResult">
                <template #icon><n-icon><Download /></n-icon></template>
                {{ t('exportResult').value }}
              </n-button>
            </div>
          </div>
          <n-input
            v-model:value="outputText"
            type="textarea"
            :placeholder="t('outputPlaceholder').value"
            :rows="12"
            readonly
            class="pr-textarea pr-output"
          />
        </div>
      </div>

      <!-- Right: Settings & Details -->
      <div class="pr-sidebar">
        <!-- Stats -->
        <div class="pr-card pr-stats-card">
          <div class="pr-card-title">
            <n-icon size="18"><Bolt /></n-icon>
            {{ t('stats').value }}
          </div>
          <div class="pr-stats-grid">
            <div class="pr-stat-item">
              <div class="pr-stat-num">{{ totalFound }}</div>
              <div class="pr-stat-label">{{ t('items').value }}</div>
            </div>
          </div>
          <div v-if="statsByType.length" class="pr-stats-tags">
            <n-tag
              v-for="s in statsByType"
              :key="s.type"
              size="small"
              round
              :bordered="false"
              class="pr-stat-tag"
            >
              {{ s.type }} × {{ s.count }}
            </n-tag>
          </div>
          <n-alert v-else-if="inputText" type="info" :show-icon="false" class="pr-no-alert">
            {{ t('noResult').value }}
          </n-alert>
        </div>

        <!-- Mask Mode -->
        <div class="pr-card">
          <div class="pr-card-title">
            <n-icon size="18"><EyeOff /></n-icon>
            {{ t('maskMode').value }}
          </div>
          <div class="pr-mask-modes">
            <button
              v-for="mode in (['partial', 'full', 'replace'] as MaskMode[])"
              :key="mode"
              :class="['pr-mask-btn', { active: maskMode === mode }]"
              @click="maskMode = mode"
            >
              <n-icon size="16">
                <EyeOff v-if="mode === 'partial'" />
                <Eye v-if="mode === 'full'" />
                <Shield v-if="mode === 'replace'" />
              </n-icon>
              {{ t(('mask' + mode.charAt(0).toUpperCase() + mode.slice(1)) as any).value }}
            </button>
          </div>
          <div v-if="maskMode !== 'replace'" class="pr-mask-char">
            <span class="pr-mask-char-label">{{ t('customMask').value }}</span>
            <div class="pr-mask-char-options">
              <button
                v-for="ch in ['*', '●', '█', '×', '#']"
                :key="ch"
                :class="['pr-char-btn', { active: maskChar === ch }]"
                @click="maskChar = ch"
              >{{ ch }}</button>
            </div>
          </div>
        </div>

        <!-- Rules -->
        <div class="pr-card">
          <div class="pr-card-title">
            <n-icon size="18"><Settings /></n-icon>
            {{ t('rules').value }}
          </div>
          <div class="pr-presets">
            <n-button size="tiny" quaternary @click="applyPreset('common')">{{ t('presetCommon').value }}</n-button>
            <n-button size="tiny" quaternary @click="applyPreset('strict')">{{ t('presetStrict').value }}</n-button>
            <n-button size="tiny" quaternary @click="applyPreset('all')">{{ t('presetAll').value }}</n-button>
            <n-button size="tiny" quaternary @click="applyPreset('none')">{{ t('presetNone').value }}</n-button>
          </div>
          <div class="pr-rules-list">
            <label
              v-for="rule in allRules"
              :key="rule.key"
              class="pr-rule-item"
            >
              <n-checkbox
                :checked="enabledRules.includes(rule.key)"
                @update:checked="(v: boolean) => {
                  if (v) enabledRules = [...enabledRules, rule.key];
                  else enabledRules = enabledRules.filter(k => k !== rule.key);
                }"
              />
              <span class="pr-rule-dot" :style="{ background: rule.color }"></span>
              <span class="pr-rule-name">{{ t(rule.labelKey).value }}</span>
            </label>
          </div>
        </div>

        <!-- Details -->
        <div v-if="redactionDetails.length" class="pr-card pr-details-card">
          <div class="pr-card-title">
            <n-icon size="18"><EyeOff /></n-icon>
            {{ t('detailTitle').value }}
          </div>
          <div class="pr-details-list">
            <div
              v-for="(item, idx) in redactionDetails"
              :key="idx"
              class="pr-detail-row"
            >
              <n-tag size="small" :color="{ color: item.color + '22', textColor: item.color, borderColor: item.color + '44' }" round>
                {{ item.type }}
              </n-tag>
              <code class="pr-detail-orig">{{ item.original.length > 24 ? item.original.slice(0, 24) + '…' : item.original }}</code>
              <span class="pr-detail-arrow">→</span>
              <code class="pr-detail-redact">{{ item.redacted }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.privacy-redactor {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.pr-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.pr-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pr-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--n-text-color);
}
.pr-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--n-text-color-3);
}

/* Main Layout */
.pr-main {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
}

/* Editor */
.pr-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pr-editor-block {
  background: var(--n-card-color, #1a1a2e);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--n-border-color, rgba(255,255,255,0.06));
}
.pr-editor-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--n-text-color);
}
.pr-editor-actions {
  display: flex;
  gap: 6px;
}
.pr-textarea {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13.5px;
  line-height: 1.7;
}
.pr-output :deep(textarea) {
  color: var(--n-text-color-2) !important;
}

/* Sidebar */
.pr-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
.pr-sidebar::-webkit-scrollbar {
  width: 4px;
}
.pr-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}

/* Card */
.pr-card {
  background: var(--n-card-color, #1a1a2e);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--n-border-color, rgba(255,255,255,0.06));
}
.pr-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--n-text-color);
  margin-bottom: 12px;
}

/* Stats */
.pr-stats-card {
  background: linear-gradient(135deg, rgba(64,158,255,0.08), rgba(103,194,58,0.06));
}
.pr-stats-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}
.pr-stat-item {
  text-align: center;
}
.pr-stat-num {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.pr-stat-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}
.pr-stats-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pr-stat-tag {
  background: rgba(64,158,255,0.1);
  color: #409eff;
  font-size: 12px;
}
.pr-no-alert {
  margin-top: 4px;
  font-size: 12px;
}

/* Mask Mode */
.pr-mask-modes {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.pr-mask-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color, rgba(255,255,255,0.08));
  background: transparent;
  color: var(--n-text-color-3);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.pr-mask-btn:hover {
  border-color: rgba(64,158,255,0.3);
  color: var(--n-text-color-2);
}
.pr-mask-btn.active {
  border-color: #409eff;
  background: rgba(64,158,255,0.1);
  color: #409eff;
}
.pr-mask-char {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pr-mask-char-label {
  font-size: 12px;
  color: var(--n-text-color-3);
  white-space: nowrap;
}
.pr-mask-char-options {
  display: flex;
  gap: 6px;
}
.pr-char-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color, rgba(255,255,255,0.08));
  background: transparent;
  color: var(--n-text-color-2);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pr-char-btn:hover {
  border-color: rgba(64,158,255,0.3);
}
.pr-char-btn.active {
  border-color: #409eff;
  background: rgba(64,158,255,0.15);
  color: #409eff;
}

/* Presets */
.pr-presets {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

/* Rules */
.pr-rules-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pr-rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
  user-select: none;
}
.pr-rule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pr-rule-name {
  font-size: 13px;
  color: var(--n-text-color-2);
}

/* Details */
.pr-details-card {
  max-height: 300px;
  overflow-y: auto;
}
.pr-details-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pr-detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 8px;
  background: rgba(255,255,255,0.02);
  border-radius: 6px;
}
.pr-detail-orig {
  color: var(--n-text-color-3);
  font-size: 11.5px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pr-detail-arrow {
  color: var(--n-text-color-3);
  font-size: 11px;
}
.pr-detail-redact {
  color: #67c23a;
  font-size: 11.5px;
}

/* Responsive */
@media (max-width: 860px) {
  .pr-main {
    grid-template-columns: 1fr;
  }
  .pr-sidebar {
    max-height: none;
  }
}
</style>
