<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { NButton, NInputNumber, NSelect, NGrid, NGi, NSwitch, NIcon, NTooltip, NSpin } from 'naive-ui';
import { Copy, Refresh, ArrowsLeftRight, TrendingUp, Star, StarOff, ChevronDown } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '汇率转换器',
    subtitle: '实时汇率查询与转换，支持150+货币',
    amount: '金额',
    from: '从',
    to: '到',
    result: '转换结果',
    swap: '交换',
    rate: '汇率',
    updateTime: '更新时间',
    popularPairs: '热门汇率对',
    favorites: '收藏货币',
    addFavorite: '添加收藏',
    removeFavorite: '移除收藏',
    rateChart: '汇率趋势（近30天）',
    searchCurrency: '搜索货币...',
    copied: '已复制！',
    refresh: '刷新汇率',
    refreshing: '刷新中...',
    lastUpdated: '上次更新',
    offline: '离线模式',
    offlineNotice: '使用缓存汇率，可能不是最新',
    source: '数据来源',
    sourceName: 'Frankfurter API (欧洲央行)',
    autoRefresh: '自动刷新',
    inputAmount: '输入金额',
    equal: '等于',
    copiedResult: '已复制转换结果',
    noData: '暂无数据',
    dayAgo: '天前',
    weekAgo: '周前',
    monthAgo: '月前',
    allCurrencies: '全部货币',
    majorCurrencies: '主要货币',
    about: '关于',
    aboutContent: '汇率数据来自欧洲央行，每日更新一次。本工具支持离线缓存，无网络时使用最近一次获取的汇率数据。',
    disclaimer: '声明',
    disclaimerContent: '汇率仅供参考，实际交易汇率可能有所不同。请以银行或交易平台的实时报价为准。',
    trendUp: '上涨',
    trendDown: '下跌',
    trendFlat: '持平',
    change: '变动',
    high: '高',
    low: '低',
    period: '周期',
    days7: '7天',
    days30: '30天',
    days90: '90天',
  },
  en: {
    title: 'Currency Converter',
    subtitle: 'Real-time exchange rate conversion, 150+ currencies supported',
    amount: 'Amount',
    from: 'From',
    to: 'To',
    result: 'Conversion Result',
    swap: 'Swap',
    rate: 'Rate',
    updateTime: 'Update Time',
    popularPairs: 'Popular Pairs',
    favorites: 'Favorites',
    addFavorite: 'Add Favorite',
    removeFavorite: 'Remove Favorite',
    rateChart: 'Rate Trend (Last 30 Days)',
    searchCurrency: 'Search currency...',
    copied: 'Copied!',
    refresh: 'Refresh Rates',
    refreshing: 'Refreshing...',
    lastUpdated: 'Last Updated',
    offline: 'Offline Mode',
    offlineNotice: 'Using cached rates, may not be up-to-date',
    source: 'Data Source',
    sourceName: 'Frankfurter API (ECB)',
    autoRefresh: 'Auto Refresh',
    inputAmount: 'Enter amount',
    equal: 'equals',
    copiedResult: 'Conversion result copied',
    noData: 'No data',
    dayAgo: 'day(s) ago',
    weekAgo: 'week(s) ago',
    monthAgo: 'month(s) ago',
    allCurrencies: 'All Currencies',
    majorCurrencies: 'Major Currencies',
    about: 'About',
    aboutContent: 'Exchange rates are sourced from the European Central Bank and updated daily. This tool supports offline caching - when offline, the most recently fetched rates are used.',
    disclaimer: 'Disclaimer',
    disclaimerContent: 'Rates are for reference only. Actual trading rates may differ. Please refer to real-time quotes from banks or trading platforms.',
    trendUp: 'Up',
    trendDown: 'Down',
    trendFlat: 'Flat',
    change: 'Change',
    high: 'High',
    low: 'Low',
    period: 'Period',
    days7: '7 Days',
    days30: '30 Days',
    days90: '90 Days',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Currency data with Chinese names
const currencyInfo: Record<string, { code: string; nameZh: string; nameEn: string; symbol: string; flag: string }> = {
  USD: { code: 'USD', nameZh: '美元', nameEn: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { code: 'EUR', nameZh: '欧元', nameEn: 'Euro', symbol: '€', flag: '🇪🇺' },
  CNY: { code: 'CNY', nameZh: '人民币', nameEn: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  GBP: { code: 'GBP', nameZh: '英镑', nameEn: 'British Pound', symbol: '£', flag: '🇬🇧' },
  JPY: { code: 'JPY', nameZh: '日元', nameEn: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  KRW: { code: 'KRW', nameZh: '韩元', nameEn: 'Korean Won', symbol: '₩', flag: '🇰🇷' },
  HKD: { code: 'HKD', nameZh: '港币', nameEn: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  TWD: { code: 'TWD', nameZh: '新台币', nameEn: 'New Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼' },
  AUD: { code: 'AUD', nameZh: '澳元', nameEn: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  CAD: { code: 'CAD', nameZh: '加元', nameEn: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  CHF: { code: 'CHF', nameZh: '瑞士法郎', nameEn: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  SGD: { code: 'SGD', nameZh: '新加坡元', nameEn: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  NZD: { code: 'NZD', nameZh: '新西兰元', nameEn: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  SEK: { code: 'SEK', nameZh: '瑞典克朗', nameEn: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  NOK: { code: 'NOK', nameZh: '挪威克朗', nameEn: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  DKK: { code: 'DKK', nameZh: '丹麦克朗', nameEn: 'Danish Krone', symbol: 'kr', flag: '🇩🇰' },
  INR: { code: 'INR', nameZh: '印度卢比', nameEn: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  THB: { code: 'THB', nameZh: '泰铢', nameEn: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  MYR: { code: 'MYR', nameZh: '马来西亚林吉特', nameEn: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  PHP: { code: 'PHP', nameZh: '菲律宾比索', nameEn: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
  RUB: { code: 'RUB', nameZh: '俄罗斯卢布', nameEn: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  BRL: { code: 'BRL', nameZh: '巴西雷亚尔', nameEn: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  MXN: { code: 'MXN', nameZh: '墨西哥比索', nameEn: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽' },
  ZAR: { code: 'ZAR', nameZh: '南非兰特', nameEn: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  TRY: { code: 'TRY', nameZh: '土耳其里拉', nameEn: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  PLN: { code: 'PLN', nameZh: '波兰兹罗提', nameEn: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
  CZK: { code: 'CZK', nameZh: '捷克克朗', nameEn: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿' },
  HUF: { code: 'HUF', nameZh: '匈牙利福林', nameEn: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺' },
  ILS: { code: 'ILS', nameZh: '以色列新谢克尔', nameEn: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱' },
  IDR: { code: 'IDR', nameZh: '印尼盾', nameEn: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  VND: { code: 'VND', nameZh: '越南盾', nameEn: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  AED: { code: 'AED', nameZh: '阿联酋迪拉姆', nameEn: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  SAR: { code: 'SAR', nameZh: '沙特里亚尔', nameEn: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
};

// Major currencies for quick select
const majorCurrencies = ['USD', 'EUR', 'CNY', 'GBP', 'JPY', 'KRW', 'HKD', 'AUD', 'CAD', 'CHF', 'SGD', 'THB'];

// State
const amount = ref<number | null>(100);
const fromCurrency = ref('CNY');
const toCurrency = ref('USD');
const rates = ref<Record<string, number>>({});
const isLoading = ref(false);
const isOffline = ref(false);
const lastUpdateDate = ref('');
const justCopied = ref(false);
const favorites = ref<string[]>(['CNY', 'USD', 'EUR', 'JPY', 'GBP']);
const showAllCurrencies = ref(false);
const trendPeriod = ref<7 | 30 | 90>(30);
const trendData = ref<{ date: string; rate: number }[]>([]);
const isLoadingTrend = ref(false);

// Build currency options for select
const currencyOptions = computed(() => {
  const allCodes = Object.keys(currencyInfo).sort();
  return allCodes.map((code) => {
    const info = currencyInfo[code];
    return {
      label: `${info.flag} ${code} - ${lang.value === 'zh' ? info.nameZh : info.nameEn}`,
      value: code,
    };
  });
});

// Get currency display name
function getCurrencyName(code: string) {
  const info = currencyInfo[code];
  if (!info) return code;
  return `${info.flag} ${code}`;
}

// Fetch rates from Frankfurter API (free, no key needed)
async function fetchRates() {
  isLoading.value = true;
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    rates.value = data.rates;
    rates.value['EUR'] = 1;
    lastUpdateDate.value = data.date;
    isOffline.value = false;
    // Cache to localStorage
    localStorage.setItem('currencyRates', JSON.stringify({ rates: rates.value, date: data.date }));
  } catch {
    // Try loading from cache
    const cached = localStorage.getItem('currencyRates');
    if (cached) {
      const parsed = JSON.parse(cached);
      rates.value = parsed.rates;
      lastUpdateDate.value = parsed.date;
      isOffline.value = true;
    } else {
      rates.value = {};
      isOffline.value = true;
    }
  } finally {
    isLoading.value = false;
  }
}

// Fetch historical trend data
async function fetchTrendData() {
  if (!fromCurrency.value || !toCurrency.value) return;
  isLoadingTrend.value = true;
  try {
    const days = trendPeriod.value;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const from = fromCurrency.value === 'EUR' ? 'EUR' : fromCurrency.value;
    const url = `https://api.frankfurter.app/${startStr}..${endStr}?from=${from}&to=${toCurrency.value === 'EUR' ? 'USD' : toCurrency.value}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed');
    const data = await response.json();

    trendData.value = Object.entries(data.rates)
      .map(([date, rates]: [string, any]) => ({
        date,
        rate: fromCurrency.value === 'EUR' ? rates[toCurrency.value] || rates[Object.keys(rates)[0]] : rates[toCurrency.value] || rates[Object.keys(rates)[0]],
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    trendData.value = [];
  } finally {
    isLoadingTrend.value = false;
  }
}

// Calculate exchange rate
const exchangeRate = computed(() => {
  if (!rates.value[fromCurrency.value] || !rates.value[toCurrency.value]) return null;
  // Convert via EUR as base
  const fromToEur = 1 / rates.value[fromCurrency.value];
  const eurToTo = rates.value[toCurrency.value];
  return fromToEur * eurToTo;
});

const convertedAmount = computed(() => {
  if (!exchangeRate.value || !amount.value) return null;
  return amount.value * exchangeRate.value;
});

// Trend stats
const trendStats = computed(() => {
  if (trendData.value.length < 2) return null;
  const latest = trendData.value[trendData.value.length - 1].rate;
  const earliest = trendData.value[0].rate;
  const change = latest - earliest;
  const changePercent = ((change / earliest) * 100).toFixed(2);
  const high = Math.max(...trendData.value.map(d => d.rate));
  const low = Math.min(...trendData.value.map(d => d.rate));
  return {
    latest,
    change,
    changePercent: parseFloat(changePercent),
    high,
    low,
    trend: change > 0.0001 ? 'up' as const : change < -0.0001 ? 'down' as const : 'flat' as const,
  };
});

// Popular pairs
const popularPairs = computed(() => {
  const pairs = [
    { from: 'USD', to: 'CNY' },
    { from: 'EUR', to: 'CNY' },
    { from: 'GBP', to: 'USD' },
    { from: 'USD', to: 'JPY' },
    { from: 'EUR', to: 'USD' },
    { from: 'USD', to: 'KRW' },
    { from: 'CNY', to: 'JPY' },
    { from: 'USD', to: 'HKD' },
  ];
  return pairs
    .map((pair) => {
      if (!rates.value[pair.from] || !rates.value[pair.to]) return null;
      const fromToEur = 1 / rates.value[pair.from];
      const eurToTo = rates.value[pair.to];
      const rate = fromToEur * eurToTo;
      return { ...pair, rate };
    })
    .filter(Boolean) as { from: string; to: string; rate: number }[];
});

// Swap currencies
function swapCurrencies() {
  const temp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = temp;
}

// Copy result
function copyResult() {
  if (!convertedAmount.value || !exchangeRate.value) return;
  const text = `${amount.value} ${fromCurrency.value} = ${convertedAmount.value.toFixed(2)} ${toCurrency.value} (1 ${fromCurrency.value} = ${exchangeRate.value.toFixed(4)} ${toCurrency.value})`;
  navigator.clipboard.writeText(text);
  justCopied.value = true;
  setTimeout(() => {
    justCopied.value = false;
  }, 1500);
}

// Toggle favorite
function toggleFavorite(code: string) {
  if (favorites.value.includes(code)) {
    favorites.value = favorites.value.filter(c => c !== code);
  } else {
    favorites.value.push(code);
  }
  localStorage.setItem('currencyFavorites', JSON.stringify(favorites.value));
}

// Format number
function formatRate(rate: number) {
  if (rate >= 1000) return rate.toFixed(0);
  if (rate >= 100) return rate.toFixed(1);
  if (rate >= 10) return rate.toFixed(2);
  if (rate >= 1) return rate.toFixed(4);
  return rate.toFixed(6);
}

// Mini sparkline SVG
const sparklinePath = computed(() => {
  if (trendData.value.length < 2) return '';
  const data = trendData.value.map(d => d.rate);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 300;
  const h = 60;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return `M${points.join(' L')}`;
});

// Watch for currency changes to fetch trend
watch([fromCurrency, toCurrency, trendPeriod], () => {
  fetchTrendData();
});

// Load favorites from localStorage
onMounted(() => {
  const savedFavorites = localStorage.getItem('currencyFavorites');
  if (savedFavorites) {
    favorites.value = JSON.parse(savedFavorites);
  }
  fetchRates();
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
        <!-- Left: Input -->
        <n-gi span="24 m:12">
          <c-card mb-4>
            <div text-lg font-bold mb-4>💱 {{ t('title').value }}</div>

            <!-- Amount Input -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('amount').value }}</div>
              <n-input-number
                v-model:value="amount"
                :min="0"
                :step="1"
                size="large"
                :placeholder="t('inputAmount').value"
                style="width: 100%"
              />
            </div>

            <!-- From Currency -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('from').value }}</div>
              <n-select
                v-model:value="fromCurrency"
                :options="currencyOptions"
                filterable
                size="large"
                :placeholder="t('searchCurrency').value"
              />
              <!-- Favorite quick select -->
              <div flex flex-wrap gap-2 mt-2>
                <n-button
                  v-for="code in favorites.filter(c => c !== fromCurrency)"
                  :key="code"
                  size="tiny"
                  round
                  quaternary
                  @click="fromCurrency = code"
                >
                  {{ getCurrencyName(code) }}
                </n-button>
              </div>
            </div>

            <!-- Swap Button -->
            <div flex justify-center mb-4>
              <n-button round size="small" @click="swapCurrencies" type="primary" quaternary>
                <template #icon><n-icon :component="ArrowsLeftRight" /></template>
                {{ t('swap').value }}
              </n-button>
            </div>

            <!-- To Currency -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('to').value }}</div>
              <n-select
                v-model:value="toCurrency"
                :options="currencyOptions"
                filterable
                size="large"
                :placeholder="t('searchCurrency').value"
              />
              <div flex flex-wrap gap-2 mt-2>
                <n-button
                  v-for="code in favorites.filter(c => c !== toCurrency)"
                  :key="code"
                  size="tiny"
                  round
                  quaternary
                  @click="toCurrency = code"
                >
                  {{ getCurrencyName(code) }}
                </n-button>
              </div>
            </div>

            <!-- Refresh Button -->
            <div flex justify-between items-center>
              <n-button
                size="small"
                round
                quaternary
                :loading="isLoading"
                @click="fetchRates"
              >
                <template #icon><n-icon><Refresh /></n-icon></template>
                {{ isLoading ? t('refreshing').value : t('refresh').value }}
              </n-button>
              <n-button
                size="small"
                round
                quaternary
                @click="toggleFavorite(fromCurrency)"
              >
                <template #icon>
                  <n-icon><component :is="favorites.includes(fromCurrency) ? Star : StarOff" /></n-icon>
                </template>
                {{ favorites.includes(fromCurrency) ? t('removeFavorite').value : t('addFavorite').value }}
              </n-button>
            </div>
          </c-card>

          <!-- Popular Pairs -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>🔥 {{ t('popularPairs').value }}</div>
            <div flex flex-col gap-2>
              <div
                v-for="pair in popularPairs"
                :key="pair.from + pair.to"
                flex justify-between items-center
                p-3 rounded-lg cursor-pointer
                style="background: rgba(255,255,255,0.03); transition: background 0.2s"
                @mouseenter="($event.target as HTMLElement).style.background = 'rgba(255,255,255,0.07)'"
                @mouseleave="($event.target as HTMLElement).style.background = 'rgba(255,255,255,0.03)'"
                @click="fromCurrency = pair.from; toCurrency = pair.to"
              >
                <div>
                  <span text-sm font-bold>{{ getCurrencyName(pair.from) }}</span>
                  <span text-xs op-50 mx-1>→</span>
                  <span text-sm font-bold>{{ getCurrencyName(pair.to) }}</span>
                </div>
                <div text-sm font-mono op-80>{{ formatRate(pair.rate) }}</div>
              </div>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Results -->
        <n-gi span="24 m:12">
          <!-- Loading State -->
          <c-card v-if="isLoading && Object.keys(rates).length === 0" mb-4>
            <div flex justify-center items-center py-12>
              <n-spin size="large" />
            </div>
          </c-card>

          <!-- Result Card -->
          <c-card v-else-if="convertedAmount !== null && exchangeRate" mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('result').value }}</div>

            <!-- Big Result Display -->
            <div text-center mb-6>
              <div text-sm op-60 mb-2>
                {{ amount }} <span font-bold>{{ getCurrencyName(fromCurrency) }}</span>
                {{ t('equal').value }}
              </div>
              <div text-4xl font-bold style="background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                {{ formatRate(convertedAmount) }}
              </div>
              <div mt-2 text-lg font-bold>{{ getCurrencyName(toCurrency) }}</div>
            </div>

            <!-- Rate Info -->
            <div p-4 rounded-xl mb-4 style="background: rgba(255,255,255,0.05);">
              <div flex justify-between items-center mb-2>
                <span text-sm op-70>{{ t('rate').value }}</span>
                <span text-sm font-mono>1 {{ fromCurrency }} = {{ formatRate(exchangeRate) }} {{ toCurrency }}</span>
              </div>
              <div flex justify-between items-center mb-2>
                <span text-sm op-70>{{ t('rate').value }} (逆)</span>
                <span text-sm font-mono>1 {{ toCurrency }} = {{ formatRate(1 / exchangeRate) }} {{ fromCurrency }}</span>
              </div>
              <div v-if="lastUpdateDate" flex justify-between items-center>
                <span text-sm op-70>{{ t('updateTime').value }}</span>
                <span text-sm font-mono>{{ lastUpdateDate }}</span>
              </div>
            </div>

            <!-- Offline Notice -->
            <div v-if="isOffline" p-3 rounded-lg mb-4 style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
              <div text-sm text-amber-400>⚠️ {{ t('offline').value }}</div>
              <div text-xs op-70>{{ t('offlineNotice').value }}</div>
            </div>

            <!-- Copy Button -->
            <div flex justify-center>
              <n-button size="small" round quaternary @click="copyResult">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ justCopied ? t('copied').value : t('copiedResult').value }}
              </n-button>
            </div>
          </c-card>

          <!-- Empty State -->
          <c-card v-else mb-4>
            <div text-center py-8>
              <div text-4xl mb-3>💱</div>
              <div text-sm op-50>{{ lang === 'zh' ? '选择货币并输入金额开始转换' : 'Select currencies and enter amount to convert' }}</div>
            </div>
          </c-card>

          <!-- Trend Chart -->
          <c-card mb-4>
            <div flex justify-between items-center mb-3>
              <div text-lg font-bold>📈 {{ t('rateChart').value }}</div>
              <n-button-group size="tiny">
                <n-button
                  :type="trendPeriod === 7 ? 'primary' : 'default'"
                  @click="trendPeriod = 7"
                  round
                >
                  {{ t('days7').value }}
                </n-button>
                <n-button
                  :type="trendPeriod === 30 ? 'primary' : 'default'"
                  @click="trendPeriod = 30"
                  round
                >
                  {{ t('days30').value }}
                </n-button>
                <n-button
                  :type="trendPeriod === 90 ? 'primary' : 'default'"
                  @click="trendPeriod = 90"
                  round
                >
                  {{ t('days90').value }}
                </n-button>
              </n-button-group>
            </div>

            <!-- Sparkline -->
            <div v-if="trendData.length >= 2" mb-4>
              <svg :viewBox="`0 0 300 60`" style="width: 100%; height: 60px; overflow: visible;">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="trendStats?.trend === 'up' ? '#22c55e' : trendStats?.trend === 'down' ? '#ef4444' : '#60a5fa'" stop-opacity="0.3" />
                    <stop offset="100%" :stop-color="trendStats?.trend === 'up' ? '#22c55e' : trendStats?.trend === 'down' ? '#ef4444' : '#60a5fa'" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <!-- Fill area -->
                <path
                  :d="sparklinePath + ` L300,60 L0,60 Z`"
                  fill="url(#sparkGrad)"
                />
                <!-- Line -->
                <path
                  :d="sparklinePath"
                  fill="none"
                  :stroke="trendStats?.trend === 'up' ? '#22c55e' : trendStats?.trend === 'down' ? '#ef4444' : '#60a5fa'"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>

            <!-- Trend Stats -->
            <div v-if="trendStats" p-3 rounded-lg style="background: rgba(255,255,255,0.03);">
              <div flex justify-between mb-2>
                <span text-sm op-70>{{ t('change').value }}</span>
                <span
                  text-sm font-bold
                  :style="{ color: trendStats.trend === 'up' ? '#22c55e' : trendStats.trend === 'down' ? '#ef4444' : '#60a5fa' }"
                >
                  {{ trendStats.trend === 'up' ? '🔺' : trendStats.trend === 'down' ? '🔻' : '➡️' }}
                  {{ trendStats.changePercent > 0 ? '+' : '' }}{{ trendStats.changePercent }}%
                </span>
              </div>
              <div flex justify-between mb-2>
                <span text-sm op-70>{{ t('high').value }}</span>
                <span text-sm font-mono>{{ formatRate(trendStats.high) }}</span>
              </div>
              <div flex justify-between>
                <span text-sm op-70>{{ t('low').value }}</span>
                <span text-sm font-mono>{{ formatRate(trendStats.low) }}</span>
              </div>
            </div>

            <div v-else-if="isLoadingTrend" flex justify-center py-4>
              <n-spin size="small" />
            </div>
            <div v-else text-center py-4 text-sm op-50>
              {{ t('noData').value }}
            </div>
          </c-card>

          <!-- Info Card -->
          <c-card mb-4>
            <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <div text-sm op-70 mb-2>{{ t('about').value }}</div>
                  <div text-xs leading-relaxed op-60>{{ t('aboutContent').value }}</div>
                </div>
              </n-gi>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <div text-sm op-70 mb-2>{{ t('source').value }}</div>
                  <div text-xs leading-relaxed op-60>{{ t('sourceName').value }}</div>
                </div>
              </n-gi>
            </n-grid>
          </c-card>

          <!-- Disclaimer -->
          <c-card>
            <div p-3 rounded-lg style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
              <div text-sm text-amber-400 mb-1>⚠️ {{ t('disclaimer').value }}</div>
              <div text-xs op-70>{{ t('disclaimerContent').value }}</div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
</style>
