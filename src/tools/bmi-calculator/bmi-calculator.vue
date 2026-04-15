<script setup lang="ts">
import { computed, ref } from 'vue';

const { t } = useI18n();

// 输入参数
const weight = ref<number | null>(null);
const height = ref<number | null>(null);
const unitSystem = ref<'metric' | 'imperial'>('metric');

// 身高英制输入（英尺 + 英寸）
const heightFeet = ref<number | null>(null);
const heightInches = ref<number | null>(null);

// 体重英制输入（磅）
const weightLbs = ref<number | null>(null);

// BMI 分类标准
const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { key: 'underweight', color: '#3b82f6', icon: '📉' };
  if (bmi < 24.9) return { key: 'normal', color: '#22c55e', icon: '✓' };
  if (bmi < 29.9) return { key: 'overweight', color: '#f59e0b', icon: '⚠️' };
  return { key: 'obese', color: '#ef4444', icon: '🔴' };
};

// 计算BMI
const result = computed(() => {
  let weightKg: number | null = null;
  let heightM: number | null = null;

  if (unitSystem.value === 'metric') {
    weightKg = weight.value;
    heightM = height.value ? height.value / 100 : null;
  } else {
    // 英制转公制
    weightKg = weightLbs.value ? weightLbs.value * 0.453592 : null;
    const totalInches = (heightFeet.value || 0) * 12 + (heightInches.value || 0);
    heightM = totalInches * 0.0254;
  }

  if (!weightKg || !heightM || heightM <= 0) {
    return null;
  }

  const bmi = weightKg / (heightM * heightM);
  const category = getBMICategory(bmi);

  // 计算健康体重范围
  const minHealthyWeight = 18.5 * heightM * heightM;
  const maxHealthyWeight = 24.9 * heightM * heightM;

  // 计算理想体重（使用 Devine 公式）
  const idealWeightLower = 18.5 * heightM * heightM;
  const idealWeightUpper = 22 * heightM * heightM;

  return {
    bmi: bmi.toFixed(1),
    category,
    minHealthyWeight: minHealthyWeight.toFixed(1),
    maxHealthyWeight: maxHealthyWeight.toFixed(1),
    idealWeightLower: idealWeightLower.toFixed(1),
    idealWeightUpper: idealWeightUpper.toFixed(1),
    weightDiff: weightKg < minHealthyWeight
      ? { type: 'gain', amount: (minHealthyWeight - weightKg).toFixed(1) }
      : weightKg > maxHealthyWeight
        ? { type: 'lose', amount: (weightKg - maxHealthyWeight).toFixed(1) }
        : null,
    unitSystem: unitSystem.value,
  };
});

