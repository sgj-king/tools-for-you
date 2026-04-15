<script setup lang="ts">
import { computed, ref } from 'vue';

// 输入参数
const loanAmount = ref<number | null>(null);
const annualRate = ref<number | null>(null);
const loanTerm = ref<number | null>(null);
const termUnit = ref<'years' | 'months'>('years');
const downPayment = ref<number>(0);

// 计算结果
const result = computed(() => {
  if (!loanAmount.value || !annualRate.value || !loanTerm.value) {
    return null;
  }

  const principal = loanAmount.value - (downPayment.value || 0);
  if (principal <= 0) return null;

  const months = termUnit.value === 'years' ? loanTerm.value * 12 : loanTerm.value;
  const monthlyRate = annualRate.value / 100 / 12;

  // EMI 公式: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
  let monthlyPayment: number;
  let totalPayment: number;
  let totalInterest: number;

  if (monthlyRate === 0) {
    // 无利率情况
    monthlyPayment = principal / months;
    totalPayment = principal;
    totalInterest = 0;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyPayment = principal * monthlyRate * factor / (factor - 1);
    totalPayment = monthlyPayment * months;
    totalInterest = totalPayment - principal;
  }

  return {
    principal: principal.toFixed(2),
    monthlyPayment: monthlyPayment.toFixed(2),
    totalPayment: totalPayment.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
    totalAmount: (principal + totalInterest).toFixed(2),
    interestRatio: ((totalInterest / principal) * 100).toFixed(1),
    months,
  };
});

// 还款明细
const paymentSchedule = computed(() => {
  if (!result.value || !loanAmount.value || !annualRate.value) {
    return [];
  }

  const principal = loanAmount.value - (downPayment.value || 0);
  const monthlyRate = annualRate.value / 100 / 12;
  const months = result.value.months;
  const monthlyPayment = parseFloat(result.value.monthlyPayment);

  const schedule = [];
  let remainingBalance = principal;

  for (let month = 1; month <= months; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    schedule.push({
      month,
      payment: monthlyPayment.toFixed(2),
      principal: principalPayment.toFixed(2),
      interest: interestPayment.toFixed(2),
      balance: remainingBalance.toFixed(2),
    });

    // 只显示前12个月和后12个月
    if (months > 24 && month > 12 && month <= months - 12) {
      continue;
    }
  }

  return schedule;
});

// 格式化货币
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 期限单位选项
const termUnitOptions = [
  { label: '年', value: 'years' },
  { label: '月', value: 'months' },
];

