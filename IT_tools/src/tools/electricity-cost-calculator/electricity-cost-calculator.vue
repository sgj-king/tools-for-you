<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import {
  NButton,
  NInputNumber,
  NSlider,
  NSwitch,
  NGrid,
  NGi,
  NSelect,
  NIcon,
  NTooltip,
  NTabs,
  NTabPane,
  NTag,
} from 'naive-ui';
import { Copy, Refresh, Bolt, Home } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '电费计算器',
    subtitle: '计算家电用电费用、宿舍电费分摊、月度电费预估',
    applianceMode: '家电计算',
    billMode: '电费分摊',
    // Appliance mode
    appliance: '电器',
    power: '功率',
    dailyHours: '日均使用时长',
    quantity: '数量',
    days: '天数',
    electricityPrice: '电价',
    tieredPrice: '阶梯电价',
    unitPrice: '统一电价',
    // Bill mode
    totalReading: '总用电量',
    totalBill: '总电费',
    roommates: '室友人数',
    myUsage: '我的用电量',
    myBill: '我的电费',
    sharedCost: '公共电费',
    // Results
    dailyCost: '日费用',
    monthlyCost: '月费用',
    yearlyCost: '年费用',
    dailyKwh: '日用电',
    monthlyKwh: '月用电',
    yearlyKwh: '年用电',
    totalCost: '总费用',
    totalKwh: '总用电量',
    perPerson: '人均费用',
    myShare: '我的分摊',
    // Units
    watt: '瓦(W)',
    kilowatt: '千瓦(kW)',
    hour: '小时',
    kwh: '度(kWh)',
    yuan: '元',
    yuanPerKwh: '元/度',
    day: '天',
    month: '月',
    year: '年',
    // Actions
    addAppliance: '添加电器',
    removeAppliance: '删除',
    reset: '重置',
    copy: '复制结果',
    copied: '已复制！',
    // Tiers
    tier1: '第一档',
    tier2: '第二档',
    tier3: '第三档',
    tierLimit: '上限',
    tierPrice: '电价',
    tierHint: '月用电量不超过{limit}度，按{price}元/度计费',
    // Appliance presets
    presetLabel: '常见电器',
    airConditioner: '空调',
    refrigerator: '冰箱',
    washingMachine: '洗衣机',
    tv: '电视',
    computer: '电脑',
    lightBulb: '灯泡',
    electricFan: '电风扇',
    waterHeater: '热水器',
    riceCooker: '电饭煲',
    microwave: '微波炉',
    phone: '手机充电',
    router: '路由器',
    // Tips
    tips: '省电小贴士',
    tip1: '空调设置26°C，每升高1°C可省电6-8%',
    tip2: '及时拔掉不用的电器插头，避免待机耗电',
    tip3: 'LED灯泡比白炽灯省电约80%',
    tip4: '冰箱温度设置2-5°C，避免频繁开关门',
    tip5: '利用自然光照明，减少白天开灯时间',
    // History
    history: '历史记录',
    noHistory: '暂无计算记录',
    saveRecord: '保存记录',
    saved: '已保存！',
    deleteRecord: '删除',
    clearHistory: '清空历史',
    // Summary
    summary: '用电概况',
    topConsumer: '最大耗电',
    lowConsumer: '最小耗电',
    noAppliance: '添加电器开始计算',
    emptyState: '🚀',
  },
  en: {
    title: 'Electricity Cost Calculator',
    subtitle: 'Calculate appliance electricity costs, dorm bill splitting, monthly estimates',
    applianceMode: 'Appliance Calculator',
    billMode: 'Bill Splitter',
    // Appliance mode
    appliance: 'Appliance',
    power: 'Power',
    dailyHours: 'Daily Usage',
    quantity: 'Quantity',
    days: 'Days',
    electricityPrice: 'Price',
    tieredPrice: 'Tiered Rate',
    unitPrice: 'Flat Rate',
    // Bill mode
    totalReading: 'Total Usage',
    totalBill: 'Total Bill',
    roommates: 'Roommates',
    myUsage: 'My Usage',
    myBill: 'My Bill',
    sharedCost: 'Shared Cost',
    // Results
    dailyCost: 'Daily Cost',
    monthlyCost: 'Monthly Cost',
    yearlyCost: 'Yearly Cost',
    dailyKwh: 'Daily Usage',
    monthlyKwh: 'Monthly Usage',
    yearlyKwh: 'Yearly Usage',
    totalCost: 'Total Cost',
    totalKwh: 'Total Usage',
    perPerson: 'Per Person',
    myShare: 'My Share',
    // Units
    watt: 'Watt(W)',
    kilowatt: 'Kilowatt(kW)',
    hour: 'hour',
    kwh: 'kWh',
    yuan: 'CNY',
    yuanPerKwh: 'CNY/kWh',
    day: 'day',
    month: 'month',
    year: 'year',
    // Actions
    addAppliance: 'Add Appliance',
    removeAppliance: 'Remove',
    reset: 'Reset',
    copy: 'Copy Result',
    copied: 'Copied!',
    // Tiers
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
    tierLimit: 'Limit',
    tierPrice: 'Price',
    tierHint: 'Up to {limit} kWh/month at {price} CNY/kWh',
    // Appliance presets
    presetLabel: 'Common Appliances',
    airConditioner: 'Air Conditioner',
    refrigerator: 'Refrigerator',
    washingMachine: 'Washing Machine',
    tv: 'TV',
    computer: 'Computer',
    lightBulb: 'Light Bulb',
    electricFan: 'Electric Fan',
    waterHeater: 'Water Heater',
    riceCooker: 'Rice Cooker',
    microwave: 'Microwave',
    phone: 'Phone Charger',
    router: 'Router',
    // Tips
    tips: 'Energy Saving Tips',
    tip1: 'Set AC to 26°C, each 1°C higher saves 6-8% energy',
    tip2: 'Unplug appliances when not in use to avoid standby power',
    tip3: 'LED bulbs use ~80% less energy than incandescent',
    tip4: 'Set fridge to 2-5°C, avoid frequent door opening',
    tip5: 'Use natural light, reduce daytime artificial lighting',
    // History
    history: 'History',
    noHistory: 'No records yet',
    saveRecord: 'Save',
    saved: 'Saved!',
    deleteRecord: 'Delete',
    clearHistory: 'Clear History',
    // Summary
    summary: 'Usage Overview',
    topConsumer: 'Highest Usage',
    lowConsumer: 'Lowest Usage',
    noAppliance: 'Add appliances to calculate',
    emptyState: '🚀',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Appliance Mode State =====================
interface ApplianceItem {
  id: number;
  name: string;
  powerW: number;
  dailyHours: number;
  quantity: number;
}

let nextId = 1;
const appliances = ref<ApplianceItem[]>([
  { id: nextId++, name: '', powerW: 0, dailyHours: 0, quantity: 1 },
]);

// Pricing mode
const priceMode = ref<'flat' | 'tiered'>('flat');
const flatPrice = ref(0.56); // CNY/kWh default

// Tiered pricing (Chinese residential standard)
const tiers = ref([
  { limit: 200, price: 0.56 },
  { limit: 400, price: 0.61 },
  { limit: Infinity, price: 0.86 },
]);

const calculationDays = ref(30);

// Appliance presets
const appliancePresets = computed(() => [
  { name: t('airConditioner').value, powerW: 1500, dailyHours: 6 },
  { name: t('refrigerator').value, powerW: 150, dailyHours: 24 },
  { name: t('washingMachine').value, powerW: 500, dailyHours: 1 },
  { name: t('tv').value, powerW: 120, dailyHours: 4 },
  { name: t('computer').value, powerW: 300, dailyHours: 8 },
  { name: t('lightBulb').value, powerW: 15, dailyHours: 6 },
  { name: t('electricFan').value, powerW: 60, dailyHours: 8 },
  { name: t('waterHeater').value, powerW: 2000, dailyHours: 1 },
  { name: t('riceCooker').value, powerW: 800, dailyHours: 1 },
  { name: t('microwave').value, powerW: 1000, dailyHours: 0.5 },
  { name: t('phone').value, powerW: 10, dailyHours: 3 },
  { name: t('router').value, powerW: 12, dailyHours: 24 },
]);

function addPresetAppliance(preset: { name: string; powerW: number; dailyHours: number }) {
  appliances.value.push({
    id: nextId++,
    name: preset.name,
    powerW: preset.powerW,
    dailyHours: preset.dailyHours,
    quantity: 1,
  });
}

function addEmptyAppliance() {
  appliances.value.push({
    id: nextId++,
    name: '',
    powerW: 0,
    dailyHours: 0,
    quantity: 1,
  });
}

function removeAppliance(id: number) {
  if (appliances.value.length <= 1) return;
  appliances.value = appliances.value.filter(a => a.id !== id);
}

// ===================== Bill Mode State =====================
const totalKwh = ref<number | null>(null);
const totalBillAmount = ref<number | null>(null);
const roommateCount = ref(4);
const myKwh = ref<number | null>(null);

// ===================== Computed: Appliance Mode =====================
// Daily kWh for each appliance
const applianceDailyKwh = computed(() =>
  appliances.value.map(a => ({
    ...a,
    dailyKwh: (a.powerW * a.dailyHours * a.quantity) / 1000,
    monthlyKwh: (a.powerW * a.dailyHours * a.quantity * calculationDays.value) / 1000,
  })),
);

// Total monthly kWh
const totalMonthlyKwh = computed(() =>
  applianceDailyKwh.value.reduce((sum, a) => sum + a.monthlyKwh, 0),
);

// Calculate cost with tiered pricing
function calculateTieredCost(kwh: number): number {
  if (kwh <= 0) return 0;
  let cost = 0;
  let remaining = kwh;
  let prevLimit = 0;

  for (const tier of tiers.value) {
    if (remaining <= 0) break;
    const tierKwh = tier.limit === Infinity ? remaining : Math.min(remaining, tier.limit - prevLimit);
    cost += tierKwh * tier.price;
    remaining -= tierKwh;
    prevLimit = tier.limit;
  }

  return cost;
}

// Monthly cost
const monthlyCost = computed(() => {
  if (totalMonthlyKwh.value <= 0) return 0;
  if (priceMode.value === 'flat') {
    return totalMonthlyKwh.value * flatPrice.value;
  }
  return calculateTieredCost(totalMonthlyKwh.value);
});

// Daily cost
const dailyCost = computed(() => {
  if (calculationDays.value <= 0) return 0;
  return monthlyCost.value / calculationDays.value;
});

// Yearly cost
const yearlyCost = computed(() => monthlyCost.value * 12);

// Top and low consumers
const topConsumer = computed(() => {
  if (applianceDailyKwh.value.length === 0) return null;
  return applianceDailyKwh.value.reduce((max, a) => (a.monthlyKwh > max.monthlyKwh ? a : max));
});

const lowConsumer = computed(() => {
  const valid = applianceDailyKwh.value.filter(a => a.monthlyKwh > 0);
  if (valid.length === 0) return null;
  return valid.reduce((min, a) => (a.monthlyKwh < min.monthlyKwh ? a : min));
});

// ===================== Computed: Bill Mode =====================
const billResult = computed(() => {
  if (!totalKwh.value || !totalBillAmount.value || roommateCount.value <= 0) return null;

  const pricePerKwh = totalBillAmount.value / totalKwh.value;
  const perPersonBase = totalBillAmount.value / roommateCount.value;

  let myShare = perPersonBase;
  let sharedPart = 0;

  if (myKwh.value !== null && myKwh.value > 0) {
    // If my usage is provided, calculate based on proportional usage
    const sharedKwh = totalKwh.value - myKwh.value;
    const sharedBill = sharedKwh * pricePerKwh;
    sharedPart = sharedBill / roommateCount.value;
    myShare = myKwh.value * pricePerKwh + sharedPart;
  }

  return {
    pricePerKwh: pricePerKwh.toFixed(4),
    perPersonBase: perPersonBase.toFixed(2),
    myShare: myShare.toFixed(2),
    sharedPart: sharedPart.toFixed(2),
    myKwhCost: myKwh.value ? (myKwh.value * pricePerKwh).toFixed(2) : null,
  };
});

// ===================== Active Tab =====================
const activeTab = ref('appliance');

// ===================== History =====================
interface HistoryRecord {
  date: string;
  monthlyKwh: string;
  monthlyCost: string;
  applianceCount: number;
}

const history = useStorage<HistoryRecord[]>('electricity-cost-history', []);

function saveToHistory() {
  if (totalMonthlyKwh.value <= 0) return;
  history.value.unshift({
    date: new Date().toLocaleDateString(),
    monthlyKwh: totalMonthlyKwh.value.toFixed(1),
    monthlyCost: monthlyCost.value.toFixed(2),
    applianceCount: appliances.value.filter(a => a.powerW > 0).length,
  });
  if (history.value.length > 20) history.value = history.value.slice(0, 20);
  justSaved.value = true;
  setTimeout(() => {
    justSaved.value = false;
  }, 1500);
}

const justSaved = ref(false);

function deleteRecord(index: number) {
  history.value.splice(index, 1);
}

function clearHistory() {
  history.value = [];
}

// Reset
function resetAppliances() {
  appliances.value = [{ id: nextId++, name: '', powerW: 0, dailyHours: 0, quantity: 1 }];
  flatPrice.value = 0.56;
  priceMode.value = 'flat';
  calculationDays.value = 30;
}

// Copy result
function copyResult() {
  const text = lang.value === 'zh'
    ? `月用电：${totalMonthlyKwh.value.toFixed(1)}度\n月电费：¥${monthlyCost.value.toFixed(2)}\n日费用：¥${dailyCost.value.toFixed(2)}`
    : `Monthly: ${totalMonthlyKwh.value.toFixed(1)} kWh\nCost: ¥${monthlyCost.value.toFixed(2)}\nDaily: ¥${dailyCost.value.toFixed(2)}`;
  navigator.clipboard.writeText(text);
  justCopied.value = true;
  setTimeout(() => {
    justCopied.value = false;
  }, 1500);
}

const justCopied = ref(false);

// Tiered pricing region presets
const regionPresets = computed(() => [
  {
    label: lang.value === 'zh' ? '居民用电（默认）' : 'Residential (Default)',
    tiers: [
      { limit: 200, price: 0.56 },
      { limit: 400, price: 0.61 },
      { limit: Infinity, price: 0.86 },
    ],
  },
  {
    label: lang.value === 'zh' ? '北京居民' : 'Beijing Residential',
    tiers: [
      { limit: 240, price: 0.4883 },
      { limit: 400, price: 0.5383 },
      { limit: Infinity, price: 0.7883 },
    ],
  },
  {
    label: lang.value === 'zh' ? '上海居民' : 'Shanghai Residential',
    tiers: [
      { limit: 200, price: 0.617 },
      { limit: 400, price: 0.677 },
      { limit: Infinity, price: 0.977 },
    ],
  },
  {
    label: lang.value === 'zh' ? '广东居民' : 'Guangdong Residential',
    tiers: [
      { limit: 200, price: 0.58 },
      { limit: 400, price: 0.63 },
      { limit: Infinity, price: 0.88 },
    ],
  },
]);

function selectRegionPreset(index: number) {
  const preset = regionPresets.value[index];
  tiers.value = preset.tiers.map(t => ({ ...t }));
}

// Power unit
const powerUnit = ref<'w' | 'kw'>('w');
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
        <!-- Left: Input -->
        <n-gi span="24 m:14">
          <!-- Mode Tabs -->
          <c-card mb-4>
            <n-tabs v-model:value="activeTab" type="segment" animated>
              <!-- Appliance Calculator Tab -->
              <n-tab-pane name="appliance" :tab="t('applianceMode').value">
                <div mt-4 flex flex-col gap-4>
                  <!-- Pricing Mode -->
                  <div>
                    <div text-sm font-medium mb-2>{{ t('electricityPrice').value }}</div>
                    <div flex gap-2 mb-3>
                      <n-button
                        :type="priceMode === 'flat' ? 'primary' : 'default'"
                        size="small"
                        round
                        @click="priceMode = 'flat'"
                      >
                        {{ t('unitPrice').value }}
                      </n-button>
                      <n-button
                        :type="priceMode === 'tiered' ? 'primary' : 'default'"
                        size="small"
                        round
                        @click="priceMode = 'tiered'"
                      >
                        {{ t('tieredPrice').value }}
                      </n-button>
                    </div>

                    <!-- Flat Price Input -->
                    <div v-if="priceMode === 'flat'">
                      <n-input-number
                        v-model:value="flatPrice"
                        :min="0"
                        :max="10"
                        :step="0.01"
                        size="large"
                        style="width: 100%"
                      >
                        <template #suffix>{{ t('yuanPerKwh').value }}</template>
                      </n-input-number>
                    </div>

                    <!-- Tiered Pricing -->
                    <div v-else flex flex-col gap-3>
                      <!-- Region presets -->
                      <div flex flex-wrap gap-2>
                        <n-button
                          v-for="(region, i) in regionPresets"
                          :key="i"
                          size="small"
                          round
                          @click="selectRegionPreset(i)"
                        >
                          {{ region.label }}
                        </n-button>
                      </div>

                      <!-- Tier table -->
                      <div
                        v-for="(tier, i) in tiers"
                        :key="i"
                        flex items-center gap-3 p-3 rounded-lg
                        style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);"
                      >
                        <n-tag size="small" :type="i === 0 ? 'success' : i === 1 ? 'warning' : 'error'" round>
                          {{ i === 0 ? t('tier1').value : i === 1 ? t('tier2').value : t('tier3').value }}
                        </n-tag>
                        <div flex-1>
                          <div flex items-center gap-2>
                            <span text-xs op-50>{{ t('tierLimit').value }}:</span>
                            <n-input-number
                              v-model:value="tier.limit"
                              :min="i === 0 ? 1 : (tiers[i-1]?.limit || 1)"
                              :max="99999"
                              :step="50"
                              size="small"
                              style="width: 100px"
                              :disabled="i === tiers.length - 1"
                            >
                              <template #suffix>{{ t('kwh').value }}</template>
                            </n-input-number>
                            <span text-xs op-50>{{ t('tierPrice').value }}:</span>
                            <n-input-number
                              v-model:value="tier.price"
                              :min="0"
                              :max="10"
                              :step="0.01"
                              size="small"
                              style="width: 100px"
                            >
                              <template #suffix>{{ t('yuanPerKwh').value }}</template>
                            </n-input-number>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Days -->
                  <div>
                    <div flex justify-between items-center mb-1>
                      <span text-sm font-medium>{{ t('days').value }}</span>
                      <span text-sm font-bold op-80>{{ calculationDays }} {{ t('day').value }}</span>
                    </div>
                    <n-slider
                      v-model:value="calculationDays"
                      :min="1"
                      :max="31"
                      :step="1"
                      :marks="{ 7: '7', 15: '15', 30: '30' }"
                    />
                  </div>

                  <!-- Appliance List -->
                  <div>
                    <div text-sm font-bold mb-3>⚡ {{ t('appliance').value }}</div>
                    <div flex flex-col gap-3>
                      <div
                        v-for="app in appliances"
                        :key="app.id"
                        p-3 rounded-xl
                        style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);"
                      >
                        <div flex items-center gap-2 mb-3>
                          <n-input-number
                            v-model:value="app.powerW"
                            :min="0"
                            :max="50000"
                            :step="10"
                            size="small"
                            style="flex: 1"
                            :placeholder="t('power').value"
                          >
                            <template #suffix>{{ powerUnit === 'w' ? 'W' : 'kW' }}</template>
                          </n-input-number>
                          <n-input-number
                            v-model:value="app.dailyHours"
                            :min="0"
                            :max="24"
                            :step="0.5"
                            size="small"
                            style="width: 100px"
                            :placeholder="t('dailyHours').value"
                          >
                            <template #suffix>h</template>
                          </n-input-number>
                          <n-input-number
                            v-model:value="app.quantity"
                            :min="1"
                            :max="20"
                            :step="1"
                            size="small"
                            style="width: 70px"
                          />
                          <n-button
                            size="small"
                            quaternary
                            type="error"
                            :disabled="appliances.length <= 1"
                            @click="removeAppliance(app.id)"
                          >
                            ✕
                          </n-button>
                        </div>

                        <!-- Mini result -->
                        <div v-if="app.powerW > 0 && app.dailyHours > 0" flex gap-2 text-xs>
                          <n-tag size="small" round type="info">
                            {{ ((app.powerW * app.dailyHours * app.quantity) / 1000).toFixed(2) }} {{ t('kwh').value }}/{{ t('day').value }}
                          </n-tag>
                          <n-tag size="small" round type="warning">
                            {{ ((app.powerW * app.dailyHours * app.quantity * calculationDays) / 1000).toFixed(1) }} {{ t('kwh').value }}/{{ t('month').value }}
                          </n-tag>
                        </div>
                      </div>
                    </div>

                    <!-- Add Appliance Button -->
                    <div mt-3>
                      <n-button type="primary" block round @click="addEmptyAppliance">
                        + {{ t('addAppliance').value }}
                      </n-button>
                    </div>
                  </div>

                  <!-- Quick Presets -->
                  <div>
                    <div text-sm font-bold mb-2>🔌 {{ t('presetLabel').value }}</div>
                    <div flex flex-wrap gap-2>
                      <n-button
                        v-for="(preset, i) in appliancePresets"
                        :key="i"
                        size="small"
                        round
                        quaternary
                        @click="addPresetAppliance(preset)"
                      >
                        {{ preset.name }} ({{ preset.powerW }}W)
                      </n-button>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div flex gap-3>
                    <n-button
                      type="primary"
                      block
                      size="large"
                      round
                      @click="saveToHistory"
                      :disabled="totalMonthlyKwh <= 0"
                    >
                      <template #icon><n-icon><Bolt /></n-icon></template>
                      {{ justSaved ? t('saved').value : t('saveRecord').value }}
                    </n-button>
                    <n-button quaternary size="large" round @click="resetAppliances">
                      <template #icon><n-icon><Refresh /></n-icon></template>
                      {{ t('reset').value }}
                    </n-button>
                  </div>
                </div>
              </n-tab-pane>

              <!-- Bill Splitter Tab -->
              <n-tab-pane name="bill" :tab="t('billMode').value">
                <div mt-4 flex flex-col gap-4>
                  <!-- Total usage -->
                  <div>
                    <div text-sm font-medium mb-2>{{ t('totalReading').value }}</div>
                    <n-input-number
                      v-model:value="totalKwh"
                      :min="0"
                      :max="99999"
                      :step="1"
                      size="large"
                      :placeholder="t('totalReading').value"
                      style="width: 100%"
                      clearable
                    >
                      <template #suffix>{{ t('kwh').value }}</template>
                    </n-input-number>
                  </div>

                  <!-- Total bill -->
                  <div>
                    <div text-sm font-medium mb-2>{{ t('totalBill').value }}</div>
                    <n-input-number
                      v-model:value="totalBillAmount"
                      :min="0"
                      :max="99999"
                      :step="0.01"
                      size="large"
                      :placeholder="t('totalBill').value"
                      style="width: 100%"
                      clearable
                    >
                      <template #suffix>{{ t('yuan').value }}</template>
                    </n-input-number>
                  </div>

                  <!-- Roommates -->
                  <div>
                    <div flex justify-between items-center mb-1>
                      <span text-sm font-medium>{{ t('roommates').value }}</span>
                      <span text-sm font-bold op-80>{{ roommateCount }} {{ lang === 'zh' ? '人' : 'people' }}</span>
                    </div>
                    <n-slider
                      v-model:value="roommateCount"
                      :min="1"
                      :max="12"
                      :step="1"
                      :marks="{ 1: '1', 2: '2', 4: '4', 6: '6', 8: '8' }"
                    />
                  </div>

                  <!-- My usage (optional) -->
                  <div>
                    <div flex items-center gap-2 mb-2>
                      <span text-sm font-medium>{{ t('myUsage').value }}</span>
                      <n-tag size="small" round type="info">{{ lang === 'zh' ? '可选' : 'Optional' }}</n-tag>
                    </div>
                    <n-input-number
                      v-model:value="myKwh"
                      :min="0"
                      :max="totalKwh || 99999"
                      :step="1"
                      size="large"
                      :placeholder="lang === 'zh' ? '输入你的用电量，精确计算分摊' : 'Enter your usage for precise splitting'"
                      style="width: 100%"
                      clearable
                    >
                      <template #suffix>{{ t('kwh').value }}</template>
                    </n-input-number>
                  </div>
                </div>
              </n-tab-pane>
            </n-tabs>
          </c-card>
        </n-gi>

        <!-- Right: Results & Info -->
        <n-gi span="24 m:10">
          <!-- Appliance Mode Results -->
          <template v-if="activeTab === 'appliance'">
            <!-- Result Card -->
            <c-card v-if="totalMonthlyKwh > 0" mb-4>
              <div text-lg font-bold mb-4>⚡ {{ t('totalCost').value }}</div>

              <!-- Monthly Cost - Big Number -->
              <div text-center mb-6>
                <div text-sm op-60 mb-1>{{ t('monthlyCost').value }}</div>
                <div text-5xl font-bold text-amber-400>
                  ¥{{ monthlyCost.toFixed(2) }}
                </div>
              </div>

              <!-- Detail Cards -->
              <div grid grid-cols-2 gap-3 mb-4>
                <div p-3 rounded-lg style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);">
                  <div text-xs op-60 mb-1>{{ t('dailyCost').value }}</div>
                  <div text-xl font-bold text-blue-400>¥{{ dailyCost.toFixed(2) }}</div>
                </div>
                <div p-3 rounded-lg style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);">
                  <div text-xs op-60 mb-1>{{ t('yearlyCost').value }}</div>
                  <div text-xl font-bold text-green-400>¥{{ yearlyCost.toFixed(2) }}</div>
                </div>
              </div>

              <!-- Usage breakdown -->
              <div grid grid-cols-2 gap-3 mb-4>
                <div p-3 rounded-lg style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2);">
                  <div text-xs op-60 mb-1>{{ t('monthlyKwh').value }}</div>
                  <div text-xl font-bold text-purple-400>{{ totalMonthlyKwh.toFixed(1) }}<span text-sm op-70> {{ t('kwh').value }}</span></div>
                </div>
                <div p-3 rounded-lg style="background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2);">
                  <div text-xs op-60 mb-1>{{ t('dailyKwh').value }}</div>
                  <div text-xl font-bold text-yellow-400>{{ (totalMonthlyKwh / calculationDays).toFixed(2) }}<span text-sm op-70> {{ t('kwh').value }}</span></div>
                </div>
              </div>

              <!-- Tiered breakdown bar -->
              <div v-if="priceMode === 'tiered' && totalMonthlyKwh > 0" mb-4>
                <div text-sm font-bold mb-2>📊 {{ lang === 'zh' ? '阶梯详情' : 'Tier Breakdown' }}</div>
                <div flex flex-col gap-2>
                  <div
                    v-for="(tier, i) in tiers"
                    :key="i"
                    flex justify-between items-center p-2 rounded-lg
                    style="background: rgba(255,255,255,0.03);"
                  >
                    <n-tag size="small" :type="i === 0 ? 'success' : i === 1 ? 'warning' : 'error'" round>
                      {{ i === 0 ? t('tier1').value : i === 1 ? t('tier2').value : t('tier3').value }}
                    </n-tag>
                    <span text-sm font-bold>{{ tier.price }} {{ t('yuanPerKwh').value }}</span>
                  </div>
                </div>
              </div>

              <!-- Copy Button -->
              <div flex justify-center mt-2>
                <n-button size="small" round quaternary @click="copyResult">
                  <template #icon><n-icon><Copy /></n-icon></template>
                  {{ justCopied ? '✓' : t('copy').value }}
                </n-button>
              </div>
            </c-card>

            <!-- Empty State -->
            <c-card v-else mb-4>
              <div text-center py-8>
                <div text-4xl mb-3>{{ t('emptyState').value }}</div>
                <div text-sm op-50>{{ t('noAppliance').value }}</div>
              </div>
            </c-card>

            <!-- Usage Overview -->
            <c-card v-if="topConsumer || lowConsumer" mb-4>
              <div text-lg font-bold mb-3>📈 {{ t('summary').value }}</div>
              <div flex flex-col gap-2>
                <div v-if="topConsumer && topConsumer.monthlyKwh > 0" flex justify-between items-center p-3 rounded-lg style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);">
                  <div>
                    <div text-xs op-60>{{ t('topConsumer').value }}</div>
                    <div text-sm font-bold>{{ topConsumer.name || `${topConsumer.powerW}W` }}</div>
                  </div>
                  <div text-right>
                    <div text-sm font-bold text-red-400>{{ topConsumer.monthlyKwh.toFixed(1) }} {{ t('kwh').value }}</div>
                    <div text-xs op-50>{{ ((topConsumer.monthlyKwh / totalMonthlyKwh) * 100).toFixed(1) }}%</div>
                  </div>
                </div>
                <div v-if="lowConsumer && lowConsumer.monthlyKwh > 0" flex justify-between items-center p-3 rounded-lg style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);">
                  <div>
                    <div text-xs op-60>{{ t('lowConsumer').value }}</div>
                    <div text-sm font-bold>{{ lowConsumer.name || `${lowConsumer.powerW}W` }}</div>
                  </div>
                  <div text-right>
                    <div text-sm font-bold text-green-400>{{ lowConsumer.monthlyKwh.toFixed(1) }} {{ t('kwh').value }}</div>
                    <div text-xs op-50>{{ ((lowConsumer.monthlyKwh / totalMonthlyKwh) * 100).toFixed(1) }}%</div>
                  </div>
                </div>
              </div>

              <!-- Usage proportion bar -->
              <div v-if="applianceDailyKwh.filter(a => a.monthlyKwh > 0).length > 0" mt-3>
                <div h-3 rounded-full overflow-hidden flex>
                  <div
                    v-for="(app, i) in applianceDailyKwh.filter(a => a.monthlyKwh > 0)"
                    :key="i"
                    :style="{
                      width: `${(app.monthlyKwh / totalMonthlyKwh) * 100}%`,
                      background: `hsl(${(i * 137.5) % 360}, 70%, 55%)`,
                    }"
                    h-full
                    :title="`${app.name || app.powerW + 'W'}: ${((app.monthlyKwh / totalMonthlyKwh) * 100).toFixed(1)}%`"
                  />
                </div>
                <div mt-2 flex flex-wrap gap-2>
                  <div
                    v-for="(app, i) in applianceDailyKwh.filter(a => a.monthlyKwh > 0)"
                    :key="i"
                    flex items-center gap-1 text-xs
                  >
                    <div w-2 h-2 rounded-full :style="{ background: `hsl(${(i * 137.5) % 360}, 70%, 55%)` }" />
                    <span op-70>{{ app.name || `${app.powerW}W` }}</span>
                  </div>
                </div>
              </div>
            </c-card>
          </template>

          <!-- Bill Mode Results -->
          <template v-if="activeTab === 'bill'">
            <c-card v-if="billResult" mb-4>
              <div text-lg font-bold mb-4>🏠 {{ t('billMode').value }}</div>

              <!-- Per Person -->
              <div text-center mb-6>
                <div text-sm op-60 mb-1>{{ t('perPerson').value }}</div>
                <div text-5xl font-bold text-blue-400>
                  ¥{{ billResult.perPersonBase }}
                </div>
              </div>

              <!-- Price per kWh -->
              <div p-3 rounded-lg mb-4 style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.2);">
                <div flex justify-between items-center>
                  <span text-sm op-60>{{ lang === 'zh' ? '实际单价' : 'Effective Rate' }}</span>
                  <span text-lg font-bold text-purple-400>{{ billResult.pricePerKwh }} {{ t('yuanPerKwh').value }}</span>
                </div>
              </div>

              <!-- My Share (if personalized) -->
              <div v-if="myKwh && billResult.myKwhCost" mb-4>
                <div p-4 rounded-xl style="background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.1)); border: 1px solid rgba(34,197,94,0.25);">
                  <div text-sm font-bold mb-3>💰 {{ t('myShare').value }}</div>
                  <div text-3xl font-bold text-green-400 mb-2>¥{{ billResult.myShare }}</div>
                  <div flex flex-col gap-1 text-xs op-70>
                    <div flex justify-between>
                      <span>{{ t('myBill').value }}</span>
                      <span>¥{{ billResult.myKwhCost }}</span>
                    </div>
                    <div v-if="Number(billResult.sharedPart) > 0" flex justify-between>
                      <span>{{ t('sharedCost').value }}</span>
                      <span>¥{{ billResult.sharedPart }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Roommates overview -->
              <div p-3 rounded-lg style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
                <div flex justify-between text-sm>
                  <span op-60>{{ t('roommates').value }}</span>
                  <span font-bold>{{ roommateCount }} {{ lang === 'zh' ? '人' : 'people' }}</span>
                </div>
                <div flex justify-between text-sm mt-2>
                  <span op-60>{{ t('totalKwh').value }}</span>
                  <span font-bold>{{ totalKwh }} {{ t('kwh').value }}</span>
                </div>
                <div flex justify-between text-sm mt-2>
                  <span op-60>{{ t('totalCost').value }}</span>
                  <span font-bold>¥{{ totalBillAmount }}</span>
                </div>
              </div>
            </c-card>

            <!-- Bill Empty State -->
            <c-card v-else mb-4>
              <div text-center py-8>
                <div text-4xl mb-3>🏠</div>
                <div text-sm op-50>{{ lang === 'zh' ? '输入用电量和电费信息' : 'Enter usage and bill info' }}</div>
              </div>
            </c-card>
          </template>

          <!-- History -->
          <c-card v-if="history.length > 0" mb-4>
            <div flex justify-between items-center mb-3>
              <div text-lg font-bold>📋 {{ t('history').value }}</div>
              <n-button size="tiny" quaternary type="error" @click="clearHistory">{{ t('clearHistory').value }}</n-button>
            </div>
            <div flex flex-col gap-2>
              <div
                v-for="(record, i) in history.slice(0, 10)"
                :key="i"
                flex justify-between items-center p-2 rounded-lg
                style="background: rgba(255,255,255,0.03);"
              >
                <div>
                  <div text-sm font-bold>{{ record.monthlyKwh }} {{ t('kwh').value }}</div>
                  <div text-xs op-50>{{ record.date }}</div>
                </div>
                <div text-right>
                  <div text-sm font-bold text-amber-400>¥{{ record.monthlyCost }}</div>
                  <div text-xs op-50>{{ record.applianceCount }} {{ lang === 'zh' ? '个电器' : 'appliances' }}</div>
                </div>
                <n-button size="tiny" quaternary type="error" @click="deleteRecord(i)">✕</n-button>
              </div>
            </div>
          </c-card>

          <!-- Tips Card -->
          <c-card>
            <div text-lg font-bold mb-3>💡 {{ t('tips').value }}</div>
            <div flex flex-col gap-2>
              <div v-for="i in 5" :key="i" flex items-start gap-2>
                <span text-amber-400 text-sm>•</span>
                <span text-sm op-70>{{ t(`tip${i}` as keyof typeof labels.zh).value }}</span>
              </div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
</style>
