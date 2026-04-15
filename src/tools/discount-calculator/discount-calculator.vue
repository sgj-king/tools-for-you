<script setup lang="ts">
import { computed, ref } from 'vue';

// 原价输入
const originalPrice = ref<number | null>(null);

// 折扣类型选择
const discountType = ref<'percentage' | 'fixed'>('percentage');

// 折扣值
const discountPercentage = ref<number | null>(null);
const discountFixed = ref<number | null>(null);

// 数量
const quantity = ref<number>(1);

// 折扣类型选项
const discountTypeOptions = [
  { label: 'tools.discount-calculator.percentageOff', value: 'percentage' },
  { label: 'tools.discount-calculator.fixedAmount', value: 'fixed' },
];

// 计算结果
const result = computed(() => {
  if (!originalPrice.value || originalPrice.value <= 0) {
    return null;
  }

  const price = originalPrice.value;
  const qty = quantity.value || 1;
  const subtotal = price * qty;

  let discountAmount = 0;
  let finalPrice = 0;
  let savedAmount = 0;

  if (discountType.value === 'percentage') {
    if (!discountPercentage.value || discountPercentage.value < 0 || discountPercentage.value > 100) {
      return { subtotal, discountAmount: 0, finalPrice: subtotal, savedAmount: 0, discountRate: '0%' };
    }
    discountAmount = price * (discountPercentage.value / 100);
    finalPrice = (price - discountAmount) * qty;
    savedAmount = discountAmount * qty;
    return {
      subtotal,
      discountAmount: discountAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      savedAmount: savedAmount.toFixed(2),
      discountRate: `${discountPercentage.value}%`,
    };
  } else {
    if (!discountFixed.value || discountFixed.value < 0) {
      return { subtotal, discountAmount: 0, finalPrice: subtotal, savedAmount: 0, discountRate: '¥0' };
    }
    discountAmount = discountFixed.value;
    const priceAfterDiscount = Math.max(0, price - discountAmount);
    finalPrice = priceAfterDiscount * qty;
    savedAmount = discountAmount * qty;
    const effectivePercentage = (discountAmount / price * 100).toFixed(1);
    return {
      subtotal,
      discountAmount: discountAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      savedAmount: savedAmount.toFixed(2),
      discountRate: `¥${discountFixed.value}`,
      effectivePercentage: `${effectivePercentage}%`,
    };
  }
});

// 格式化货币
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 预设折扣快捷按钮
const quickDiscounts = [10, 20, 30, 50, 70, 80];

// 应用快捷折扣
function applyQuickDiscount(percent: number) {
  discountType.value = 'percentage';
  discountPercentage.value = percent;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 700px">
      <!-- 输入参数卡片 -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ 'tools.discount-calculator.parameters' }}</div>
        
        <!-- 原价输入 -->
        <div mb-4>
          <div mb-1 text-sm op-70>{{ 'tools.discount-calculator.originalPrice' }}</div>
          <n-input-number
            v-model:value="originalPrice"
            :min="0"
            :step="10"
            size="large"
            :placeholder="'tools.discount-calculator.pricePlaceholder'"
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <!-- 折扣类型选择 -->
        <div mb-4>
          <div mb-1 text-sm op-70>{{ 'tools.discount-calculator.discountType' }}</div>
          <n-radio-group v-model:value="discountType" style="width: 100%">
            <n-radio-button
              v-for="option in discountTypeOptions"
              :key="option.value"
              :value="option.value"
              style="flex: 1"
            >
              {{ option.label }}
            </n-radio-button>
          </n-radio-group>
        </div>

        <!-- 折扣值输入 -->
        <div mb-4>
          <div mb-1 text-sm op-70>
            {{ discountType === 'percentage' 
              ? 'tools.discount-calculator.discountPercentage' 
              : 'tools.discount-calculator.discountAmount' }}
          </div>
          
          <!-- 百分比折扣输入 -->
          <n-input-number
            v-if="discountType === 'percentage'"
            v-model:value="discountPercentage"
            :min="0"
            :max="100"
            :step="5"
            size="large"
            :placeholder="'tools.discount-calculator.percentPlaceholder'"
            style="width: 100%"
          >
            <template #suffix>%</template>
          </n-input-number>
          
          <!-- 固定金额折扣输入 -->
          <n-input-number
            v-else
            v-model:value="discountFixed"
            :min="0"
            :step="10"
            size="large"
            :placeholder="'tools.discount-calculator.amountPlaceholder'"
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <!-- 快捷折扣按钮 (仅百分比模式) -->
        <div v-if="discountType === 'percentage'" mb-4>
          <div mb-2 text-sm op-70>{{ 'tools.discount-calculator.quickDiscounts' }}</div>
          <div flex flex-wrap gap-2>
            <n-button
              v-for="percent in quickDiscounts"
              :key="percent"
              size="small"
              :type="discountPercentage === percent ? 'primary' : 'default'"
              @click="applyQuickDiscount(percent)"
            >
              {{ percent }}%
            </n-button>
          </div>
        </div>

        <!-- 数量输入 -->
        <div>
          <div mb-1 text-sm op-70>{{ 'tools.discount-calculator.quantity' }}</div>
          <n-input-number
            v-model:value="quantity"
            :min="1"
            :max="999"
            size="large"
            style="width: 100%"
          />
        </div>
      </c-card>

      <!-- 结果展示 -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ 'tools.discount-calculator.result' }}</div>
        
        <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- 原价小计 -->
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-sm op-70 mb-1>{{ 'tools.discount-calculator.subtotal' }}</div>
              <div text-xl font-bold>¥{{ formatCurrency(result.subtotal) }}</div>
            </div>
          </n-gi>
          
          <!-- 折扣金额 -->
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-red-fade border-red>
              <div text-sm op-70 mb-1>
                {{ 'tools.discount-calculator.youSave' }}
                <n-tag size="small" type="error">{{ result.discountRate }}</n-tag>
              </div>
              <div text-xl font-bold text-red-400>-¥{{ formatCurrency(result.savedAmount) }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- 最终价格（大卡片） -->
        <div mt-4 p-6 rounded-xl bg-gradient-primary text-center>
          <div text-sm op-80 mb-2>{{ 'tools.discount-calculator.finalPrice' }}</div>
          <div text-4xl font-bold>¥{{ formatCurrency(result.finalPrice) }}</div>
          <div v-if="result.effectivePercentage" mt-2>
            <n-tag type="success" size="small">
              {{ 'tools.discount-calculator.effectiveDiscount' }}: {{ result.effectivePercentage }}
            </n-tag>
          </div>
        </div>

        <!-- 单价显示 -->
        <div v-if="quantity > 1" mt-4 text-center>
          <n-text depth="3">
            {{ 'tools.discount-calculator.unitPrice' }}: ¥{{ formatCurrency(result.finalPrice / quantity) }}
          </n-text>
        </div>
      </c-card>

      <!-- 计算说明 -->
      <c-card>
        <div text-lg font-bold mb-3>{{ 'tools.discount-calculator.howToUse' }}</div>
        <n-ul>
          <n-li>{{ 'tools.discount-calculator.step1' }}</n-li>
          <n-li>{{ 'tools.discount-calculator.step2' }}</n-li>
          <n-li>{{ 'tools.discount-calculator.step3' }}</n-li>
        </n-ul>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.bg-dark-200 {
  background: rgba(255, 255, 255, 0.05);
}

.bg-red-fade {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
}

.border-red {
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2));
  border: 1px solid rgba(34, 197, 94, 0.3);
}
</style>
