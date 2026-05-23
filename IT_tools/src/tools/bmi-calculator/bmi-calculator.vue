<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NInputNumber, NGrid, NGi, NSwitch, NIcon } from 'naive-ui';
import { Copy, Refresh, Users } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: 'BMI 计算器',
    subtitle: '计算身体质量指数，评估体重是否健康',
    metric: '公制',
    imperial: '英制',
    weight: '体重',
    height: '身高',
    feet: '英尺',
    inches: '英寸',
    result: '计算结果',
    bmi: 'BMI',
    underweight: '偏瘦',
    normal: '正常',
    overweight: '超重',
    obese: '肥胖',
    healthyRange: '健康体重范围',
    needGain: '需要增重',
    needLose: '需要减重',
    inRange: '在健康范围内',
    whatIsBMI: '什么是 BMI？',
    bmiDesc: 'BMI（身体质量指数）是根据体重和身高计算的数值，用于评估体重是否健康。适用于18-65岁成年人。',
    formula: '公式',
    bmiFormula: 'BMI = 体重(kg) / 身高(m)²',
    referenceTable: '参考表',
    category: '分类',
    healthRisk: '健康风险',
    underweightRisk: '营养不良、骨质疏松风险',
    normalRisk: '健康风险较低',
    overweightRisk: '心血管疾病、高血压风险',
    obeseRisk: '糖尿病、心脏病风险高',
    usage: '使用说明',
    step1: '选择单位制（公制/英制）',
    step2: '输入您的体重和身高',
    step3: '查看计算结果和健康建议',
    notice: '注意',
    noticeContent: 'BMI 仅作为参考指标，不能完全反映健康状况。肌肉发达者、孕妇、老年人等不适用此标准。',
    copied: '已复制！',
    idealWeight: '理想体重范围',
    inputWeight: '输入体重',
    inputHeight: '输入身高',
    reset: '重置',
  },
  en: {
    title: 'BMI Calculator',
    subtitle: 'Calculate Body Mass Index and assess whether your weight is healthy',
    metric: 'Metric',
    imperial: 'Imperial',
    weight: 'Weight',
    height: 'Height',
    feet: 'Feet',
    inches: 'Inches',
    result: 'Result',
    bmi: 'BMI',
    underweight: 'Underweight',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obese',
    healthyRange: 'Healthy Weight Range',
    needGain: 'Need to gain',
    needLose: 'Need to lose',
    inRange: 'In healthy range',
    whatIsBMI: 'What is BMI?',
    bmiDesc: 'BMI (Body Mass Index) is a value calculated from weight and height, used to assess whether weight is healthy. Suitable for adults aged 18-65.',
    formula: 'Formula',
    bmiFormula: 'BMI = weight(kg) / height(m)²',
    referenceTable: 'Reference Table',
    category: 'Category',
    healthRisk: 'Health Risk',
    underweightRisk: 'Risk of malnutrition, osteoporosis',
    normalRisk: 'Low health risk',
    overweightRisk: 'Risk of cardiovascular disease, hypertension',
    obeseRisk: 'High risk of diabetes, heart disease',
    usage: 'How to Use',
    step1: 'Select unit system (Metric/Imperial)',
    step2: 'Enter your weight and height',
    step3: 'View results and health advice',
    notice: 'Notice',
    noticeContent: 'BMI is for reference only and cannot fully reflect health status. Not suitable for muscular individuals, pregnant women, or elderly.',
    copied: 'Copied!',
    idealWeight: 'Ideal Weight Range',
    inputWeight: 'Enter weight',
    inputHeight: 'Enter height',
    reset: 'Reset',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Input state
const weight = ref<number | null>(null);
const height = ref<number | null>(null);
const unitSystem = ref<'metric' | 'imperial'>('metric');
const heightFeet = ref<number | null>(null);
const heightInches = ref<number | null>(null);
const weightLbs = ref<number | null>(null);

// BMI category
const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { key: 'underweight' as const, color: '#3b82f6', icon: '📉' };
  if (bmi < 24.9) return { key: 'normal' as const, color: '#22c55e', icon: '✓' };
  if (bmi < 29.9) return { key: 'overweight' as const, color: '#f59e0b', icon: '⚠️' };
  return { key: 'obese' as const, color: '#ef4444', icon: '🔴' };
};

