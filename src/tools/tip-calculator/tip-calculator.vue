<script setup lang="ts">
import { computed, ref } from 'vue';

const { t } = useI18n();

// 账单金额输入
const billAmount = ref<number | null>(null);

// 小费百分比
const tipPercentage = ref<number>(15);

// 分享人数
const numberOfPeople = ref<number>(1);

// 预设小费百分比快捷按钮
const quickTipPercentages = [10, 15, 18, 20, 25];

// 计算结果
const result = computed(() => {
  if (!billAmount.value || billAmount.value <= 0) {
    return null;
  }

  const bill = billAmount.value;
  const tipPercent = tipPercentage.value || 0;
  const people = numberOfPeople.value || 1;

  const tipAmount = bill * (tipPercent / 100);
  const totalAmount = bill + tipAmount;
  const perPerson = totalAmount / people;
  const tipPerPerson = tipAmount / people;

  return {
    tipAmount: tipAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    perPerson: perPerson.toFixed(2),
    tipPerPerson: tipPerPerson.toFixed(2),
    billPerPerson: (bill / people).toFixed(2),
    tipPercentage: tipPercent,
    numberOfPeople: people,
  };
});

// 格式化货币
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 应用快捷小费百分比
function applyQuickTip(percent: number) {
  tipPercentage.value = percent;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 700px">
      <!-- 输入参数卡片 -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('tools.tip-calculator.parameters') }}</div>

        <!-- 账单金额输入 -->
        <div mb-4>
          <div mb-1 text-sm op-70>{{ t('tools.tip-calculator.billAmount') }}</div>
          <n-input-number
            v-model:value="billAmount"
            :min="0"
            :step="10"
            size="large"
            :placeholder="t('tools.tip-calculator.billPlaceholder')"
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </n-input-number>
        </div>

        <!-- 小费百分比输入 -->
        <div mb-4>
          <div mb-1 text-sm op-70>{{ t('tools.tip-calculator.tipPercentage') }}</div>
          <n-input-number
            v-model:value="tipPercentage"
            :min="0"
            :max="100"
            :step="1"
            size="large"
            :placeholder="t('tools.tip-calculator.percentPlaceholder')"
            style="width: 100%"
          >
            <template #suffix>%</template>
          </n-input-number>
        </div>

        <!-- 快捷小费按钮 -->
        <div mb-4>
          <div mb-2 text-sm op-70>{{ t('tools.tip-calculator.quickTips') }}</div>
          <div flex flex-wrap gap-2>
            <n-button
              v-for="percent in quickTipPercentages"
              :key="percent"
              size="small"
              :type="tipPercentage === percent ? 'primary' : 'default'"
              @click="applyQuickTip(percent)"
            >
              {{ percent }}%
            </n-button>
          </div>
        </div>

        <!-- 分享人数输入 -->
        <div>
          <div mb-1 text-sm op-70>{{ t('tools.tip-calculator.numberOfPeople') }}</div>
          <n-input-number
            v-model:value="numberOfPeople"
            :min="1"
            :max="100"
            size="large"
            style="width: 100%"
          >
            <template #suffix>{{ numberOfPeople > 1 ? t('tools.tip-calculator.people') : t('tools.tip-calculator.person') }}</template>
          </n-input-number>
        </div>
      </c-card>

      <!-- 结果展示 -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ t('tools.tip-calculator.result') }}</div>

        <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- 小费金额 -->
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-orange-fade border-orange>
              <div text-sm op-70 mb-1>
                {{ t('tools.tip-calculator.tipAmount') }}
                <n-tag size="small" type="warning">{{ result.tipPercentage }}%</n-tag>
              </div>
              <div text-xl font-bold text-orange-400>+¥{{ formatCurrency(result.tipAmount) }}</div>
            </div>
          </n-gi>

          <!-- 总金额 -->
          <n-gi span="2 m:1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-sm op-70 mb-1>{{ t('tools.tip-calculator.totalAmount') }}</div>
              <div text-xl font-bold>¥{{ formatCurrency(result.totalAmount) }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- 人均支付（大卡片） -->
        <div mt-4 p-6 rounded-xl bg-gradient-primary text-center>
          <div text-sm op-80 mb-2>{{ t('tools.tip-calculator.perPerson') }}</div>
          <div text-4xl font-bold>¥{{ formatCurrency(result.perPerson) }}</div>
          <div mt-2 text-sm op-70>
            {{ t('tools.tip-calculator.billPerPerson') }}: ¥{{ formatCurrency(result.billPerPerson) }}
            + {{ t('tools.tip-calculator.tipPerPerson') }}: ¥{{ formatCurrency(result.tipPerPerson) }}
          </div>
        </div>

        <!-- 人均明细（多人时显示） -->
        <div v-if="result.numberOfPeople > 1" mt-4>
          <n-grid :cols="2" :x-gap="12">
            <n-gi>
              <div p-3 rounded-lg bg-dark-200 text-center>
                <div text-xs op-60 mb-1>{{ t('tools.tip-calculator.billPerPerson') }}</div>
                <div text-lg font-semibold>¥{{ formatCurrency(result.billPerPerson) }}</div>
              </div>
            </n-gi>
            <n-gi>
              <div p-3 rounded-lg bg-dark-200 text-center>
                <div text-xs op-60 mb-1>{{ t('tools.tip-calculator.tipPerPerson') }}</div>
                <div text-lg font-semibold>¥{{ formatCurrency(result.tipPerPerson) }}</div>
              </div>
            </n-gi>
          </n-grid>
        </div>
      </c-card>

      <!-- 计算说明 -->
      <c-card>
        <div text-lg font-bold mb-3>{{ t('tools.tip-calculator.howToUse') }}</div>
        <n-ul>
          <n-li>{{ t('tools.tip-calculator.step1') }}</n-li>
          <n-li>{{ t('tools.tip-calculator.step2') }}</n-li>
          <n-li>{{ t('tools.tip-calculator.step3') }}</n-li>
        </n-ul>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.bg-dark-200 {
  background: rgba(255, 255, 255, 0.05);
}

.bg-orange-fade {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(251, 146, 60, 0.1));
}

.border-orange {
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2));
  border: 1px solid rgba(34, 197, 94, 0.3);
}
</style>
