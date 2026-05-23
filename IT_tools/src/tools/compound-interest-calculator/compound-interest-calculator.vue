<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStorage } from '@vueuse/core';

// 输入参数
const principal = ref<number | null>(null);
const annualRate = ref<number | null>(null);
const years = ref<number | null>(null);
const compoundFrequency = ref<string>('monthly');
const monthlyContribution = ref<number>(0);

// 复利频率选项
const frequencyOptions = [
  { label: '按年', value: 'yearly' },
  { label: '按季度', value: 'quarterly' },
  { label: '按月', value: 'monthly' },
  { label: '按天', value: 'daily' },
];

// 复利频率映射到实际次数
const frequencyMap: Record<string, number> = {
  yearly: 1,
  quarterly: 4,
  monthly: 12,
  daily: 365,
};

// 计算复利结果
const result = computed(() => {
  if (!principal.value || !annualRate.value || !years.value) {
    return null;
  }

  const P = principal.value;
  const r = annualRate.value / 100;
  const n = frequencyMap[compoundFrequency.value];
  const t = years.value;
  const PMT = monthlyContribution.value || 0;

  // 复利公式: A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]
  const amount = P * Math.pow(1 + r / n, n * t) + PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n)) * (n / 12);
  const totalContributions = P + PMT * 12 * t;
  const totalInterest = amount - totalContributions;

  return {
    finalAmount: amount.toFixed(2),
    totalContributions: totalContributions.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
    effectiveRate: ((Math.pow(1 + r / n, n) - 1) * 100).toFixed(2),
  };
});

// 年度明细计算
const yearlyBreakdown = computed(() => {
  if (!principal.value || !annualRate.value || !years.value) {
    return [];
  }

  const P = principal.value;
  const r = annualRate.value / 100;
  const n = frequencyMap[compoundFrequency.value];
  const t = years.value;
  const PMT = monthlyContribution.value || 0;

  const breakdown = [];
  let balance = P;
  let totalContributions = P;

  for (let year = 1; year <= t; year++) {
    const startBalance = balance;
    const yearlyContribution = PMT * 12;
    totalContributions += yearlyContribution;
    
    // 计算年末余额
    balance = P * Math.pow(1 + r / n, n * year) + PMT * ((Math.pow(1 + r / n, n * year) - 1) / (r / n)) * (n / 12);
    
    const interestEarned = balance - startBalance - yearlyContribution;
    const yearlyContributionWithInterest = startBalance + yearlyContribution + interestEarned;

    breakdown.push({
      year,
      startBalance: startBalance.toFixed(2),
      contribution: yearlyContribution.toFixed(2),
      interest: interestEarned.toFixed(2),
      endBalance: balance.toFixed(2),
    });
  }

  return breakdown;
});

// 格式化货币
const formatCurrency = (value: string) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- 输入参数卡片 -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ '参数设置' }}</div>
        <n-grid :cols="2" :x-gap="16" :y-gap="12" responsive="screen" item-responsive>
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '本金' }}</div>
            <n-input-number
              v-model:value="principal"
              :min="0"
              :step="1000"
              size="large"
              placeholder="10000"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '年利率 (%)' }}</div>
            <n-input-number
              v-model:value="annualRate"
              :min="0"
              :max="100"
              :step="0.1"
              :precision="2"
              size="large"
              placeholder="5"
              style="width: 100%"
            >
              <template #suffix>%</template>
            </n-input-number>
          </n-gi>
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '投资年限' }}</div>
            <n-input-number
              v-model:value="years"
              :min="1"
              :max="50"
              size="large"
              placeholder="10"
              style="width: 100%"
            />
          </n-gi>
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ '复利频率' }}</div>
            <n-select
              v-model:value="compoundFrequency"
              :options="frequencyOptions"
              size="large"
              style="width: 100%"
            />
          </n-gi>
          <n-gi span="2">
            <div mb-1 text-sm op-70>{{ '每月追加投资' }}</div>
            <n-input-number
              v-model:value="monthlyContribution"
              :min="0"
              :step="100"
              size="large"
              :placeholder="'可选'"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- 结果展示 -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ '计算结果' }}</div>
        <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-green-fade border-green>
              <div text-sm op-70 mb-1>{{ '最终金额' }}</div>
              <div text-2xl font-bold text-green-400>¥{{ formatCurrency(result.finalAmount) }}</div>
            </div>
          </n-gi>
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-blue-fade border-blue>
              <div text-sm op-70 mb-1>{{ '累计投入' }}</div>
              <div text-2xl font-bold text-blue-400>¥{{ formatCurrency(result.totalContributions) }}</div>
            </div>
          </n-gi>
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-purple-fade border-purple>
              <div text-sm op-70 mb-1>{{ '利息收益' }}</div>
              <div text-2xl font-bold text-purple-400>¥{{ formatCurrency(result.totalInterest) }}</div>
            </div>
          </n-gi>
        </n-grid>
        <div mt-4 text-center>
          <n-tag type="info" size="small">
            {{ '实际年化收益率' }}: {{ result.effectiveRate }}%
          </n-tag>
        </div>
      </c-card>

      <!-- 年度明细表格 -->
      <c-card v-if="yearlyBreakdown.length > 0">
        <div text-lg font-bold mb-4>{{ '年度明细' }}</div>
        <n-scrollbar style="max-height: 400px">
          <n-table :bordered="false" :single-line="false" size="small">
            <thead>
              <tr>
                <th>{{ '年份' }}</th>
                <th>{{ '期初余额' }}</th>
                <th>{{ '追加投资' }}</th>
                <th>{{ '利息' }}</th>
                <th>{{ '期末余额' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in yearlyBreakdown" :key="row.year">
                <td font-bold>{{ row.year }}</td>
                <td>¥{{ formatCurrency(row.startBalance) }}</td>
                <td text-blue-400>+¥{{ formatCurrency(row.contribution) }}</td>
                <td text-green-400>+¥{{ formatCurrency(row.interest) }}</td>
                <td font-bold>¥{{ formatCurrency(row.endBalance) }}</td>
              </tr>
            </tbody>
          </n-table>
        </n-scrollbar>
      </c-card>

      <!-- 公式说明 -->
      <c-card mt-4>
        <div text-lg font-bold mb-3>{{ '计算公式' }}</div>
        <div p-4 rounded-lg bg-dark op-90 font-mono text-sm>
          <div>A = P(1 + r/n)^(nt)</div>
          <div mt-2 text-sm op-70>
            {{ 'A = P(1 + r/n)^(nt)' }}
          </div>
        </div>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.bg-green-fade {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
}
.border-green {
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.bg-blue-fade {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
}
.border-blue {
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.bg-purple-fade {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1));
}
.border-purple {
  border: 1px solid rgba(168, 85, 247, 0.3);
}
</style>
