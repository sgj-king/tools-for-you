<script setup lang="ts">
import { computed, ref } from 'vue';

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
        <div text-lg font-bold mb-4>{{ '参数设置' }}</div>

        <!-- 单位制切换 -->
        <div mb-4>
          <n-button-group style="width: 100%">
            <n-button
              :type="unitSystem === 'metric' ? 'primary' : 'default'"
              style="flex: 1"
              @click="unitSystem = 'metric'"
            >
              {{ '公制' }}
            </n-button>
            <n-button
              :type="unitSystem === 'imperial' ? 'primary' : 'default'"
              style="flex: 1"
              @click="unitSystem = 'imperial'"
            >
              {{ '英制' }}
            </n-button>
          </n-button-group>
        </div>

        <!-- 公制输入 -->
        <template v-if="unitSystem === 'metric'">
          <!-- 体重输入 -->
          <div mb-4>
            <div mb-1 text-sm op-70>{{ '体重' }}</div>
            <n-input-number
              v-model:value="weight"
              :min="1"
              :max="500"
              :step="0.1"
              size="large"
              :placeholder="'输入体重 (kg)'"
              style="width: 100%"
            >
              <template #suffix>kg</template>
            </n-input-number>
          </div>

          <!-- 身高输入 -->
          <div>
            <div mb-1 text-sm op-70>{{ '身高' }}</div>
            <n-input-number
              v-model:value="height"
              :min="50"
              :max="300"
              :step="1"
              size="large"
              :placeholder="'输入身高 (cm)'"
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
            <div mb-1 text-sm op-70>{{ '体重' }}</div>
            <n-input-number
              v-model:value="weightLbs"
              :min="1"
              :max="1000"
              :step="1"
              size="large"
              :placeholder="'输入体重 (lbs)'"
              style="width: 100%"
            >
              <template #suffix>lbs</template>
            </n-input-number>
          </div>

          <!-- 身高输入（英尺+英寸） -->
          <div>
            <div mb-1 text-sm op-70>{{ '身高' }}</div>
            <n-grid :cols="2" :x-gap="12">
              <n-gi>
                <n-input-number
                  v-model:value="heightFeet"
                  :min="1"
                  :max="9"
                  size="large"
                  :placeholder="'英尺'"
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
                  :placeholder="'英寸'"
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
        <div text-lg font-bold mb-4>{{ '计算结果' }}</div>

        <!-- BMI 大数字显示 -->
        <div text-center mb-6>
          <div text-6xl font-bold :style="{ color: result.category.color }">
            {{ result.bmi }}
          </div>
          <div mt-2 text-lg :style="{ color: result.category.color }">
            {{ result.category.icon }} {{ result.category.name }}
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
          <div text-sm op-80 mb-2>{{ '健康体重范围' }}</div>
          <div text-xl font-bold>
            {{ result.minHealthyWeight }} - {{ result.maxHealthyWeight }} kg
          </div>
          <div v-if="result.weightDiff" mt-2 text-sm>
            <template v-if="result.weightDiff.type === 'gain'">
              <span op-70>{{ '需要增重' }}</span>
              <span font-bold text-blue-400 ml-1>{{ result.weightDiff.amount }} kg</span>
            </template>
            <template v-else>
              <span op-70>{{ '需要减重' }}</span>
              <span font-bold text-orange-400 ml-1>{{ result.weightDiff.amount }} kg</span>
            </template>
          </div>
          <div v-else mt-2 text-sm text-green-400>
            ✓ {{ '在健康范围内' }}
          </div>
        </div>

        <!-- 分类说明 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-sm op-70 mb-2>{{ '什么是 BMI？' }}</div>
              <div text-xs leading-relaxed op-60>
                {{ 'BMI（身体质量指数）是根据体重和身高计算的数值，用于评估体重是否健康。' }}
              </div>
            </div>
          </n-gi>
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-sm op-70 mb-2>{{ '公式' }}</div>
              <div text-xs font-mono op-80>
                BMI = kg / m²
              </div>
              <div mt-2 text-xs leading-relaxed op-60>
                {{ 'BMI = 体重(kg) / 身高(m)²' }}
              </div>
            </div>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- BMI 分类参考表 -->
      <c-card>
        <div text-lg font-bold mb-3>{{ '参考表' }}</div>
        <n-table :bordered="false" :single-line="false">
          <thead>
            <tr>
              <th>{{ '分类' }}</th>
              <th>BMI</th>
              <th>{{ '健康风险' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span style="color: #3b82f6">📉 {{ '偏瘦' }}</span></td>
              <td>&lt; 18.5</td>
              <td>{{ '营养不良风险' }}</td>
            </tr>
            <tr>
              <td><span style="color: #22c55e">✓ {{ '正常' }}</span></td>
              <td>18.5 - 24.9</td>
              <td>{{ '健康风险较低' }}</td>
            </tr>
            <tr>
              <td><span style="color: #f59e0b">⚠️ {{ '超重' }}</span></td>
              <td>25 - 29.9</td>
              <td>{{ '有一定健康风险' }}</td>
            </tr>
            <tr>
              <td><span style="color: #ef4444">🔴 {{ '肥胖' }}</span></td>
              <td>≥ 30</td>
              <td>{{ '心血管疾病、糖尿病风险高' }}</td>
            </tr>
          </tbody>
        </n-table>

        <!-- 使用说明 -->
        <div mt-4>
          <div text-sm font-bold mb-2>{{ '使用说明' }}</div>
          <n-ul>
            <n-li>{{ '1. 选择单位制（公制/英制）' }}</n-li>
            <n-li>{{ '2. 输入您的体重和身高' }}</n-li>
            <n-li>{{ '3. 查看计算结果和健康建议' }}</n-li>
          </n-ul>
        </div>

        <!-- 注意事项 -->
        <div mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30>
          <div text-sm text-yellow-400 mb-1>{{ '注意' }}</div>
          <div text-xs op-70>{{ 'BMI 仅作为参考指标，不能完全反映健康状况' }}</div>
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