// BMI calculation
const result = computed(() => {
  let weightKg: number | null = null;
  let heightM: number | null = null;

  if (unitSystem.value === 'metric') {
    weightKg = weight.value;
    heightM = height.value ? height.value / 100 : null;
  } else {
    weightKg = weightLbs.value ? weightLbs.value * 0.453592 : null;
    const totalInches = (heightFeet.value || 0) * 12 + (heightInches.value || 0);
    heightM = totalInches * 0.0254;
  }

  if (!weightKg || !heightM || heightM <= 0) return null;

  const bmi = weightKg / (heightM * heightM);
  const category = getBMICategory(bmi);
  const minHealthyWeight = 18.5 * heightM * heightM;
  const maxHealthyWeight = 24.9 * heightM * heightM;
  const idealLower = 18.5 * heightM * heightM;
  const idealUpper = 22 * heightM * heightM;

  return {
    bmi: bmi.toFixed(1),
    bmiNum: bmi,
    category,
    minHealthyWeight: minHealthyWeight.toFixed(1),
    maxHealthyWeight: maxHealthyWeight.toFixed(1),
    idealLower: idealLower.toFixed(1),
    idealUpper: idealUpper.toFixed(1),
    weightDiff: weightKg < minHealthyWeight
      ? { type: 'gain' as const, amount: (minHealthyWeight - weightKg).toFixed(1) }
      : weightKg > maxHealthyWeight
        ? { type: 'lose' as const, amount: (weightKg - maxHealthyWeight).toFixed(1) }
        : null,
    unitSystem: unitSystem.value,
  };
});

// Reset
function resetForm() {
  weight.value = null;
  height.value = null;
  heightFeet.value = null;
  heightInches.value = null;
  weightLbs.value = null;
}

