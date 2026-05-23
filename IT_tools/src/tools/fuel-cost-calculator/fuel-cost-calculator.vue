<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { NButton, NInputNumber, NSlider, NSwitch, NGrid, NGi, NSelect, NIcon, NTooltip, NTabs, NTabPane } from 'naive-ui';
import { Copy, Refresh, Route, GasStation } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '燃油费用计算器',
    subtitle: '计算出行燃油费用、百公里油耗、里程油耗转换',
    tripMode: '行程模式',
    consumptionMode: '油耗换算',
    distance: '行驶距离',
    fuelPrice: '燃油单价',
    fuelConsumption: '百公里油耗',
    totalCost: '总费用',
    totalFuel: '总耗油量',
    costPerKm: '每公里费用',
    distanceUnit: '距离单位',
    volumeUnit: '体积单位',
    fuelType: '燃油类型',
    gasoline92: '92号汽油',
    gasoline95: '95号汽油',
    gasoline98: '98号汽油',
    diesel: '0号柴油',
    custom: '自定义',
    km: '公里',
    mile: '英里',
    liter: '升',
    gallon: '加仑',
    gallonUS: '美制加仑',
    gallonUK: '英制加仑',
    yuan: '元',
    yuanPerKm: '元/公里',
    literPer100km: 'L/100km',
    mpg: 'MPG',
    kmPerLiter: 'km/L',
    calculate: '计算',
    reset: '重置',
    result: '计算结果',
    tips: '省油小贴士',
    tip1: '保持匀速行驶，避免急加速和急刹车',
    tip2: '定期保养车辆，保持轮胎气压正常',
    tip3: '减少车辆负重，清理不必要的物品',
    tip4: '使用定速巡航功能可节省5-15%燃油',
    tip5: '避免长时间怠速，怠速超过1分钟建议熄火',
    consumptionInput: '输入油耗值',
    fromUnit: '从',
    toUnit: '转换为',
    convertedResult: '转换结果',
    recentPrices: '参考油价',
    priceNote: '以上为参考价格，请以实际加油站价格为准',
    history: '历史记录',
    noHistory: '暂无计算记录',
    saveRecord: '保存记录',
    saved: '已保存！',
    deleteRecord: '删除',
    clearHistory: '清空历史',
    roundTrip: '往返',
    passengers: '乘车人数',
    costPerPerson: '人均费用',
  },
  en: {
    title: 'Fuel Cost Calculator',
    subtitle: 'Calculate trip fuel costs, fuel consumption per 100km, and unit conversions',
    tripMode: 'Trip Calculator',
    consumptionMode: 'Consumption Converter',
    distance: 'Distance',
    fuelPrice: 'Fuel Price',
    fuelConsumption: 'Fuel Consumption',
    totalCost: 'Total Cost',
    totalFuel: 'Total Fuel',
    costPerKm: 'Cost per km',
    distanceUnit: 'Distance Unit',
    volumeUnit: 'Volume Unit',
    fuelType: 'Fuel Type',
    gasoline92: 'Regular 92',
    gasoline95: 'Premium 95',
    gasoline98: 'Premium 98',
    diesel: 'Diesel',
    custom: 'Custom',
    km: 'km',
    mile: 'mile',
    liter: 'Liter',
    gallon: 'Gallon',
    gallonUS: 'US Gallon',
    gallonUK: 'UK Gallon',
    yuan: 'CNY',
    yuanPerKm: 'CNY/km',
    literPer100km: 'L/100km',
    mpg: 'MPG',
    kmPerLiter: 'km/L',
    calculate: 'Calculate',
    reset: 'Reset',
    result: 'Result',
    tips: 'Fuel Saving Tips',
    tip1: 'Maintain steady speed, avoid sudden acceleration and braking',
    tip2: 'Regular maintenance, keep tire pressure optimal',
    tip3: 'Reduce vehicle weight, remove unnecessary items',
    tip4: 'Use cruise control to save 5-15% fuel',
    tip5: 'Avoid long idling; turn off engine if idling over 1 minute',
    consumptionInput: 'Enter consumption value',
    fromUnit: 'From',
    toUnit: 'Convert to',
    convertedResult: 'Conversion Result',
    recentPrices: 'Reference Prices',
    priceNote: 'Prices are for reference only. Check local stations for actual prices.',
    history: 'History',
    noHistory: 'No records yet',
    saveRecord: 'Save',
    saved: 'Saved!',
    deleteRecord: 'Delete',
    clearHistory: 'Clear History',
    roundTrip: 'Round Trip',
    passengers: 'Passengers',
    costPerPerson: 'Cost per Person',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Trip Calculator State =====================
const distance = ref<number | null>(null);
const fuelPrice = ref<number | null>(null);
const fuelConsumption = ref<number | null>(8); // L/100km default
const isRoundTrip = ref(false);
const passengerCount = ref(1);
const distanceUnit = ref<'km' | 'mile'>('km');
const volumeUnit = ref<'liter' | 'gallonUS' | 'gallonUK'>('liter');
const activeTab = ref('trip');

// Fuel type presets (CNY/L)
const fuelPresets = [
  { label: () => labels[lang.value].gasoline92, price: 7.82 },
  { label: () => labels[lang.value].gasoline95, price: 8.35 },
  { label: () => labels[lang.value].gasoline98, price: 9.42 },
  { label: () => labels[lang.value].diesel, price: 7.55 },
];

const selectedFuelType = ref<number | null>(null);

// Select fuel type
function selectFuelType(index: number) {
  selectedFuelType.value = index;
  fuelPrice.value = fuelPresets[index].price;
}

// ===================== Consumption Converter State =====================
const consumptionValue = ref<number | null>(null);
const fromConsumptionUnit = ref<'L/100km' | 'mpg' | 'km/L'>('L/100km');
const toConsumptionUnit = ref<'L/100km' | 'mpg' | 'km/L'>('mpg');

// Conversion helpers
function toLPer100km(value: number, from: string): number {
  switch (from) {
    case 'L/100km': return value;
    case 'mpg': return 235.215 / value; // US MPG
    case 'km/L': return 100 / value;
    default: return value;
  }
}

function fromLPer100km(value: number, to: string): number {
  switch (to) {
    case 'L/100km': return value;
    case 'mpg': return 235.215 / value;
    case 'km/L': return 100 / value;
    default: return value;
  }
}

// ===================== Computed Results =====================

// Effective distance in km
const effectiveDistanceKm = computed(() => {
  if (!distance.value) return 0;
  let d = distance.value;
  if (distanceUnit.value === 'mile') d *= 1.60934;
  if (isRoundTrip.value) d *= 2;
  return d;
});

// Fuel consumption in L/100km
const consumptionLPer100km = computed(() => {
  if (!fuelConsumption.value) return 0;
  switch (volumeUnit.value) {
    case 'liter': return fuelConsumption.value;
    case 'gallonUS': return fuelConsumption.value * 3.78541;
    case 'gallonUK': return fuelConsumption.value * 4.54609;
    default: return fuelConsumption.value;
  }
});

// Total fuel in liters
const totalFuelLiters = computed(() => {
  if (!effectiveDistanceKm.value || !consumptionLPer100km.value) return 0;
  return (effectiveDistanceKm.value / 100) * consumptionLPer100km.value;
});

// Fuel price in CNY/L
const fuelPriceCNY = computed(() => {
  if (!fuelPrice.value) return 0;
  switch (volumeUnit.value) {
    case 'liter': return fuelPrice.value;
    case 'gallonUS': return fuelPrice.value / 3.78541;
    case 'gallonUK': return fuelPrice.value / 4.54609;
    default: return fuelPrice.value;
  }
});

// Trip results
const tripResult = computed(() => {
  if (!distance.value || !fuelPrice.value || !fuelConsumption.value) return null;
  const fuel = totalFuelLiters.value;
  const cost = fuel * fuelPriceCNY.value;
  const perKm = effectiveDistanceKm.value > 0 ? cost / effectiveDistanceKm.value : 0;
  const perPerson = passengerCount.value > 1 ? cost / passengerCount.value : cost;

  return {
    totalCost: cost.toFixed(2),
    totalFuel: fuel.toFixed(2),
    costPerKm: perKm.toFixed(2),
    costPerPerson: perPerson.toFixed(2),
    effectiveDistance: effectiveDistanceKm.value.toFixed(1),
  };
});

// Consumption conversion result
const convertedConsumption = computed(() => {
  if (!consumptionValue.value) return null;
  const lPer100km = toLPer100km(consumptionValue.value, fromConsumptionUnit.value);
  const result = fromLPer100km(lPer100km, toConsumptionUnit.value);
  return Math.abs(result) === Infinity ? null : result.toFixed(2);
});

// History
interface HistoryRecord {
  date: string;
  distance: number;
  distanceUnit: string;
  totalCost: string;
  totalFuel: string;
}

const history = useStorage<HistoryRecord[]>('fuel-cost-history', []);

function saveToHistory() {
  if (!tripResult.value || !distance.value) return;
  history.value.unshift({
    date: new Date().toLocaleDateString(),
    distance: distance.value,
    distanceUnit: distanceUnit.value,
    totalCost: tripResult.value.totalCost,
    totalFuel: tripResult.value.totalFuel,
  });
  if (history.value.length > 20) history.value = history.value.slice(0, 20);
  justSaved.value = true;
  setTimeout(() => { justSaved.value = false; }, 1500);
}

const justSaved = ref(false);

function deleteRecord(index: number) {
  history.value.splice(index, 1);
}

function clearHistory() {
  history.value = [];
}

// Reset
function resetTrip() {
  distance.value = null;
  fuelPrice.value = null;
  fuelConsumption.value = 8;
  isRoundTrip.value = false;
  passengerCount.value = 1;
  selectedFuelType.value = null;
}

// Copy result
function copyResult() {
  if (!tripResult.value) return;
  const text = lang.value === 'zh'
    ? `燃油费用：¥${tripResult.value.totalCost}\n耗油量：${tripResult.value.totalFuel}L\n每公里：¥${tripResult.value.costPerKm}`
    : `Fuel Cost: ¥${tripResult.value.totalCost}\nFuel Used: ${tripResult.value.totalFuel}L\nPer km: ¥${tripResult.value.costPerKm}`;
  navigator.clipboard.writeText(text);
  justCopied.value = true;
  setTimeout(() => { justCopied.value = false; }, 1500);
}

const justCopied = ref(false);

// Consumption unit options
const consumptionUnitOptions = computed(() => [
  { label: 'L/100km', value: 'L/100km' },
  { label: 'MPG (US)', value: 'mpg' },
  { label: 'km/L', value: 'km/L' },
]);

// Volume unit options
const volumeUnitOptions = computed(() => [
  { label: t('liter').value, value: 'liter' },
  { label: t('gallonUS').value, value: 'gallonUS' },
  { label: t('gallonUK').value, value: 'gallonUK' },
]);

// Distance unit options
const distanceUnitOptions = computed(() => [
  { label: t('km').value, value: 'km' },
  { label: t('mile').value, value: 'mile' },
]);
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
        <n-gi span="24 m:14">
          <!-- Mode Tabs -->
          <c-card mb-4>
            <n-tabs v-model:value="activeTab" type="segment" animated>
              <!-- Trip Calculator Tab -->
              <n-tab-pane name="trip" :tab="t('tripMode').value">
                <div mt-4 flex flex-col gap-4>
                  <!-- Distance -->
                  <div>
                    <div flex justify-between items-center mb-2>
                      <span text-sm font-medium>{{ t('distance').value }}</span>
                      <n-select
                        v-model:value="distanceUnit"
                        :options="distanceUnitOptions"
                        size="tiny"
                        style="width: 100px"
                      />
                    </div>
                    <n-input-number
                      v-model:value="distance"
                      :min="0"
                      :max="99999"
                      :step="10"
                      size="large"
                      :placeholder="t('distance').value"
                      style="width: 100%"
                      clearable
                    >
                      <template #suffix>{{ distanceUnit === 'km' ? t('km').value : t('mile').value }}</template>
                    </n-input-number>
                  </div>

                  <!-- Round Trip Toggle -->
                  <div flex items-center justify-between>
                    <span text-sm op-70>🔄 {{ t('roundTrip').value }}</span>
                    <n-switch v-model:value="isRoundTrip" size="small" />
                  </div>

                  <!-- Fuel Price -->
                  <div>
                    <div flex justify-between items-center mb-2>
                      <span text-sm font-medium>{{ t('fuelPrice').value }}</span>
                      <n-select
                        v-model:value="volumeUnit"
                        :options="volumeUnitOptions"
                        size="tiny"
                        style="width: 120px"
                      />
                    </div>
                    <n-input-number
                      v-model:value="fuelPrice"
                      :min="0"
                      :max="99"
                      :step="0.01"
                      size="large"
                      :placeholder="t('fuelPrice').value"
                      style="width: 100%"
                      clearable
                    >
                      <template #suffix>¥/{{ volumeUnit === 'liter' ? t('liter').value : volumeUnit === 'gallonUS' ? t('gallonUS').value : t('gallonUK').value }}</template>
                    </n-input-number>
                  </div>

                  <!-- Quick Fuel Type Selection -->
                  <div>
                    <div text-sm font-medium mb-2>{{ t('fuelType').value }}</div>
                    <div flex flex-wrap gap-2>
                      <n-button
                        v-for="(preset, i) in fuelPresets"
                        :key="i"
                        :type="selectedFuelType === i ? 'primary' : 'default'"
                        size="small"
                        round
                        @click="selectFuelType(i)"
                      >
                        {{ preset.label() }} ¥{{ preset.price }}
                      </n-button>
                      <n-button
                        :type="selectedFuelType === null ? 'primary' : 'default'"
                        size="small"
                        round
                        @click="selectedFuelType = null"
                      >
                        {{ t('custom').value }}
                      </n-button>
                    </div>
                  </div>

                  <!-- Fuel Consumption -->
                  <div>
                    <div flex justify-between items-center mb-1>
                      <span text-sm font-medium>{{ t('fuelConsumption').value }}</span>
                      <span text-sm font-bold op-80>{{ fuelConsumption }} L/100km</span>
                    </div>
                    <n-slider
                      v-model:value="fuelConsumption"
                      :min="3"
                      :max="30"
                      :step="0.1"
                      :marks="{ 5: '5', 8: '8', 10: '10', 15: '15', 20: '20', 25: '25' }"
                    />
                  </div>

                  <!-- Passengers -->
                  <div>
                    <div flex justify-between items-center mb-1>
                      <span text-sm font-medium>{{ t('passengers').value }}</span>
                      <span text-sm font-bold op-80>{{ passengerCount }}</span>
                    </div>
                    <n-slider
                      v-model:value="passengerCount"
                      :min="1"
                      :max="10"
                      :step="1"
                      :marks="{ 1: '1', 2: '2', 4: '4', 6: '6' }"
                    />
                  </div>

                  <!-- Action Buttons -->
                  <div flex gap-3>
                    <n-button type="primary" block size="large" round @click="saveToHistory" :disabled="!tripResult">
                      <template #icon><n-icon><Route /></n-icon></template>
                      {{ justSaved ? t('saved').value : t('saveRecord').value }}
                    </n-button>
                    <n-button quaternary size="large" round @click="resetTrip">
                      <template #icon><n-icon><Refresh /></n-icon></template>
                      {{ t('reset').value }}
                    </n-button>
                  </div>
                </div>
              </n-tab-pane>

              <!-- Consumption Converter Tab -->
              <n-tab-pane name="consumption" :tab="t('consumptionMode').value">
                <div mt-4 flex flex-col gap-4>
                  <div>
                    <div text-sm font-medium mb-2>{{ t('consumptionInput').value }}</div>
                    <n-input-number
                      v-model:value="consumptionValue"
                      :min="0"
                      :max="999"
                      :step="0.1"
                      size="large"
                      :placeholder="t('consumptionInput').value"
                      style="width: 100%"
                      clearable
                    />
                  </div>

                  <n-grid :cols="2" :x-gap="12">
                    <n-gi>
                      <div text-sm font-medium mb-2>{{ t('fromUnit').value }}</div>
                      <n-select
                        v-model:value="fromConsumptionUnit"
                        :options="consumptionUnitOptions"
                        size="large"
                      />
                    </n-gi>
                    <n-gi>
                      <div text-sm font-medium mb-2>{{ t('toUnit').value }}</div>
                      <n-select
                        v-model:value="toConsumptionUnit"
                        :options="consumptionUnitOptions"
                        size="large"
                      />
                    </n-gi>
                  </n-grid>

                  <!-- Conversion Result -->
                  <div v-if="convertedConsumption" p-5 rounded-xl text-center style="background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1)); border: 1px solid rgba(59,130,246,0.25);">
                    <div text-sm op-60 mb-2>{{ t('convertedResult').value }}</div>
                    <div text-4xl font-bold text-blue-400>
                      {{ convertedConsumption }}
                      <span text-lg op-70>{{ toConsumptionUnit }}</span>
                    </div>
                  </div>

                  <!-- Quick conversion table -->
                  <div mt-2>
                    <div text-sm font-bold mb-3>{{ t('consumptionMode').value }}</div>
                    <div grid grid-cols-3 gap-2 text-center text-xs>
                      <div p-2 rounded-lg style="background: rgba(255,255,255,0.05);">
                        <div op-50>L/100km</div>
                        <div font-bold mt-1>{{ consumptionValue ? toLPer100km(consumptionValue, fromConsumptionUnit).toFixed(1) : '-' }}</div>
                      </div>
                      <div p-2 rounded-lg style="background: rgba(255,255,255,0.05);">
                        <div op-50>MPG (US)</div>
                        <div font-bold mt-1>{{ consumptionValue ? fromLPer100km(toLPer100km(consumptionValue, fromConsumptionUnit), 'mpg').toFixed(1) : '-' }}</div>
                      </div>
                      <div p-2 rounded-lg style="background: rgba(255,255,255,0.05);">
                        <div op-50>km/L</div>
                        <div font-bold mt-1>{{ consumptionValue ? fromLPer100km(toLPer100km(consumptionValue, fromConsumptionUnit), 'km/L').toFixed(1) : '-' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </n-tab-pane>
            </n-tabs>
          </c-card>
        </n-gi>

        <!-- Right: Results & Info -->
        <n-gi span="24 m:10">
          <!-- Trip Result Card -->
          <c-card v-if="tripResult" mb-4>
            <div text-lg font-bold mb-4>💰 {{ t('result').value }}</div>

            <!-- Total Cost - Big Number -->
            <div text-center mb-6>
              <div text-sm op-60 mb-1>{{ t('totalCost').value }}</div>
              <div text-5xl font-bold text-amber-400>
                ¥{{ tripResult.totalCost }}
              </div>
              <div v-if="passengerCount > 1" mt-2>
                <span text-sm op-60>{{ t('costPerPerson').value }}: </span>
                <span text-lg font-bold text-amber-300>¥{{ tripResult.costPerPerson }}</span>
              </div>
            </div>

            <!-- Detail Cards -->
            <div grid grid-cols-2 gap-3 mb-4>
              <div p-3 rounded-lg style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);">
                <div text-xs op-60 mb-1>{{ t('totalFuel').value }}</div>
                <div text-xl font-bold text-blue-400>{{ tripResult.totalFuel }}L</div>
              </div>
              <div p-3 rounded-lg style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);">
                <div text-xs op-60 mb-1>{{ t('costPerKm').value }}</div>
                <div text-xl font-bold text-green-400>¥{{ tripResult.costPerKm }}</div>
              </div>
            </div>

            <!-- Effective distance -->
            <div p-3 rounded-lg style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
              <div flex justify-between text-sm>
                <span op-60>{{ t('distance').value }}</span>
                <span font-bold>{{ tripResult.effectiveDistance }} {{ t('km').value }}{{ isRoundTrip ? ` (${lang === 'zh' ? '往返' : 'round trip'})` : '' }}</span>
              </div>
            </div>

            <!-- Copy Button -->
            <div flex justify-center mt-4>
              <n-button size="small" round quaternary @click="copyResult">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ justCopied ? '✓' : t('calculate').value }}
              </n-button>
            </div>
          </c-card>

          <!-- Empty State -->
          <c-card v-else mb-4>
            <div text-center py-8>
              <div text-4xl mb-3>⛽</div>
              <div text-sm op-50>{{ lang === 'zh' ? '输入行程信息开始计算' : 'Enter trip details to calculate' }}</div>
            </div>
          </c-card>

          <!-- Reference Prices -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>📊 {{ t('recentPrices').value }}</div>
            <div flex flex-col gap-2>
              <div v-for="(preset, i) in fuelPresets" :key="i" flex justify-between items-center p-2 rounded-lg style="background: rgba(255,255,255,0.03);">
                <span text-sm>{{ preset.label() }}</span>
                <span text-sm font-bold text-amber-400>¥{{ preset.price }}/{{ t('liter').value }}</span>
              </div>
            </div>
            <div mt-3 text-xs op-40>{{ t('priceNote').value }}</div>
          </c-card>

          <!-- History -->
          <c-card v-if="history.length > 0" mb-4>
            <div flex justify-between items-center mb-3>
              <div text-lg font-bold>📋 {{ t('history').value }}</div>
              <n-button size="tiny" quaternary type="error" @click="clearHistory">{{ t('clearHistory').value }}</n-button>
            </div>
            <div flex flex-col gap-2>
              <div v-for="(record, i) in history.slice(0, 10)" :key="i" flex justify-between items-center p-2 rounded-lg style="background: rgba(255,255,255,0.03);">
                <div>
                  <div text-sm font-bold>{{ record.distance }} {{ record.distanceUnit }}</div>
                  <div text-xs op-50>{{ record.date }}</div>
                </div>
                <div text-right>
                  <div text-sm font-bold text-amber-400>¥{{ record.totalCost }}</div>
                  <div text-xs op-50>{{ record.totalFuel }}L</div>
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
