<script setup lang="ts">
import { computed, ref } from 'vue';

// i18n labels
const labels = {
  zh: {
    title: '储蓄目标计算器',
    inputSection: '设置目标',
    goalAmount: '目标金额',
    currentSavings: '当前储蓄',
    monthlyDeposit: '每月存款',
    interestRate: '年利率 (%)',
    timeToGoal: '达成时间 (月)',
    calculateMode: '计算模式',
    calculateTime: '计算所需时间',
    calculateMonthly: '计算每月存款',
    results: '计算结果',
    monthsNeeded: '所需月份',
    yearsMonths: '年月',
    totalDeposits: '总存款',
    interestEarned: '利息收入',
    finalAmount: '最终金额',
    monthlyPayment: '每月需存',
    timeline: '储蓄时间线',
    month: '月',
    balance: '余额',
    deposit: '存款',
    tips: '理财小贴士',
    tip1: '建议将每月收入的20%用于储蓄',
    tip2: '紧急基金应覆盖3-6个月的生活开支',
    tip3: '高利率储蓄账户可以让你的钱更快增值',
    tip4: '设立自动转账可以帮助你坚持储蓄计划',
    progress: '进度',
    ofGoal: '目标',
    saved: '已存',
    remaining: '剩余',
  },
  en: {
    title: 'Savings Goal Calculator',
    inputSection: 'Set Your Goal',
    goalAmount: 'Goal Amount',
    currentSavings: 'Current Savings',
    monthlyDeposit: 'Monthly Deposit',
    interestRate: 'Annual Interest Rate (%)',
    timeToGoal: 'Time to Goal (Months)',
    calculateMode: 'Calculate Mode',
    calculateTime: 'Calculate Time Needed',
    calculateMonthly: 'Calculate Monthly Deposit',
    results: 'Calculation Results',
    monthsNeeded: 'Months Needed',
    yearsMonths: 'years, months',
    totalDeposits: 'Total Deposits',
    interestEarned: 'Interest Earned',
    finalAmount: 'Final Amount',
    monthlyPayment: 'Monthly Payment Needed',
    timeline: 'Savings Timeline',
    month: 'Month',
    balance: 'Balance',
    deposit: 'Deposit',
    tips: 'Financial Tips',
    tip1: 'Aim to save 20% of your monthly income',
    tip2: 'Emergency fund should cover 3-6 months of expenses',
    tip3: 'High-yield savings accounts grow your money faster',
    tip4: 'Set up automatic transfers to stay consistent',
    progress: 'Progress',
    ofGoal: 'of goal',
    saved: 'Saved',
    remaining: 'Remaining',
  },
};

// Language switch
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Input parameters
const goalAmount = ref<number | null>(null);
const currentSavings = ref<number>(0);
const monthlyDeposit = ref<number | null>(null);
const interestRate = ref<number>(0);
const timeToGoal = ref<number | null>(null);
const calculateMode = ref<'time' | 'monthly'>('time');