// Copy
const justCopied = ref(false);
function copyResult() {
  if (!result.value) return;
  const text = lang.value === 'zh'
    ? `BMI: ${result.value.bmi} (${labels.zh[result.value.category.key]})`
    : `BMI: ${result.value.bmi} (${labels.en[result.value.category.key]})`;
  navigator.clipboard.writeText(text);
  justCopied.value = true;
  setTimeout(() => { justCopied.value = false; }, 1500);
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 800px">
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
            <div text-lg font-bold mb-4>⚙️ {{ t('title').value }}</div>

            <!-- Unit System Toggle -->
            <div mb-4>
              <n-button-group style="width: 100%">
                <n-button
                  :type="unitSystem === 'metric' ? 'primary' : 'default'"
                  style="flex: 1"
                  @click="unitSystem = 'metric'"
                >
                  {{ t('metric').value }}
                </n-button>
                <n-button
                  :type="unitSystem === 'imperial' ? 'primary' : 'default'"
                  style="flex: 1"
                  @click="unitSystem = 'imperial'"
                >
                  {{ t('imperial').value }}
                </n-button>
              </n-button-group>
            </div>

            <!-- Metric Input -->
            <template v-if="unitSystem === 'metric'">
              <div mb-4>
                <div mb-1 text-sm op-70>{{ t('weight').value }}</div>
                <n-input-number
                  v-model:value="weight"
                  :min="1"
                  :max="500"
                  :step="0.1"
                  size="large"
                  :placeholder="t('inputWeight').value + ' (kg)'"
                  style="width: 100%"
                >
                  <template #suffix>kg</template>
                </n-input-number>
              </div>
              <div>
                <div mb-1 text-sm op-70>{{ t('height').value }}</div>
                <n-input-number
                  v-model:value="height"
                  :min="50"
                  :max="300"
                  :step="1"
                  size="large"
                  :placeholder="t('inputHeight').value + ' (cm)'"
                  style="width: 100%"
                >
                  <template #suffix>cm</template>
                </n-input-number>
              </div>
            </template>

            <!-- Imperial Input -->
            <template v-else>
              <div mb-4>
                <div mb-1 text-sm op-70>{{ t('weight').value }}</div>
                <n-input-number
                  v-model:value="weightLbs"
                  :min="1"
                  :max="1000"
                  :step="1"
                  size="large"
                  :placeholder="t('inputWeight').value + ' (lbs)'"
                  style="width: 100%"
                >
                  <template #suffix>lbs</template>
                </n-input-number>
              </div>
              <div>
                <div mb-1 text-sm op-70>{{ t('height').value }}</div>
                <n-grid :cols="2" :x-gap="12">
                  <n-gi>
                    <n-input-number
                      v-model:value="heightFeet"
                      :min="1"
                      :max="9"
                      size="large"
                      :placeholder="t('feet').value"
                      style="width: 100%"
                    >
                      <template #suffix>ft</template>
                    </n-input-number>
                  </n-gi>
                  <n-gi>
                    <n-input-number
                      v-model:value="heightInches"
                      :min="0"
                      :max="11"
                      size="large"
                      :placeholder="t('inches').value"
                      style="width: 100%"
                    >
                      <template #suffix>in</template>
                    </n-input-number>
                  </n-gi>
                </n-grid>
              </div>
            </template>

            <!-- Reset Button -->
            <div flex justify-center mt-4>
              <n-button quaternary round @click="resetForm">
                <template #icon><n-icon><Refresh /></n-icon></template>
                {{ t('reset').value }}
              </n-button>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Results -->
        <n-gi span="24 m:12">
          <!-- Result Card -->
          <c-card v-if="result" mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('result').value }}</div>

            <!-- BMI Big Number -->
            <div text-center mb-6>
              <div text-6xl font-bold :style="{ color: result.category.color }">
                {{ result.bmi }}
              </div>
              <div mt-2 text-lg :style="{ color: result.category.color }">
                {{ result.category.icon }} {{ t(result.category.key).value }}
              </div>
            </div>

            <!-- BMI Scale Visualization -->
            <div mb-6>
              <div relative h-4 rounded-full overflow-hidden style="background: rgba(255,255,255,0.05);">
                <div absolute inset-0 style="background: linear-gradient(to right, #3b82f6 0%, #3b82f6 28%, #22c55e 28%, #22c55e 50%, #f59e0b 50%, #f59e0b 72%, #ef4444 72%, #ef4444 100%); border-radius: 9999px;"></div>
                <!-- Indicator -->
                <div
                  absolute top="-4px"
                  h-6 w-1.5
                  bg-white
                  rounded-full
                  shadow-lg
                  :style="{
                    left: `calc(${Math.min(98, Math.max(2, (result.bmiNum - 10) * 2.5))}% - 3px)`,
                    transition: 'left 0.3s ease',
                    boxShadow: '0 0 12px rgba(255,255,255,0.5)',
                  }"
                />
              </div>
              <div flex justify-between mt-2 text-xs op-50>
                <span>10</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>50+</span>
              </div>
            </div>

            <!-- Healthy Weight Range -->
            <div p-4 rounded-xl mb-4 style="background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08)); border: 1px solid rgba(34,197,94,0.25);">
              <div text-sm op-70 mb-2>{{ t('healthyRange').value }}</div>
              <div text-xl font-bold>{{ result.minHealthyWeight }} - {{ result.maxHealthyWeight }} kg</div>
              <div v-if="result.weightDiff" mt-2 text-sm>
                <template v-if="result.weightDiff.type === 'gain'">
                  <span op-70>{{ t('needGain').value }}</span>
                  <span font-bold text-blue-400 ml-1>{{ result.weightDiff.amount }} kg</span>
                </template>
                <template v-else>
                  <span op-70>{{ t('needLose').value }}</span>
                  <span font-bold text-orange-400 ml-1>{{ result.weightDiff.amount }} kg</span>
                </template>
              </div>
              <div v-else mt-2 text-sm text-green-400>
                ✓ {{ t('inRange').value }}
              </div>
            </div>

            <!-- Copy Button -->
            <div flex justify-center>
              <n-button size="small" round quaternary @click="copyResult">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ justCopied ? t('copied').value : t('bmi').value }}
              </n-button>
            </div>
          </c-card>

          <!-- Empty State -->
          <c-card v-else mb-4>
            <div text-center py-8>
              <div text-4xl mb-3>💪</div>
              <div text-sm op-50>{{ lang === 'zh' ? '输入体重和身高开始计算' : 'Enter weight and height to calculate' }}</div>
            </div>
          </c-card>

          <!-- Info Card -->
          <c-card mb-4>
            <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <div text-sm op-70 mb-2>{{ t('whatIsBMI').value }}</div>
                  <div text-xs leading-relaxed op-60>{{ t('bmiDesc').value }}</div>
                </div>
              </n-gi>
              <n-gi span="2 m:1">
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <div text-sm op-70 mb-2>{{ t('formula').value }}</div>
                  <div text-sm font-mono op-80>BMI = kg / m²</div>
                  <div mt-1 text-xs leading-relaxed op-60>{{ t('bmiFormula').value }}</div>
                </div>
              </n-gi>
            </n-grid>
          </c-card>

          <!-- Reference Table -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>📋 {{ t('referenceTable').value }}</div>
            <div flex flex-col gap-2>
              <div v-for="item in [
                { key: 'underweight', range: '< 18.5', risk: t('underweightRisk').value, color: '#3b82f6', icon: '📉' },
                { key: 'normal', range: '18.5 - 24.9', risk: t('normalRisk').value, color: '#22c55e', icon: '✓' },
                { key: 'overweight', range: '25 - 29.9', risk: t('overweightRisk').value, color: '#f59e0b', icon: '⚠️' },
                { key: 'obese', range: '≥ 30', risk: t('obeseRisk').value, color: '#ef4444', icon: '🔴' },
              ]" :key="item.key" flex justify-between items-center p-3 rounded-lg style="background: rgba(255,255,255,0.03);">
                <div>
                  <span :style="{ color: item.color }" text-sm font-bold>{{ item.icon }} {{ t(item.key as keyof typeof labels.zh).value }}</span>
                </div>
                <div text-sm font-mono op-80>{{ item.range }}</div>
                <div text-xs op-50 style="max-width: 140px;">{{ item.risk }}</div>
              </div>
            </div>
          </c-card>

          <!-- Notice -->
          <c-card>
            <div p-3 rounded-lg style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
              <div text-sm text-amber-400 mb-1>⚠️ {{ t('notice').value }}</div>
              <div text-xs op-70>{{ t('noticeContent').value }}</div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
</style>
