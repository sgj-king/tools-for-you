<script setup lang="ts">
import { computed, ref } from 'vue';
import { differenceInDays, differenceInYears, addYears, format, parseISO, isValid } from 'date-fns';

// ============ i18n Labels ============
const labels = {
  zh: {
    title: '年假计算器',
    subtitle: '根据中国劳动法，快速计算你的带薪年假天数',

    // Mode
    modeLabel: '计算模式',
    modeStandard: '标准计算',
    modeNewHire: '新入职折算',
    modeResign: '离职折算',

    // Input
    inputSection: '输入信息',
    workStartDate: '参加工作日期',
    workStartDatePlaceholder: '选择首次参加工作日期',
    currentCompanyDate: '入职当前公司日期',
    currentCompanyDatePlaceholder: '选择入职当前公司日期',
    resignDate: '离职日期',
    resignDatePlaceholder: '选择离职日期',
    monthlySalary: '月工资 (元)',
    monthlySalaryPlaceholder: '输入月平均工资',
    extraLeaveDays: '公司额外年假 (天)',
    extraLeaveDaysTip: '超出法定年假的部分，由公司规章制度决定',

    // Legal reference
    legalRef: '法律依据',
    legalRefContent: '《职工带薪年休假条例》第三条：职工累计工作已满1年不满10年的，年休假5天；已满10年不满20年的，年休假10天；已满20年的，年休假15天。',

    // Results
    resultSection: '计算结果',
    totalWorkYears: '累计工龄',
    totalWorkDays: '累计工作天数',
    legalLeaveDays: '法定年假天数',
    extraLeaveDaysLabel: '公司额外年假',
    totalLeaveDays: '年假总天数',
    newHireProrated: '新入职折算年假',
    resignProrated: '离职折算年假',
    proratedFormula: '折算公式',
    unusedLeave: '未休年假补偿',
    unusedLeaveTip: '用人单位应按职工日工资收入的300%支付未休年假工资报酬',
    unusedDays: '未休天数',
    compensationAmount: '补偿金额',
    dailyWage: '日工资',
    dailyWageFormula: '月工资 ÷ 21.75',

    // Table
    leaveTable: '年假标准对照表',
    workYearsCol: '累计工龄',
    leaveDaysCol: '年假天数',
    lessThan1Year: '不满1年',
    year1to10: '1年 - 10年',
    year10to20: '10年 - 20年',
    year20plus: '20年以上',

    // Tips
    tips: '温馨提示',
    tip1: '累计工龄是指在所有用人单位的工作年限之和，非仅本单位工龄',
    tip2: '国家法定休假日、休息日不计入年休假假期',
    tip3: '新入职折算公式：（当年度剩余日历天数 ÷ 365）× 全年年假天数',
    tip4: '离职折算公式：（当年度已过日历天数 ÷ 365）× 全年年假天数',
    tip5: '折算后不足1整天的部分不享受年休假',
    tip6: '职工依法享受的探亲假、婚丧假、产假等不计入年休假假期',

    // Status
    notEligible: '暂不符合年假条件',
    notEligibleTip: '累计工作不满1年，暂不享受带薪年休假',
    eligible: '符合年假条件 ✓',
    year: '年',
    days: '天',
    day: '天',
    yuan: '元',
    calculatedDays: '天（折算）',
  },
  en: {
    title: 'Annual Leave Calculator',
    subtitle: 'Calculate your paid annual leave days based on Chinese labor law',

    // Mode
    modeLabel: 'Calculation Mode',
    modeStandard: 'Standard',
    modeNewHire: 'New Hire Proration',
    modeResign: 'Resignation Proration',

    // Input
    inputSection: 'Input Information',
    workStartDate: 'Start Working Date',
    workStartDatePlaceholder: 'Select first employment date',
    currentCompanyDate: 'Current Company Join Date',
    currentCompanyDatePlaceholder: 'Select current company join date',
    resignDate: 'Resignation Date',
    resignDatePlaceholder: 'Select resignation date',
    monthlySalary: 'Monthly Salary (CNY)',
    monthlySalaryPlaceholder: 'Enter average monthly salary',
    extraLeaveDays: 'Company Extra Leave (days)',
    extraLeaveDaysTip: 'Days beyond legal minimum, determined by company policy',

    // Legal reference
    legalRef: 'Legal Reference',
    legalRefContent: 'Regulation on Paid Annual Leave for Employees, Article 3: Employees with 1-10 years of cumulative service get 5 days; 10-20 years get 10 days; 20+ years get 15 days of paid annual leave.',

    // Results
    resultSection: 'Calculation Results',
    totalWorkYears: 'Cumulative Service',
    totalWorkDays: 'Total Working Days',
    legalLeaveDays: 'Legal Annual Leave',
    extraLeaveDaysLabel: 'Company Extra Leave',
    totalLeaveDays: 'Total Annual Leave',
    newHireProrated: 'New Hire Prorated Leave',
    resignProrated: 'Resignation Prorated Leave',
    proratedFormula: 'Proration Formula',
    unusedLeave: 'Unused Leave Compensation',
    unusedLeaveTip: 'Employer should pay 300% of daily wage for unused annual leave',
    unusedDays: 'Unused Days',
    compensationAmount: 'Compensation Amount',
    dailyWage: 'Daily Wage',
    dailyWageFormula: 'Monthly Salary ÷ 21.75',

    // Table
    leaveTable: 'Annual Leave Standards',
    workYearsCol: 'Cumulative Service',
    leaveDaysCol: 'Annual Leave Days',
    lessThan1Year: 'Less than 1 year',
    year1to10: '1 - 10 years',
    year10to20: '10 - 20 years',
    year20plus: '20+ years',

    // Tips
    tips: 'Tips',
    tip1: 'Cumulative service includes years at all employers, not just current one',
    tip2: 'Public holidays and rest days are not counted as annual leave',
    tip3: 'New hire proration: (remaining calendar days ÷ 365) × full-year leave days',
    tip4: 'Resignation proration: (elapsed calendar days ÷ 365) × full-year leave days',
    tip5: 'Prorated results less than 1 full day do not qualify for annual leave',
    tip6: 'Family visit leave, marriage/funeral leave, and maternity leave are not counted as annual leave',

    // Status
    notEligible: 'Not Eligible for Annual Leave',
    notEligibleTip: 'Cumulative service less than 1 year, no paid annual leave yet',
    eligible: 'Eligible for Annual Leave ✓',
    year: ' year(s)',
    days: ' days',
    day: ' day',
    yuan: ' CNY',
    calculatedDays: ' days (prorated)',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ============ State ============
const mode = ref<'standard' | 'newHire' | 'resign'>('standard');
const workStartDate = ref<number | null>(null); // timestamp
const currentCompanyDate = ref<number | null>(null);
const resignDate = ref<number | null>(null);
const monthlySalary = ref<number | null>(null);
const extraLeave = ref<number>(0);
const unusedDays = ref<number>(0);

// ============ Helpers ============
const formatDate = (ts: number) => format(new Date(ts), 'yyyy-MM-dd');

const getLegalLeaveDays = (totalYears: number): number => {
  if (totalYears < 1) return 0;
  if (totalYears < 10) return 5;
  if (totalYears < 20) return 10;
  return 15;
};

const getLeaveBracket = (totalYears: number): string => {
  if (totalYears < 1) return 'none';
  if (totalYears < 10) return '1-10';
  if (totalYears < 20) return '10-20';
  return '20+';
};

// ============ Computed ============
const today = new Date();

const totalWorkYears = computed(() => {
  if (!workStartDate.value) return 0;
  const start = new Date(workStartDate.value);
  const ref = mode.value === 'resign' && resignDate.value
    ? new Date(resignDate.value)
    : today;
  const years = differenceInYears(ref, start);
  // Check if anniversary has passed this year
  const anniversaryThisYear = addYears(start, years);
  if (anniversaryThisYear > ref) return Math.max(0, years - 1);
  return Math.max(0, years);
});

const totalWorkDays = computed(() => {
  if (!workStartDate.value) return 0;
  const start = new Date(workStartDate.value);
  const ref = mode.value === 'resign' && resignDate.value
    ? new Date(resignDate.value)
    : today;
  return differenceInDays(ref, start);
});

const legalDays = computed(() => getLegalLeaveDays(totalWorkYears.value));
const totalDays = computed(() => legalDays.value + extraLeave.value);

// New hire proration
const newHireProrated = computed(() => {
  if (!currentCompanyDate.value || legalDays.value === 0) return 0;
  const joinDate = new Date(currentCompanyDate.value);
  const joinYear = joinDate.getFullYear();
  const endOfYear = new Date(joinYear, 11, 31); // Dec 31
  const remainingDays = differenceInDays(endOfYear, joinDate) + 1;
  const prorated = (remainingDays / 365) * legalDays.value;
  return Math.floor(prorated); // Round down, <1 full day = no leave
});

// Resignation proration
const resignProrated = computed(() => {
  if (!resignDate.value || !currentCompanyDate.value || legalDays.value === 0) return 0;
  const resign = new Date(resignDate.value);
  const joinDate = new Date(currentCompanyDate.value);
  const resignYear = resign.getFullYear();

  // If joined and resigned in same year
  if (joinDate.getFullYear() === resignYear) {
    const elapsedDays = differenceInDays(resign, joinDate) + 1;
    const prorated = (elapsedDays / 365) * legalDays.value;
    return Math.floor(prorated);
  }

  // Days elapsed in resignation year
  const startOfYear = new Date(resignYear, 0, 1);
  const elapsedDays = differenceInDays(resign, startOfYear) + 1;
  const prorated = (elapsedDays / 365) * legalDays.value;
  return Math.floor(prorated);
});

// Daily wage
const dailyWage = computed(() => {
  if (!monthlySalary.value || monthlySalary.value <= 0) return 0;
  return monthlySalary.value / 21.75;
});

// Unused leave compensation
const unusedCompensation = computed(() => {
  if (unusedDays.value <= 0 || dailyWage.value <= 0) return 0;
  // 300% of daily wage, but 100% already paid as normal salary, so extra 200%
  return unusedDays.value * dailyWage.value * 2;
});

// Final leave days based on mode
const finalLeaveDays = computed(() => {
  if (mode.value === 'newHire') return newHireProrated.value;
  if (mode.value === 'resign') return resignProrated.value;
  return totalDays.value;
});

// Eligibility
const isEligible = computed(() => totalWorkYears.value >= 1);
const leaveBracket = computed(() => getLeaveBracket(totalWorkYears.value));

// Mode options
const modeOptions = computed(() => [
  { label: labels[lang.value].modeStandard, value: 'standard' },
  { label: labels[lang.value].modeNewHire, value: 'newHire' },
  { label: labels[lang.value].modeResign, value: 'resign' },
]);

// Leave table data
const leaveTableData = computed(() => [
  { years: labels[lang.value].lessThan1Year, days: '0', bracket: 'none' },
  { years: labels[lang.value].year1to10, days: '5', bracket: '1-10' },
  { years: labels[lang.value].year10to20, days: '10', bracket: '10-20' },
  { years: labels[lang.value].year20plus, days: '15', bracket: '20+' },
]);

// Format number
const formatNum = (n: number, decimals = 2) => n.toLocaleString('zh-CN', {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});
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

      <!-- Mode Selection -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('modeLabel').value }}</div>
        <n-radio-group v-model:value="mode" name="modeGroup" size="large">
          <n-space>
            <n-radio-button value="standard">{{ t('modeStandard').value }}</n-radio-button>
            <n-radio-button value="newHire">{{ t('modeNewHire').value }}</n-radio-button>
            <n-radio-button value="resign">{{ t('modeResign').value }}</n-radio-button>
          </n-space>
        </n-radio-group>
      </c-card>

      <!-- Input Card -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('inputSection').value }}</div>
        <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
          <!-- Work Start Date -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('workStartDate').value }}</div>
            <n-date-picker
              v-model:value="workStartDate"
              type="date"
              size="large"
              :placeholder="t('workStartDatePlaceholder').value"
              style="width: 100%"
              clearable
            />
          </n-gi>

          <!-- Current Company Date (for newHire and resign) -->
          <n-gi v-if="mode === 'newHire' || mode === 'resign'" span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('currentCompanyDate').value }}</div>
            <n-date-picker
              v-model:value="currentCompanyDate"
              type="date"
              size="large"
              :placeholder="t('currentCompanyDatePlaceholder').value"
              style="width: 100%"
              clearable
            />
          </n-gi>

          <!-- Resign Date (for resign mode) -->
          <n-gi v-if="mode === 'resign'" span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('resignDate').value }}</div>
            <n-date-picker
              v-model:value="resignDate"
              type="date"
              size="large"
              :placeholder="t('resignDatePlaceholder').value"
              style="width: 100%"
              clearable
            />
          </n-gi>

          <!-- Monthly Salary (for compensation) -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>{{ t('monthlySalary').value }}</div>
            <n-input-number
              v-model:value="monthlySalary"
              :min="0"
              :step="1000"
              size="large"
              :placeholder="t('monthlySalaryPlaceholder').value"
              style="width: 100%"
            >
              <template #prefix>¥</template>
            </n-input-number>
          </n-gi>

          <!-- Extra Leave Days -->
          <n-gi span="2 m:1">
            <div mb-1 text-sm op-70>
              {{ t('extraLeaveDays').value }}
              <n-tooltip trigger="hover">
                <template #trigger>
                  <span text-blue-400 cursor-help> ⓘ</span>
                </template>
                {{ t('extraLeaveDaysTip').value }}
              </n-tooltip>
            </div>
            <n-input-number
              v-model:value="extraLeave"
              :min="0"
              :max="30"
              :step="1"
              size="large"
              style="width: 100%"
            >
              <template #suffix>{{ t('days').value }}</template>
            </n-input-number>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- Results Card -->
      <c-card v-if="workStartDate" mb-4>
        <div text-lg font-bold mb-4>{{ t('resultSection').value }}</div>

        <!-- Eligibility Status -->
        <div mb-4 p-4 rounded-lg :class="isEligible ? 'bg-green-fade border-green' : 'bg-red-fade border-red'">
          <div flex items-center gap-2>
            <span text-2xl>{{ isEligible ? '✅' : '⚠️' }}</span>
            <div>
              <div text-lg font-bold>{{ isEligible ? t('eligible').value : t('notEligible').value }}</div>
              <div v-if="!isEligible" text-sm op-70>{{ t('notEligibleTip').value }}</div>
            </div>
          </div>
        </div>

        <!-- Key Metrics -->
        <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- Total Work Years -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-blue-fade border-blue>
              <div text-sm op-70 mb-1>{{ t('totalWorkYears').value }}</div>
              <div text-3xl font-bold text-blue-400>{{ totalWorkYears }}</div>
              <div text-xs op-50 mt-1>{{ t('totalWorkDays').value }}: {{ totalWorkDays.toLocaleString() }} {{ t('days').value }}</div>
            </div>
          </n-gi>

          <!-- Legal Leave Days -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-purple-fade border-purple>
              <div text-sm op-70 mb-1>{{ t('legalLeaveDays').value }}</div>
              <div text-3xl font-bold text-purple-400>{{ legalDays }}</div>
              <div text-xs op-50 mt-1>{{ t('days').value }}</div>
            </div>
          </n-gi>

          <!-- Total Leave Days -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-cyan-fade border-cyan>
              <div text-sm op-70 mb-1>
                {{ mode === 'newHire' ? t('newHireProrated').value : mode === 'resign' ? t('resignProrated').value : t('totalLeaveDays').value }}
              </div>
              <div text-3xl font-bold text-cyan-400>{{ finalLeaveDays }}</div>
              <div text-xs op-50 mt-1>
                <template v-if="mode === 'newHire' || mode === 'resign'">{{ t('calculatedDays').value }}</template>
                <template v-else-if="extraLeave > 0">{{ t('legalLeaveDays').value }} + {{ extraLeave }} {{ t('days').value }}</template>
                <template v-else>{{ t('days').value }}</template>
              </div>
            </div>
          </n-gi>
        </n-grid>

        <!-- Proration Formula -->
        <div v-if="mode === 'newHire' && currentCompanyDate && isEligible" mt-4 p-4 rounded-lg bg-dark-100>
          <div text-sm font-bold mb-2>{{ t('proratedFormula').value }}</div>
          <div text-sm op-80>
            <code bg-dark-200 px-2 py-1 rounded text-cyan-400>
              ({{ lang === 'zh' ? '剩余日历天数' : 'Remaining calendar days' }} ÷ 365) × {{ legalDays }} = <strong>{{ newHireProrated }}</strong> {{ t('days').value }}
            </code>
          </div>
        </div>

        <div v-if="mode === 'resign' && resignDate && currentCompanyDate && isEligible" mt-4 p-4 rounded-lg bg-dark-100>
          <div text-sm font-bold mb-2>{{ t('proratedFormula').value }}</div>
          <div text-sm op-80>
            <code bg-dark-200 px-2 py-1 rounded text-cyan-400>
              ({{ lang === 'zh' ? '已过日历天数' : 'Elapsed calendar days' }} ÷ 365) × {{ legalDays }} = <strong>{{ resignProrated }}</strong> {{ t('days').value }}
            </code>
          </div>
        </div>

        <!-- Extra Leave Info -->
        <div v-if="extraLeave > 0 && mode === 'standard'" mt-4 p-3 rounded-lg bg-dark-100 flex justify-between items-center>
          <span text-sm op-70>{{ t('extraLeaveDaysLabel').value }}</span>
          <span font-bold text-amber-400>+{{ extraLeave }} {{ t('days').value }}</span>
        </div>

        <!-- Unused Leave Compensation -->
        <div v-if="isEligible && monthlySalary" mt-4>
          <div p-4 rounded-lg bg-amber-fade border-amber>
            <div text-sm font-bold mb-3>{{ t('unusedLeave').value }}</div>
            <div text-xs op-60 mb-3>{{ t('unusedLeaveTip').value }}</div>

            <n-grid :cols="2" :x-gap="12" :y-gap="12">
              <!-- Daily Wage -->
              <n-gi>
                <div text-xs op-70>{{ t('dailyWage').value }}</div>
                <div text-lg font-bold>¥{{ formatNum(dailyWage) }}</div>
                <div text-xs op-50>{{ t('dailyWageFormula').value }}</div>
              </n-gi>

              <!-- Unused Days Input -->
              <n-gi>
                <div text-xs op-70 mb-1>{{ t('unusedDays').value }}</div>
                <n-input-number
                  v-model:value="unusedDays"
                  :min="0"
                  :max="finalLeaveDays"
                  :step="1"
                  size="small"
                  style="width: 100%"
                />
              </n-gi>
            </n-grid>

            <div v-if="unusedDays > 0" mt-3 p-3 rounded-lg bg-dark-100>
              <div flex justify-between items-center>
                <span text-sm op-70>{{ t('compensationAmount').value }}</span>
                <span text-xl font-bold text-amber-400>¥{{ formatNum(unusedCompensation) }}</span>
              </div>
              <div text-xs op-50 mt-1>
                {{ unusedDays }} {{ t('days').value }} × ¥{{ formatNum(dailyWage) }} × 200% = ¥{{ formatNum(unusedCompensation) }}
              </div>
            </div>
          </div>
        </div>
      </c-card>

      <!-- Leave Standards Table -->
      <c-card mb-4>
        <div text-lg font-bold mb-3>{{ t('leaveTable').value }}</div>
        <div overflow-x-auto>
          <table w-full text-sm>
            <thead>
              <tr border-b border-gray-700>
                <th py-2 px-3 text-left op-70>{{ t('workYearsCol').value }}</th>
                <th py-2 px-3 text-center op-70>{{ t('leaveDaysCol').value }}</th>
                <th py-2 px-3 text-center op-70></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in leaveTableData"
                :key="row.bracket"
                :class="row.bracket === leaveBracket && isEligible ? 'bg-highlight-row' : ''"
                border-b border-gray-800
              >
                <td py-2 px-3>{{ row.years }}</td>
                <td py-2 px-3 text-center font-bold>{{ row.days }} {{ t('days').value }}</td>
                <td py-2 px-3 text-center>
                  <span v-if="row.bracket === leaveBracket && isEligible" text-green-400 text-xs>← {{ lang === 'zh' ? '当前' : 'Current' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </c-card>

      <!-- Legal Reference -->
      <c-card mb-4>
        <div text-lg font-bold mb-3>{{ t('legalRef').value }}</div>
        <div p-3 rounded-lg bg-dark-100 text-sm op-80 leading-relaxed>
          📖 {{ t('legalRefContent').value }}
        </div>
      </c-card>

      <!-- Tips -->
      <c-card>
        <div text-lg font-bold mb-3>{{ t('tips').value }}</div>
        <n-ul>
          <n-li>{{ t('tip1').value }}</n-li>
          <n-li>{{ t('tip2').value }}</n-li>
          <n-li>{{ t('tip3').value }}</n-li>
          <n-li>{{ t('tip4').value }}</n-li>
          <n-li>{{ t('tip5').value }}</n-li>
          <n-li>{{ t('tip6').value }}</n-li>
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
.bg-red-fade {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
}
.border-red {
  border: 1px solid rgba(239, 68, 68, 0.3);
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
.bg-cyan-fade {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1));
}
.border-cyan {
  border: 1px solid rgba(6, 182, 212, 0.3);
}
.bg-amber-fade {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
}
.border-amber {
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.bg-dark-100 {
  background: rgba(255, 255, 255, 0.05);
}
.bg-dark-200 {
  background: rgba(255, 255, 255, 0.08);
}
.bg-highlight-row {
  background: rgba(6, 182, 212, 0.1);
}
</style>
