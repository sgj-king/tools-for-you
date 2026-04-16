<script setup lang="ts">
import { computed, ref } from 'vue';

// i18n labels
const labels = {
  zh: {
    title: '工资计算器',
    inputSection: '输入参数',
    salaryAmount: '工资金额',
    salaryType: '工资类型',
    monthly: '月薪',
    annual: '年薪',
    housingFundRate: '公积金比例 (%)',
    insuranceBase: '社保基数 (可选)',
    insuranceBasePlaceholder: '留空则与工资相同',
    results: '计算结果',
    takeHome: '实发工资',
    incomeTax: '个人所得税',
    totalDeductions: '五险一金',
    ofSalary: '占工资',
    deductionBreakdown: '扣款明细',
    pension: '养老保险 (8%)',
    medical: '医疗保险 (2%)',
    unemployment: '失业保险 (0.5%)',
    housingFund: '公积金',
    annualSummary: '年度汇总',
    annualSalary: '年度工资',
    annualTakeHome: '年度实发',
    annualTax: '年度个税',
    taxBrackets: '个税税率表',
    taxableIncome: '应纳税所得额',
    taxRate: '税率',
    quickDeduction: '速算扣除数',
    tips: '温馨提示',
    tip1: '公积金比例通常在5%-12%之间',
    tip2: '社保基数可能与实际工资不同',
    tip3: '专项附加扣除可减少应纳税所得额',
    tip4: '年终奖有单独的计税方法',
  },
  en: {
    title: 'Salary Calculator',
    inputSection: 'Input Parameters',
    salaryAmount: 'Salary Amount',
    salaryType: 'Salary Type',
    monthly: 'Monthly',
    annual: 'Annual',
    housingFundRate: 'Housing Fund Rate (%)',
    insuranceBase: 'Social Insurance Base (Optional)',
    insuranceBasePlaceholder: 'Same as salary if empty',
    results: 'Calculation Results',
    takeHome: 'Take-Home Pay',
    incomeTax: 'Income Tax',
    totalDeductions: 'Social Insurance & Housing Fund',
    ofSalary: 'of salary',
    deductionBreakdown: 'Deduction Breakdown',
    pension: 'Pension (8%)',
    medical: 'Medical (2%)',
    unemployment: 'Unemployment (0.5%)',
    housingFund: 'Housing Fund',
    annualSummary: 'Annual Summary',
    annualSalary: 'Annual Salary',
    annualTakeHome: 'Annual Take-Home',
    annualTax: 'Annual Tax',
    taxBrackets: 'Tax Brackets (China)',
    taxableIncome: 'Taxable Income',
    taxRate: 'Tax Rate',
    quickDeduction: 'Quick Deduction',
    tips: 'Tips',
    tip1: 'Housing fund rate typically ranges from 5% to 12%',
    tip2: 'Social insurance base may differ from actual salary',
    tip3: 'Special additional deductions can reduce taxable income',
    tip4: 'Annual bonus has separate tax calculation method',
  },
};

// Language switch
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Input parameters
const salaryAmount = ref<number | null>(null);
const salaryType = ref<'monthly' | 'annual'>('monthly');
const insuranceBase = ref<number | null>(null);
const housingFundRate = ref<number>(12);