// Calculate results based on mode
const result = computed(() => {
  const goal = goalAmount.value || 0;
  const current = currentSavings.value || 0;
  const rate = (interestRate.value || 0) / 100 / 12; // Monthly rate

  if (goal <= current) {
    return null;
  }

  const remaining = goal - current;

  if (calculateMode.value === 'time') {
    // Calculate time needed for given monthly deposit
    const monthly = monthlyDeposit.value || 0;
    if (monthly <= 0) return null;

    let months = 0;
    let balance = current;

    if (rate > 0) {
      // With interest: use formula for future value of annuity
      // FV = PV * (1 + r)^n + PMT * ((1 + r)^n - 1) / r
      // Solving for n is complex, so we iterate
      while (balance < goal && months < 1200) {
        balance = balance * (1 + rate) + monthly;
        months++;
      }
    } else {
      months = Math.ceil(remaining / monthly);
    }

    const totalDeposits = current + monthly * months;
    const interestEarned = goal - totalDeposits;

    // Generate timeline
    const timeline = [];
    let timelineBalance = current;
    for (let i = 1; i <= Math.min(months, 24); i++) {
      timelineBalance = timelineBalance * (1 + rate) + monthly;
      timeline.push({
        month: i,
        deposit: monthly,
        balance: Math.min(timelineBalance, goal),
      });
    }

    return {
      type: 'time',
      months,
      monthlyPayment: monthly,
      totalDeposits: totalDeposits.toFixed(2),
      interestEarned: Math.max(0, interestEarned).toFixed(2),
      finalAmount: goal.toFixed(2),
      timeline,
      showMore: months > 24,
    };
  } else {
    // Calculate monthly deposit needed for given time
    const months = timeToGoal.value || 0;
    if (months <= 0) return null;

    let monthly: number;
    if (rate > 0) {
      // PMT = (FV - PV * (1 + r)^n) * r / ((1 + r)^n - 1)
      const fvFactor = Math.pow(1 + rate, months);
      monthly = (goal - current * fvFactor) * rate / (fvFactor - 1);
    } else {
      monthly = remaining / months;
    }

    monthly = Math.max(0, monthly);
    const totalDeposits = current + monthly * months;
    const interestEarned = goal - totalDeposits;

    // Generate timeline
    const timeline = [];
    let balance = current;
    for (let i = 1; i <= Math.min(months, 24); i++) {
      balance = balance * (1 + rate) + monthly;
      timeline.push({
        month: i,
        deposit: monthly,
        balance: Math.min(balance, goal),
      });
    }

    return {
      type: 'monthly',
      months,
      monthlyPayment: monthly,
      totalDeposits: totalDeposits.toFixed(2),
      interestEarned: Math.max(0, interestEarned).toFixed(2),
      finalAmount: goal.toFixed(2),
      timeline,
      showMore: months > 24,
    };
  }
});

// Progress percentage
const progressPercent = computed(() => {
  if (!goalAmount.value || goalAmount.value <= 0) return 0;
  const current = currentSavings.value || 0;
  return Math.min(100, (current / goalAmount.value) * 100);
});