// 是否显示省略提示
const showEllipsis = computed(() => {
  return result.value && result.value.months > 24;
});
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- 输入参数卡片 -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ '参数' }}</div>
        <n-grid :cols="2" :x-gap="16" :y-gap="12" responsive="screen" item-responsive>
          <!-- 贷款金额 -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '贷款金额' }}</div>
            <n-input-number
              v-model:value="loanAmount"
              :min="0"
              :step="10000"
              size="large"
              :placeholder="'输入贷款金额'"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>

          <!-- 首付金额 -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '首付' }}</div>
            <n-input-number
              v-model:value="downPayment"
              :min="0"
              :step="10000"
              size="large"
              :placeholder="'输入首付金额'"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>

          <!-- 年利率 -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '年利率' }}</div>
            <n-input-number
              v-model:value="annualRate"
              :min="0"
              :max="100"
              :step="0.1"
              :precision="2"
              size="large"
              :placeholder="'输入年利率'"
              style="width: 100%"
            >
              <template #suffix>%</template>
            </n-input-number>
          </n-gi>

          <!-- 贷款期限 -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '贷款期限 (年)' }}</div>
            <n-input-group>
              <n-input-number
                v-model:value="loanTerm"
                :min="1"
                :max="600"
                size="large"
                :placeholder="'输入贷款期限'"
                style="flex: 1"
              />
              <n-select
                v-model:value="termUnit"
                :options="termUnitOptions"
                size="large"
                style="width: 100px"
              />
            </n-input-group>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- 结果展示 -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ '结果' }}</div>

        <!-- 核心数据 -->
        <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- 月供 -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-primary-fade border-primary>
              <div text-sm op-70 mb-1>{{ '月还款额' }}</div>
              <div text-3xl font-bold text-primary>¥{{ formatCurrency(result.monthlyPayment) }}</div>
              <div text-xs op-50 mt-1>{{ '每月' }}</div>
            </div>
          </n-gi>

          <!-- 总利息 -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-orange-fade border-orange>
              <div text-sm op-70 mb-1>{{ '总利息' }}</div>
              <div text-3xl font-bold text-orange-400>¥{{ formatCurrency(result.totalInterest) }}</div>
              <div text-xs op-50 mt-1>{{ '利息占比' }}: {{ result.interestRatio }}%</div>
            </div>
          </n-gi>

          <!-- 还款总额 -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-green-fade border-green>
              <div text-sm op-70 mb-1>{{ '总还款额' }}</div>
              <div text-3xl font-bold text-green-400>¥{{ formatCurrency(result.totalPayment) }}</div>
              <div text-xs op-50 mt-1>{{ '总月数' }}: {{ result.months }} {{ '个月' }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- 贷款本金信息 -->
        <div mt-4 p-4 rounded-lg bg-dark-100>
          <n-grid :cols="2" :x-gap="12">
            <n-gi>
              <div text-sm op-70>{{ '本金' }}</div>
              <div text-lg font-bold>¥{{ formatCurrency(result.principal) }}</div>
            </n-gi>
            <n-gi>
              <div text-sm op-70>{{ '已付首付' }}</div>
              <div text-lg font-bold>¥{{ formatCurrency(downPayment || 0) }}</div>
            </n-gi>
          </n-grid>
        </div>
      </c-card>

      <!-- 还款明细表格 -->
      <c-card v-if="paymentSchedule.length > 0">
        <div text-lg font-bold mb-4>{{ '还款计划' }}</div>
        <n-scrollbar style="max-height: 400px">
          <n-table :bordered="false" :single-line="false" size="small">
            <thead>
              <tr>
                <th>{{ '期数' }}</th>
                <th>{{ '还款额' }}</th>
                <th>{{ '本金' }}</th>
                <th>{{ '利息' }}</th>
                <th>{{ '剩余本金' }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(row, index) in paymentSchedule" :key="row.month">
                <!-- 省略提示 -->
                <tr v-if="showEllipsis && index === 12" bg-opacity-10>
                  <td colspan="5" text-center op-50 py-2>
                    <n-divider>{{ '...' }}</n-divider>
                  </td>
                </tr>
                <tr>
                  <td font-bold>{{ row.month }}</td>
                  <td>¥{{ formatCurrency(row.payment) }}</td>
                  <td text-blue-400>¥{{ formatCurrency(row.principal) }}</td>
                  <td text-orange-400>¥{{ formatCurrency(row.interest) }}</td>
                  <td>¥{{ formatCurrency(row.balance) }}</td>
                </tr>
              </template>
            </tbody>
          </n-table>
        </n-scrollbar>
      </c-card>

      <!-- 公式说明 -->
      <c-card mt-4>
        <div text-lg font-bold mb-3>{{ '计算公式' }}</div>
        <div p-4 rounded-lg bg-dark op-90 font-mono text-sm>
          <div>EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)</div>
          <div mt-2 text-sm op-70>
            {{ '等额本息还款方式' }}
          </div>
        </div>
      </c-card>

      <!-- 使用提示 -->
      <c-card mt-4>
        <div text-lg font-bold mb-3>{{ '小提示' }}</div>
        <n-ul>
          <n-li>{{ '贷款期限越长，月供越低，但总利息越高' }}</n-li>
          <n-li>{{ '提前还款可以减少总利息支出' }}</n-li>
          <n-li>{{ '比较不同银行的利率可以获得更优惠的条件' }}</n-li>
        </n-ul>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.bg-primary-fade {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
}
.border-primary {
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.bg-orange-fade {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(251, 146, 60, 0.1));
}
.border-orange {
  border: 1px solid rgba(251, 146, 60, 0.3);
}

.bg-green-fade {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
}
.border-green {
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.bg-dark-100 {
  background: rgba(255, 255, 255, 0.05);
}
</style>