// Calculate results
const result = computed(() => {
  if (!salaryAmount.value || salaryAmount.value <= 0) {
    return null;
  }

  const monthlySalary = salaryType.value === 'monthly' 
    ? salaryAmount.value 
    : salaryAmount.value / 12;

  const base = insuranceBase.value || monthlySalary;

  // Social insurance and housing fund deductions
  const pensionRate = 0.08;
  const medicalRate = 0.02;
  const unemploymentRate = 0.005;
  const housingRate = housingFundRate.value / 100;

  const pension = base * pensionRate;
  const medical = base * medicalRate;
  const unemployment = base * unemploymentRate;
  const housingFund = base * housingRate;

  const totalDeduction = pension + medical + unemployment + housingFund;

  // Taxable income (after 5000 threshold)
  const taxableIncome = Math.max(0, monthlySalary - totalDeduction - 5000);

  // Individual income tax calculation (China progressive tax rates)
  const taxBrackets = [
    { limit: 3000, rate: 0.03, deduction: 0 },
    { limit: 12000, rate: 0.1, deduction: 210 },
    { limit: 25000, rate: 0.2, deduction: 1410 },
    { limit: 35000, rate: 0.25, deduction: 2660 },
    { limit: 55000, rate: 0.3, deduction: 4410 },
    { limit: 80000, rate: 0.35, deduction: 7160 },
    { limit: Infinity, rate: 0.45, deduction: 15160 },
  ];

  let tax = 0;
  for (const bracket of taxBrackets) {
    if (taxableIncome <= bracket.limit) {
      tax = taxableIncome * bracket.rate - bracket.deduction;
      break;
    }
  }
  tax = Math.max(0, tax);

  // Take-home salary
  const takeHome = monthlySalary - totalDeduction - tax;

  return {
    monthlySalary: monthlySalary.toFixed(2),
    pension: pension.toFixed(2),
    medical: medical.toFixed(2),
    unemployment: unemployment.toFixed(2),
    housingFund: housingFund.toFixed(2),
    totalDeduction: totalDeduction.toFixed(2),
    taxableIncome: taxableIncome.toFixed(2),
    tax: tax.toFixed(2),
    takeHome: takeHome.toFixed(2),
    annualSalary: (monthlySalary * 12).toFixed(2),
    annualTakeHome: (takeHome * 12).toFixed(2),
    annualTax: (tax * 12).toFixed(2),
    annualDeductions: (totalDeduction * 12).toFixed(2),
    deductionRate: ((totalDeduction / monthlySalary) * 100).toFixed(1),
    taxRate: ((tax / monthlySalary) * 100).toFixed(1),
    takeHomeRate: ((takeHome / monthlySalary) * 100).toFixed(1),
  };
});

// Format currency
const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Salary type options
const salaryTypeOptions = computed(() => [
  { label: labels[lang.value].monthly, value: 'monthly' },
  { label: labels[lang.value].annual, value: 'annual' },
]);