// 切换单位制
function toggleUnitSystem() {
  unitSystem.value = unitSystem.value === 'metric' ? 'imperial' : 'metric';
  // 清空输入
  weight.value = null;
  height.value = null;
  heightFeet.value = null;
  heightInches.value = null;
  weightLbs.value = null;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 700px">
      <!-- 输入参数卡片 -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('tools.bmi-calculator.parameters') }}</div>

        <!-- 单位制切换 -->
        <div mb-4>
          <n-button-group style="width: 100%">
            <n-button
              :type="unitSystem === 'metric' ? 'primary' : 'default'"
              style="flex: 1"
              @click="unitSystem = 'metric'"
            >
              {{ t('tools.bmi-calculator.metric') }}
            </n-button>
            <n-button
              :type="unitSystem === 'imperial' ? 'primary' : 'default'"
              style="flex: 1"
              @click="unitSystem = 'imperial'"
            >
              {{ t('tools.bmi-calculator.imperial') }}
            </n-button>
          </n-button-group>
        </div>

        <!-- 公制输入 -->
        <template v-if="unitSystem === 'metric'">
          <!-- 体重输入 -->
          <div mb-4>
            <div mb-1 text-sm op-70>{{ t('tools.bmi-calculator.weight') }}</div>
            <n-input-number
              v-model:value="weight"
              :min="1"
              :max="500"
              :step="0.1"
              size="large"
              :placeholder="t('tools.bmi-calculator.weightPlaceholder')"
              style="width: 100%"
            >
              <template #suffix>kg</template>
            </n-input-number>
          </div>

          <!-- 身高输入 -->
          <div>
            <div mb-1 text-sm op-70>{{ t('tools.bmi-calculator.height') }}</div>
            <n-input-number
              v-model:value="height"
              :min="50"
              :max="300"
              :step="1"
              size="large"
              :placeholder="t('tools.bmi-calculator.heightPlaceholder')"
              style="width: 100%"
            >
              <template #suffix>cm</template>
            </n-input-number>
          </div>
        </template>

        <!-- 英制输入 -->
        <template v-else>
          <!-- 体重输入 -->
          <div mb-4>
            <div mb-1 text-sm op-70>{{ t('tools.bmi-calculator.weight') }}</div>
            <n-input-number
              v-model:value="weightLbs"
              :min="1"
              :max="1000"
              :step="1"
              size="large"
              :placeholder="t('tools.bmi-calculator.weightPlaceholderImperial')"
              style="width: 100%"
            >
              <template #suffix>lbs</template>
            </n-input-number>
          </div>

          <!-- 身高输入（英尺+英寸） -->
          <div>
            <div mb-1 text-sm op-70>{{ t('tools.bmi-calculator.height') }}</div>
            <n-grid :cols="2" :x-gap="12">
              <n-gi>
                <n-input-number
                  v-model:value="heightFeet"
                  :min="1"
                  :max="9"
                  size="large"
                  :placeholder="t('tools.bmi-calculator.feet')"
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
                  :placeholder="t('tools.bmi-calculator.inches')"
                  style="width: 100%"
                >
                  <template #suffix>in</template>
                </n-input-number>
              </n-gi>
            </n-grid>
          </div>
        </template>
      </c-card>

      <!-- 结果展示 -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ t('tools.bmi-calculator.result') }}</div>

        <!-- BMI 大数字显示 -->
        <div text-center mb-6>
          <div text-6xl font-bold :style="{ color: result.category.color }">
            {{ result.bmi }}
          </div>
          <div mt-2 text-lg :style="{ color: result.category.color }">
            {{ result.category.icon }} {{ t(`tools.bmi-calculator.categories.${result.category.key}`) }}
          </div>
        </div>

        <!-- BMI 量表可视化 -->
        <div mb-6>
          <div relative h-3 rounded-full overflow-hidden bg-dark-200>
            <!-- 渐变背景 -->
            <div absolute inset-0 style="background: linear-gradient(to right, #3b82f6 0%, #3b82f6 25%, #22c55e 25%, #22c55e 50%, #f59e0b 50%, #f59e0b 75%, #ef4444 75%, #ef4444 100%);"></div>
            <!-- 指示器 -->
            <div
              absolute
              top="-8px"
              h-5
              w-1
              bg-white
              rounded-full
              shadow-lg
              :style="{ left: `calc(${Math.min(100, Math.max(0, (parseFloat(result.bmi) - 10) * 2.5))}% - 2px)`, transition: 'left 0.3s ease' }"
            ></div>
          </div>
          <div flex justify-between mt-2 text-xs op-60>
            <span>10</span>
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
            <span>50+</span>
          </div>
        </div>

        <!-- 健康体重范围 -->
        <div p-4 rounded-xl bg-gradient-primary mb-4>
          <div text-sm op-80 mb-2>{{ t('tools.bmi-calculator.healthyWeightRange') }}</div>
          <div text-xl font-bold>
            {{ result.minHealthyWeight }} - {{ result.maxHealthyWeight }} kg
          </div>
          <div v-if="result.weightDiff" mt-2 text-sm>
            <template v-if="result.weightDiff.type === 'gain'">
              <span op-70>{{ t('tools.bmi-calculator.needToGain') }}</span>
              <span font-bold text-blue-400 ml-1>{{ result.weightDiff.amount }} kg</span>
            </template>
            <template v-else>
              <span op-70>{{ t('tools.bmi-calculator.needToLose') }}</span>
              <span font-bold text-orange-400 ml-1>{{ result.weightDiff.amount }} kg</span>
            </template>
          </div>
          <div v-else mt-2 text-sm text-green-400>
            ✓ {{ t('tools.bmi-calculator.inHealthyRange') }}
          </div>
        </div>

        <!-- 分类说明 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-sm op-70 mb-2>{{ t('tools.bmi-calculator.whatIsBMI') }}</div>
              <div text-xs leading-relaxed op-60>
                {{ t('tools.bmi-calculator.bmiExplanation') }}
              </div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-sm op-70 mb-2>{{ t('tools.bmi-calculator.formula') }}</div>
              <div text-xs font-mono op-80>
                BMI = kg / m²
              </div>
              <div mt-2 text-xs leading-relaxed op-60>
                {{ t('tools.bmi-calculator.formulaDesc') }}
              </div>
            </div>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- BMI 分类参考表 -->
      <c-card>
        <div text-lg font-bold mb-3>{{ t('tools.bmi-calculator.referenceTable') }}</div>
        <n-table :bordered="false" :single-line="false">
          <thead>
            <tr>
              <th>{{ t('tools.bmi-calculator.category') }}</th>
              <th>BMI</th>
              <th>{{ t('tools.bmi-calculator.healthRisk') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span style="color: #3b82f6">📉 {{ t('tools.bmi-calculator.categories.underweight') }}</span></td>
              <td>&lt; 18.5</td>
              <td>{{ t('tools.bmi-calculator.risks.underweight') }}</td>
            </tr>
            <tr>
              <td><span style="color: #22c55e">✓ {{ t('tools.bmi-calculator.categories.normal') }}</span></td>
              <td>18.5 - 24.9</td>
              <td>{{ t('tools.bmi-calculator.risks.normal') }}</td>
            </tr>
            <tr>
              <td><span style="color: #f59e0b">⚠️ {{ t('tools.bmi-calculator.categories.overweight') }}</span></td>
              <td>25 - 29.9</td>
              <td>{{ t('tools.bmi-calculator.risks.overweight') }}</td>
            </tr>
            <tr>
              <td><span style="color: #ef4444">🔴 {{ t('tools.bmi-calculator.categories.obese') }}</span></td>
              <td>≥ 30</td>
              <td>{{ t('tools.bmi-calculator.risks.obese') }}</td>
            </tr>
          </tbody>
        </n-table>

        <!-- 使用说明 -->
        <div mt-4>
          <div text-sm font-bold mb-2>{{ t('tools.bmi-calculator.howToUse') }}</div>
          <n-ul>
            <n-li>{{ t('tools.bmi-calculator.step1') }}</n-li>
            <n-li>{{ t('tools.bmi-calculator.step2') }}</n-li>
            <n-li>{{ t('tools.bmi-calculator.step3') }}</n-li>
          </n-ul>
        </div>

        <!-- 注意事项 -->
        <div mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30>
          <div text-sm text-yellow-400 mb-1>{{ t('tools.bmi-calculator.note') }}</div>
          <div text-xs op-70>{{ t('tools.bmi-calculator.noteContent') }}</div>
        </div>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.bg-dark-200 {
  background: rgba(255, 255, 255, 0.05);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1));
  border: 1px solid rgba(34, 197, 94, 0.3);
}
</style>
