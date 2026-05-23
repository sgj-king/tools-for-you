<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { NButton, NInputNumber, NSlider, NSwitch, NGrid, NGi } from 'naive-ui';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '考勤计算器',
    subtitle: '计算考勤天数、出勤率，轻松掌握翘课额度',
    totalClasses: '总课时',
    attendedClasses: '已上课时',
    requiredPercentage: '要求出勤率',
    currentPercentage: '当前出勤率',
    canBunk: '可以翘课',
    needToAttend: '需要上课',
    justRight: '刚好达标',
    safe: '安全',
    warning: '警告',
    danger: '危险',
    usage: '使用说明',
    step1: '输入总课时数',
    step2: '输入已上课时数',
    step3: '设置要求出勤率',
    tip: '小贴士',
    tipContent: '保持出勤率高于要求5%以上，留有安全余量。偶尔缺勤不会影响达标。',
    reset: '重置',
    classes: '节',
    percent: '%',
    safeMsg: '出勤率充足，可以适当休息',
    warningMsg: '出勤率接近底线，注意出勤',
    dangerMsg: '出勤率不足，需要补课',
    remainingClasses: '剩余课时',
    bunkedClasses: '已缺课时',
    progress: '进度',
  },
  en: {
    title: 'Attendance Calculator',
    subtitle: 'Calculate attendance rate and track how many classes you can miss',
    totalClasses: 'Total Classes',
    attendedClasses: 'Attended Classes',
    requiredPercentage: 'Required Attendance',
    currentPercentage: 'Current Attendance',
    canBunk: 'Can Miss',
    needToAttend: 'Need to Attend',
    justRight: 'Just Met',
    safe: 'Safe',
    warning: 'Warning',
    danger: 'Danger',
    usage: 'How to Use',
    step1: 'Enter total number of classes',
    step2: 'Enter attended classes',
    step3: 'Set required attendance percentage',
    tip: 'Tip',
    tipContent: 'Keep your attendance rate at least 5% above the requirement for a safety buffer. Occasional absences won\'t affect compliance.',
    reset: 'Reset',
    classes: 'classes',
    percent: '%',
    safeMsg: 'Attendance is sufficient, you can rest easy',
    warningMsg: 'Attendance is close to the minimum, be careful',
    dangerMsg: 'Attendance is insufficient, you need to catch up',
    remainingClasses: 'Remaining Classes',
    bunkedClasses: 'Missed Classes',
    progress: 'Progress',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// State
const totalClasses = ref<number | null>(null);
const attendedClasses = ref<number | null>(null);
const requiredPercentage = useStorage('attendance-required-percentage', 75);

// Computed
const currentPercentage = computed(() => {
  if (!totalClasses.value || totalClasses.value === 0 || attendedClasses.value === null) return null;
  return (attendedClasses.value / totalClasses.value) * 100;
});

const canBunk = computed(() => {
  if (!totalClasses.value || !attendedClasses.value) return null;
  const bunkable = Math.floor(attendedClasses.value * 100 / requiredPercentage.value - totalClasses.value);
  return Math.max(0, bunkable);
});

const needToAttend = computed(() => {
  if (!totalClasses.value || attendedClasses.value === null) return null;
  const needed = Math.ceil((requiredPercentage.value * totalClasses.value - 100 * attendedClasses.value) / (100 - requiredPercentage.value));
  return Math.max(0, needed);
});

const bunkedClasses = computed(() => {
  if (!totalClasses.value || attendedClasses.value === null) return null;
  return totalClasses.value - attendedClasses.value;
});

const remainingClasses = computed(() => {
  if (!totalClasses.value || attendedClasses.value === null) return null;
  // Estimated total classes in the semester
  return Math.max(0, totalClasses.value - attendedClasses.value);
});

const status = computed(() => {
  if (currentPercentage.value === null) return null;
  const pct = currentPercentage.value;
  const req = requiredPercentage.value;
  if (pct >= req + 10) return { type: 'safe' as const, color: '#22c55e' };
  if (pct >= req) return { type: 'warning' as const, color: '#f59e0b' };
  return { type: 'danger' as const, color: '#ef4444' };
});

const statusMessage = computed(() => {
  if (!status.value) return '';
  const key = `${status.value.type}Msg` as keyof typeof labels.zh;
  return t(key).value;
});

const quickPercentages = [60, 70, 75, 80, 85, 90];

function reset() {
  totalClasses.value = null;
  attendedClasses.value = null;
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
            <div text-lg font-bold mb-4>📝 {{ t('title').value }}</div>
            <div flex flex-col gap-4>
              <!-- Total Classes -->
              <div>
                <div text-sm font-medium mb-2>{{ t('totalClasses').value }}</div>
                <n-input-number
                  v-model:value="totalClasses"
                  :min="0"
                  :max="1000"
                  :placeholder="t('totalClasses').value"
                  size="large"
                  clearable
                  style="width: 100%"
                >
                  <template #suffix>{{ t('classes').value }}</template>
                </n-input-number>
              </div>

              <!-- Attended Classes -->
              <div>
                <div text-sm font-medium mb-2>{{ t('attendedClasses').value }}</div>
                <n-input-number
                  v-model:value="attendedClasses"
                  :min="0"
                  :max="totalClasses || 1000"
                  :placeholder="t('attendedClasses').value"
                  size="large"
                  clearable
                  style="width: 100%"
                >
                  <template #suffix>{{ t('classes').value }}</template>
                </n-input-number>
              </div>

              <!-- Required Percentage -->
              <div>
                <div flex justify-between items-center mb-1>
                  <span text-sm font-medium>{{ t('requiredPercentage').value }}</span>
                  <span text-lg font-bold :style="{ color: status?.color || '#666' }">{{ requiredPercentage }}{{ t('percent').value }}</span>
                </div>
                <n-slider
                  v-model:value="requiredPercentage"
                  :min="50"
                  :max="100"
                  :step="1"
                  :marks="{ 50: '50%', 75: '75%', 80: '80%', 90: '90%', 100: '100%' }"
                />
                <div flex justify-center gap-2 mt-3 flex-wrap>
                  <n-button
                    v-for="pct in quickPercentages"
                    :key="pct"
                    :type="requiredPercentage === pct ? 'primary' : 'default'"
                    size="small"
                    round
                    @click="requiredPercentage = pct"
                  >
                    {{ pct }}%
                  </n-button>
                </div>
              </div>

              <!-- Reset -->
              <n-button quaternary block round @click="reset">
                🔄 {{ t('reset').value }}
              </n-button>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Results -->
        <n-gi span="24 m:12">
          <!-- Result Card -->
          <c-card v-if="currentPercentage !== null" mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('currentPercentage').value }}</div>

            <!-- Big Number -->
            <div text-center mb-6>
              <div text-5xl font-bold :style="{ color: status?.color || '#666' }">
                {{ currentPercentage.toFixed(1) }}%
              </div>
              <div mt-2 :style="{ color: status?.color || '#666' }" text-sm>
                {{ status ? t(status.type).value : '' }}
              </div>
            </div>

            <!-- Progress Bar -->
            <div mb-6>
              <div relative h-6 rounded-full overflow-hidden style="background: rgba(255,255,255,0.05);">
                <div
                  h-full rounded-full transition-all duration-500
                  :style="{
                    width: `${Math.min(currentPercentage, 100)}%`,
                    background: `linear-gradient(90deg, ${status?.color || '#666'}, ${status?.color || '#666'}88)`,
                    boxShadow: `0 0 16px ${status?.color || '#666'}44`,
                  }"
                />
                <!-- Required threshold line -->
                <div
                  absolute top-0 h-full w-0.5
                  style="background: rgba(255,255,255,0.6);"
                  :style="{ left: `${requiredPercentage}%` }"
                />
              </div>
              <div flex justify-between mt-1 text-xs op-50>
                <span>0%</span>
                <span :style="{ color: status?.color }">{{ t('requiredPercentage').value }}: {{ requiredPercentage }}%</span>
                <span>100%</span>
              </div>
            </div>

            <!-- Status Message -->
            <div p-3 rounded-lg mb-4 :style="{ background: `${status?.color}11`, border: `1px solid ${status?.color}33` }">
              <div text-sm :style="{ color: status?.color }">{{ statusMessage }}</div>
            </div>

            <!-- Action Cards -->
            <div grid grid-cols-2 gap-3>
              <div
                v-if="canBunk !== null && canBunk > 0"
                p-4 rounded-xl text-center
                style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2);"
              >
                <div text-3xl font-bold text-green-400>{{ canBunk }}</div>
                <div text-sm op-70 mt-1>{{ t('canBunk').value }}</div>
              </div>
              <div
                v-if="needToAttend !== null && needToAttend > 0"
                p-4 rounded-xl text-center
                style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);"
              >
                <div text-3xl font-bold text-red-400>{{ needToAttend }}</div>
                <div text-sm op-70 mt-1>{{ t('needToAttend').value }}</div>
              </div>
              <div
                v-if="canBunk === 0 && needToAttend === 0"
                p-4 rounded-xl text-center col-span-2
                style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);"
              >
                <div text-3xl font-bold text-blue-400>0</div>
                <div text-sm op-70 mt-1>{{ t('justRight').value }}</div>
              </div>
            </div>

            <!-- Extra Stats -->
            <div mt-4 flex flex-col gap-2>
              <div v-if="bunkedClasses !== null" flex justify-between text-sm p-2 rounded-lg style="background: rgba(255,255,255,0.03);">
                <span op-70>{{ t('bunkedClasses').value }}</span>
                <span font-bold>{{ bunkedClasses }} {{ t('classes').value }}</span>
              </div>
            </div>
          </c-card>

          <!-- Empty State -->
          <c-card v-else mb-4>
            <div text-center py-8>
              <div text-4xl mb-3>📚</div>
              <div text-sm op-50>{{ lang === 'zh' ? '输入课时信息开始计算' : 'Enter class info to calculate' }}</div>
            </div>
          </c-card>

          <!-- Tip Card -->
          <c-card mb-4>
            <div text-lg font-bold mb-3>💡 {{ t('tip').value }}</div>
            <div text-sm leading-relaxed op-70>{{ t('tipContent').value }}</div>
          </c-card>

          <!-- Usage Card -->
          <c-card>
            <div text-lg font-bold mb-3>📖 {{ t('usage').value }}</div>
            <div flex flex-col gap-2>
              <div v-for="i in 3" :key="i" flex items-start gap-2>
                <span text-primary font-bold>{{ i }}.</span>
                <span text-sm op-70>{{ t(`step${i}` as keyof typeof labels.zh).value }}</span>
              </div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
</style>