// Format currency
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format years and months
const formatYearsMonths = (months: number) => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) {
    return `${remainingMonths} ${labels[lang.value].month}`;
  } else if (remainingMonths === 0) {
    return `${years} ${lang.value === 'zh' ? '年' : 'year' + (years > 1 ? 's' : '')}`;
  }
  return lang.value === 'zh'
    ? `${years} 年 ${remainingMonths} 月`
    : `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
};

// Calculate mode options
const calculateModeOptions = computed(() => [
  { label: labels[lang.value].calculateTime, value: 'time' },
  { label: labels[lang.value].calculateMonthly, value: 'monthly' },
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

      <!-- Input Card -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('inputSection').value }}</div>

        <n-grid :cols="2" :x-gap="16" :y-gap="12" responsive="screen" item-responsive>
          <!-- Goal Amount -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('goalAmount').value }}</div>
            <n-input-number
              v-model:value="goalAmount"
              :min="0"
              :step="1000"
              size="large"
              :placeholder="lang === 'zh' ? '输入目标金额' : 'Enter goal amount'"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>

          <!-- Current Savings -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('currentSavings').value }}</div>
            <n-input-number
              v-model:value="currentSavings"
              :min="0"
              :step="100"
              size="large"
              :placeholder="lang === 'zh' ? '当前已存金额' : 'Current savings'"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>

          <!-- Interest Rate -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('interestRate').value }}</div>
            <n-input-number
              v-model:value="interestRate"
              :min="0"
              :max="50"
              :step="0.1"
              size="large"
              style="width: 100%"
            >
              <template #suffix>%</template>
            </n-input-number>
          </n-gi>

          <!-- Calculate Mode -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('calculateMode').value }}</div>
            <n-select
              v-model:value="calculateMode"
              :options="calculateModeOptions"
              size="large"
              style="width: 100%"
            />
          </n-gi>

          <!-- Monthly Deposit (if calculating time) -->
          <n-gi v-if="calculateMode === 'time'" span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('monthlyDeposit').value }}</div>
            <n-input-number
              v-model:value="monthlyDeposit"
              :min="0"
              :step="100"
              size="large"
              :placeholder="lang === 'zh' ? '每月计划存入' : 'Monthly deposit'"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>

          <!-- Time to Goal (if calculating monthly) -->
          <n-gi v-if="calculateMode === 'monthly'" span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('timeToGoal').value }}</div>
            <n-input-number
              v-model:value="timeToGoal"
              :min="1"
              :max="600"
              size="large"
              :placeholder="lang === 'zh' ? '计划多少个月达成' : 'Months to goal'"
              style="width: 100%"
            >
              <template #suffix>{{ lang === 'zh' ? '月' : 'months' }}</template>
            </n-input-number>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- Progress Card -->
      <c-card v-if="goalAmount && goalAmount > 0" mb-4>
        <div flex justify-between items-center mb-2>
          <span text-sm op-70>{{ t('progress').value }}</span>
          <span text-sm>{{ progressPercent.toFixed(1) }}%</span>
        </div>
        <n-progress
          type="line"
          :percentage="progressPercent"
          :height="12"
          :border-radius="6"
          :color="'#22c55e'"
          :rail-color="'rgba(34, 197, 94, 0.2)'"
          :show-indicator="false"
        />
        <div flex justify-between mt-2 text-xs op-60>
          <span>{{ t('saved').value }}: ¥{{ formatCurrency(currentSavings) }}</span>
          <span>{{ t('remaining').value }}: ¥{{ formatCurrency((goalAmount || 0) - currentSavings) }}</span>
        </div>
      </c-card>

      <!-- Results Card -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ t('results').value }}</div>

        <!-- Key Metrics -->
        <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- Time Needed / Monthly Payment -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-purple-fade border-purple>
              <div text-sm op-70 mb-1>
                {{ result.type === 'time' ? t('monthsNeeded').value : t('monthlyPayment').value }}
              </div>
              <div text-2xl font-bold text-purple-400>
                {{ result.type === 'time' ? formatYearsMonths(result.months) : '¥' + formatCurrency(result.monthlyPayment) }}
              </div>
            </div>
          </n-gi>

          <!-- Total Deposits -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-blue-fade border-blue>
              <div text-sm op-70 mb-1>{{ t('totalDeposits').value }}</div>
              <div text-2xl font-bold text-blue-400>¥{{ formatCurrency(result.totalDeposits) }}</div>
            </div>
          </n-gi>

          <!-- Interest Earned -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-green-fade border-green>
              <div text-sm op-70 mb-1>{{ t('interestEarned').value }}</div>
              <div text-2xl font-bold text-green-400>¥{{ formatCurrency(result.interestEarned) }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- Timeline -->
        <div mt-4 p-4 rounded-lg bg-dark-100>
          <div text-sm font-bold mb-3>{{ t('timeline').value }}</div>
          <div overflow-x-auto>
            <table w-full text-sm>
              <thead>
                <tr border-b border-gray-700>
                  <th py-2 text-left op-70>{{ t('month').value }}</th>
                  <th py-2 text-right op-70>{{ t('deposit').value }}</th>
                  <th py-2 text-right op-70>{{ t('balance').value }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in result.timeline" :key="item.month" border-b border-gray-800>
                  <td py-2>{{ item.month }}</td>
                  <td py-2 text-right>¥{{ formatCurrency(item.deposit) }}</td>
                  <td py-2 text-right font-bold>¥{{ formatCurrency(item.balance) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="result.showMore" text-center text-xs op-50 mt-2>
            {{ lang === 'zh' ? `仅显示前24个月，共${result.months}个月` : `Showing first 24 of ${result.months} months` }}
          </div>
        </div>
      </c-card>

      <!-- Tips -->
      <c-card mt-4>
        <div text-lg font-bold mb-3>{{ t('tips').value }}</div>
        <n-ul>
          <n-li>{{ t('tip1').value }}</n-li>
          <n-li>{{ t('tip2').value }}</n-li>
          <n-li>{{ t('tip3').value }}</n-li>
          <n-li>{{ t('tip4').value }}</n-li>
        </n-ul>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.bg-purple-fade {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1));
}
.border-purple {
  border: 1px solid rgba(168, 85, 247, 0.3);
}
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
.bg-dark-100 {
  background: rgba(255, 255, 255, 0.05);
}
</style>