// Language options
const langOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
];
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch
          :value="lang === 'en'"
          @update:value="lang = $event ? 'en' : 'zh'"
          size="small"
        >
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <!-- Input Card -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('inputSection').value }}</div>
        <n-grid :cols="2" :x-gap="16" :y-gap="12" responsive="screen" item-responsive>
          <!-- Salary Amount -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('salaryAmount').value }}</div>
            <n-input-number
              v-model:value="salaryAmount"
              :min="0"
              :step="1000"
              size="large"
              :placeholder="lang === 'zh' ? '输入工资金额' : 'Enter salary amount'"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>
          <!-- Salary Type -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('salaryType').value }}</div>
            <n-select
              v-model:value="salaryType"
              :options="salaryTypeOptions"
              size="large"
              style="width: 100%"
            />
          </n-gi>
          <!-- Housing Fund Rate -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('housingFundRate').value }}</div>
            <n-input-number
              v-model:value="housingFundRate"
              :min="5"
              :max="12"
              :step="1"
              size="large"
              style="width: 100%"
            >
              <template #suffix>%</template>
            </n-input-number>
          </n-gi>
          <!-- Social Insurance Base (Optional) -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('insuranceBase').value }}</div>
            <n-input-number
              v-model:value="insuranceBase"
              :min="0"
              :step="100"
              size="large"
              :placeholder="t('insuranceBasePlaceholder').value"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- Results Card -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ t('results').value }}</div>
        
        <!-- Key Metrics -->
        <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- Take-Home Pay -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-green-fade border-green>
              <div text-sm op-70 mb-1>{{ t('takeHome').value }}</div>
              <div text-3xl font-bold text-green-400>¥{{ formatCurrency(result.takeHome) }}</div>
              <div text-xs op-50 mt-1>{{ result.takeHomeRate }}% {{ t('ofSalary').value }}</div>
            </div>
          </n-gi>
          <!-- Monthly Tax -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-orange-fade border-orange>
              <div text-sm op-70 mb-1>{{ t('incomeTax').value }}</div>
              <div text-3xl font-bold text-orange-400>¥{{ formatCurrency(result.tax) }}</div>
              <div text-xs op-50 mt-1>{{ result.taxRate }}% {{ t('ofSalary').value }}</div>
            </div>
          </n-gi>
          <!-- Deductions -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-blue-fade border-blue>
              <div text-sm op-70 mb-1>{{ t('totalDeductions').value }}</div>
              <div text-3xl font-bold text-blue-400>¥{{ formatCurrency(result.totalDeduction) }}</div>
              <div text-xs op-50 mt-1>{{ result.deductionRate }}% {{ t('ofSalary').value }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- Deduction Details -->
        <div mt-4 p-4 rounded-lg bg-dark-100>
          <div text-sm font-bold mb-3>{{ t('deductionBreakdown').value }}</div>
          <n-grid :cols="2" :x-gap="12">
            <n-gi>
              <div flex justify-between py-2 border-b border-gray-700>
                <span op-70>{{ t('pension').value }}</span>
                <span font-bold>¥{{ formatCurrency(result.pension) }}</span>
              </div>
            </n-gi>
            <n-gi>
              <div flex justify-between py-2 border-b border-gray-700>
                <span op-70>{{ t('medical').value }}</span>
                <span font-bold>¥{{ formatCurrency(result.medical) }}</span>
              </div>
            </n-gi>
            <n-gi>
              <div flex justify-between py-2 border-b border-gray-700>
                <span op-70>{{ t('unemployment').value }}</span>
                <span font-bold>¥{{ formatCurrency(result.unemployment) }}</span>
              </div>
            </n-gi>
            <n-gi>
              <div flex justify-between py-2 border-b border-gray-700>
                <span op-70>{{ t('housingFund').value }} ({{ housingFundRate }}%)</span>
                <span font-bold>¥{{ formatCurrency(result.housingFund) }}</span>
              </div>
            </n-gi>
          </n-grid>
        </div>

        <!-- Annual Summary -->
        <div mt-4 p-4 rounded-lg bg-dark-200>
          <div text-sm font-bold mb-3>{{ t('annualSummary').value }}</div>
          <n-grid :cols="3" :x-gap="12">
            <n-gi>
              <div text-xs op-70>{{ t('annualSalary').value }}</div>
              <div text-lg font-bold>¥{{ formatCurrency(result.annualSalary) }}</div>
            </n-gi>
            <n-gi>
              <div text-xs op-70>{{ t('annualTakeHome').value }}</div>
              <div text-lg font-bold text-green-400>¥{{ formatCurrency(result.annualTakeHome) }}</div>
            </n-gi>
            <n-gi>
              <div text-xs op-70>{{ t('annualTax').value }}</div>
              <div text-lg font-bold text-orange-400>¥{{ formatCurrency(result.annualTax) }}</div>
            </n-gi>
          </n-grid>
        </div>
      </c-card>

      <!-- Tax Brackets Info -->
      <c-card mt-4>
        <div text-lg font-bold mb-3>{{ t('taxBrackets').value }}</div>
        <n-table :bordered="false" :single-line="false" size="small">
          <thead>
            <tr>
              <th>{{ t('taxableIncome').value }}</th>
              <th>{{ t('taxRate').value }}</th>
              <th>{{ t('quickDeduction').value }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>≤ ¥3,000</td>
              <td>3%</td>
              <td>¥0</td>
            </tr>
            <tr>
              <td>¥3,001 - ¥12,000</td>
              <td>10%</td>
              <td>¥210</td>
            </tr>
            <tr>
              <td>¥12,001 - ¥25,000</td>
              <td>20%</td>
              <td>¥1,410</td>
            </tr>
            <tr>
              <td>¥25,001 - ¥35,000</td>
              <td>25%</td>
              <td>¥2,660</td>
            </tr>
            <tr>
              <td>¥35,001 - ¥55,000</td>
              <td>30%</td>
              <td>¥4,410</td>
            </tr>
            <tr>
              <td>¥55,001 - ¥80,000</td>
              <td>35%</td>
              <td>¥7,160</td>
            </tr>
            <tr>
              <td>&gt; ¥80,000</td>
              <td>45%</td>
              <td>¥15,160</td>
            </tr>
          </tbody>
        </n-table>
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
.bg-green-fade {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1));
}
.border-green {
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.bg-orange-fade {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(251, 146, 60, 0.1));
}
.border-orange {
  border: 1px solid rgba(251, 146, 60, 0.3);
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
.bg-dark-200 {
  background: rgba(255, 255, 255, 0.08);
}
</style>
