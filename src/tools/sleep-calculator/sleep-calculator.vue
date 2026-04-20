<script setup lang="ts">
import { computed, ref } from 'vue';

// i18n labels
const labels = {
  zh: {
    title: '睡眠质量计算器',
    inputSection: '睡眠记录',
    bedTime: '入睡时间',
    wakeTime: '起床时间',
    sleepQuality: '睡眠感受',
    excellent: '非常好',
    good: '较好',
    normal: '一般',
    poor: '较差',
    terrible: '很差',
    calculate: '开始评估',
    results: '评估结果',
    sleepDuration: '睡眠时长',
    efficiency: '睡眠效率',
    qualityScore: '睡眠质量评分',
    healthImpact: '健康影响',
    recommendations: '改善建议',
    yourAge: '您的年龄',
    idealSleep: '理想睡眠时长',
    ageGroup: '年龄段',
    idealRange: '理想时长范围',
    tips: '睡眠小贴士',
    tip1: '保持规律的作息时间，每天同一时间入睡和起床',
    tip2: '睡前1小时避免使用电子设备',
    tip3: '保持卧室温度在18-22°C之间',
    tip4: '避免在下午3点后摄入咖啡因',
    tip5: '睡前避免剧烈运动和大量饮水',
    sleepStages: '睡眠阶段分布',
    deepSleep: '深度睡眠',
    lightSleep: '浅度睡眠',
    remSleep: 'REM睡眠',
    awake: '清醒',
    hours: '小时',
    minutes: '分钟',
    age: '岁',
    adultRange: '成年人 (18-64岁)',
    teenRange: '青少年 (14-17岁)',
    childRange: '儿童 (6-13岁)',
    seniorRange: '老年人 (65岁以上)',
    excellentDesc: '您的睡眠质量非常好，继续保持良好的睡眠习惯！',
    goodDesc: '您的睡眠质量良好，可以适当优化作息时间。',
    normalDesc: '您的睡眠质量一般，建议关注睡眠环境和作息习惯。',
    poorDesc: '您的睡眠质量较差，建议调整作息并改善睡眠环境。',
    terribleDesc: '您的睡眠质量很差，建议咨询医生或睡眠专家。',
    healthWarning: '长期睡眠不足会增加心血管疾病、肥胖和抑郁症的风险',
  },
  en: {
    title: 'Sleep Quality Calculator',
    inputSection: 'Sleep Record',
    bedTime: 'Bedtime',
    wakeTime: 'Wake Time',
    sleepQuality: 'Sleep Quality Feeling',
    excellent: 'Excellent',
    good: 'Good',
    normal: 'Normal',
    poor: 'Poor',
    terrible: 'Terrible',
    calculate: 'Evaluate',
    results: 'Evaluation Results',
    sleepDuration: 'Sleep Duration',
    efficiency: 'Sleep Efficiency',
    qualityScore: 'Sleep Quality Score',
    healthImpact: 'Health Impact',
    recommendations: 'Recommendations',
    yourAge: 'Your Age',
    idealSleep: 'Ideal Sleep Duration',
    ageGroup: 'Age Group',
    idealRange: 'Ideal Duration Range',
    tips: 'Sleep Tips',
    tip1: 'Maintain a regular sleep schedule, go to bed and wake up at the same time',
    tip2: 'Avoid electronic devices 1 hour before bedtime',
    tip3: 'Keep bedroom temperature between 18-22°C (64-72°F)',
    tip4: 'Avoid caffeine intake after 3 PM',
    tip5: 'Avoid vigorous exercise and large amounts of water before bed',
    sleepStages: 'Sleep Stage Distribution',
    deepSleep: 'Deep Sleep',
    lightSleep: 'Light Sleep',
    remSleep: 'REM Sleep',
    awake: 'Awake',
    hours: 'hours',
    minutes: 'min',
    age: 'years old',
    adultRange: 'Adults (18-64 years)',
    teenRange: 'Teenagers (14-17 years)',
    childRange: 'Children (6-13 years)',
    seniorRange: 'Seniors (65+ years)',
    excellentDesc: 'Your sleep quality is excellent! Keep up the good habits!',
    goodDesc: 'Your sleep quality is good. You can optimize your schedule slightly.',
    normalDesc: 'Your sleep quality is average. Consider improving sleep environment.',
    poorDesc: 'Your sleep quality is poor. Adjust your schedule and environment.',
    terribleDesc: 'Your sleep quality is very poor. Consider consulting a doctor.',
    healthWarning: 'Long-term sleep deprivation increases risk of cardiovascular disease, obesity, and depression',
  },
};

// Language switch
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Input parameters
const bedTime = ref<string>('23:00');
const wakeTime = ref<string>('07:00');
const sleepFeeling = ref<'excellent' | 'good' | 'normal' | 'poor' | 'terrible'>('normal');
const age = ref<number>(25);

// Quality feeling options
const qualityOptions = computed(() => [
  { label: labels[lang.value].excellent, value: 'excellent' },
  { label: labels[lang.value].good, value: 'good' },
  { label: labels[lang.value].normal, value: 'normal' },
  { label: labels[lang.value].poor, value: 'poor' },
  { label: labels[lang.value].terrible, value: 'terrible' },
]);

// Calculate sleep duration in minutes
const calculateSleepDuration = () => {
  const [bedHour, bedMin] = bedTime.value.split(':').map(Number);
  const [wakeHour, wakeMin] = wakeTime.value.split(':').map(Number);
  
  let bedMinutes = bedHour * 60 + bedMin;
  let wakeMinutes = wakeHour * 60 + wakeMin;
  
  // If wake time is earlier than bed time, it means sleeping past midnight
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  
  return wakeMinutes - bedMinutes;
};

// Get ideal sleep range by age
const getIdealSleepRange = () => {
  if (age.value >= 65) {
    return { min: 7, max: 8, group: labels[lang.value].seniorRange };
  } else if (age.value >= 18) {
    return { min: 7, max: 9, group: labels[lang.value].adultRange };
  } else if (age.value >= 14) {
    return { min: 8, max: 10, group: labels[lang.value].teenRange };
  } else {
    return { min: 9, max: 11, group: labels[lang.value].childRange };
  }
};

// Calculate sleep quality score (0-100)
const result = computed(() => {
  const durationMinutes = calculateSleepDuration();
  const durationHours = durationMinutes / 60;
  const idealRange = getIdealSleepRange();
  
  // Base score from duration
  let durationScore = 0;
  if (durationHours >= idealRange.min && durationHours <= idealRange.max) {
    durationScore = 100;
  } else if (durationHours < idealRange.min) {
    // Penalize for undersleeping
    const deficit = idealRange.min - durationHours;
    durationScore = Math.max(0, 100 - deficit * 15);
  } else {
    // Penalize for oversleeping (less severe)
    const excess = durationHours - idealRange.max;
    durationScore = Math.max(50, 100 - excess * 8);
  }
  
  // Adjust score based on feeling
  const feelingScores = {
    excellent: 100,
    good: 85,
    normal: 70,
    poor: 50,
    terrible: 25,
  };
  
  const feelingScore = feelingScores[sleepFeeling.value];
  const finalScore = Math.round((durationScore * 0.4 + feelingScore * 0.6));
  
  // Calculate sleep stages (estimated percentages)
  const deepSleepPercent = Math.min(25, 20 + (finalScore - 50) * 0.1);
  const remSleepPercent = Math.min(25, 20 + (finalScore - 50) * 0.05);
  const lightSleepPercent = 100 - deepSleepPercent - remSleepPercent - (100 - finalScore) * 0.3;
  const awakePercent = Math.max(0, (100 - finalScore) * 0.3);
  
  return {
    durationHours: Math.floor(durationHours),
    durationMinutes: durationMinutes % 60,
    totalMinutes: durationMinutes,
    idealRange,
    score: finalScore,
    durationScore: Math.round(durationScore),
    feelingScore,
    stages: {
      deep: deepSleepPercent,
      rem: remSleepPercent,
      light: lightSleepPercent,
      awake: awakePercent,
    },
  };
});

// Get quality level and description
const qualityLevel = computed(() => {
  const score = result.value.score;
  if (score >= 85) return { level: 'excellent', color: '#22c55e' };
  if (score >= 70) return { level: 'good', color: '#84cc16' };
  if (score >= 55) return { level: 'normal', color: '#eab308' };
  if (score >= 40) return { level: 'poor', color: '#f97316' };
  return { level: 'terrible', color: '#ef4444' };
});

// Get description based on quality
const getDescription = () => {
  const descriptions = {
    excellent: labels[lang.value].excellentDesc,
    good: labels[lang.value].goodDesc,
    normal: labels[lang.value].normalDesc,
    poor: labels[lang.value].poorDesc,
    terrible: labels[lang.value].terribleDesc,
  };
  return descriptions[qualityLevel.value.level as keyof typeof descriptions];
};

// Format number with locale
const formatNumber = (num: number) => {
  return num.toFixed(1);
};
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
        <n-grid :cols="3" :x-gap="16" :y-gap="12" responsive="screen" item-responsive>
          <!-- Bedtime -->
          <n-gi span="3 m:1">
            <div mb-1 text-sm op-70>{{ t('bedTime').value }}</div>
            <n-time-picker
              v-model:formatted-value="bedTime"
              format="HH:mm"
              :actions="null"
              size="large"
              style="width: 100%"
            />
          </n-gi>
          
          <!-- Wake Time -->
          <n-gi span="3 m:1">
            <div mb-1 text-sm op-70>{{ t('wakeTime').value }}</div>
            <n-time-picker
              v-model:formatted-value="wakeTime"
              format="HH:mm"
              :actions="null"
              size="large"
              style="width: 100%"
            />
          </n-gi>
          
          <!-- Age -->
          <n-gi span="3 m:1">
            <div mb-1 text-sm op-70>{{ t('yourAge').value }}</div>
            <n-input-number
              v-model:value="age"
              :min="1"
              :max="120"
              size="large"
              style="width: 100%"
            >
              <template #suffix>{{ t('age').value }}</template>
            </n-input-number>
          </n-gi>
          
          <!-- Sleep Quality Feeling -->
          <n-gi span="3">
            <div mb-1 text-sm op-70>{{ t('sleepQuality').value }}</div>
            <n-select
              v-model:value="sleepFeeling"
              :options="qualityOptions"
              size="large"
              style="width: 100%"
            />
          </n-gi>
        </n-grid>
      </c-card>

      <!-- Results Card -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('results').value }}</div>
        
        <!-- Score Display -->
        <div mb-6 p-6 rounded-xl text-center :style="{ background: `linear-gradient(135deg, ${qualityLevel.color}33, ${qualityLevel.color}22)`, border: `1px solid ${qualityLevel.color}55` }">
          <div text-sm op-70 mb-2>{{ t('qualityScore').value }}</div>
          <div text-6xl font-bold mb-2 :style="{ color: qualityLevel.color }">
            {{ result.score }}
          </div>
          <div text-sm op-60>{{ getDescription() }}</div>
        </div>
        
        <!-- Key Metrics -->
        <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- Sleep Duration -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-blue-fade border-blue>
              <div text-sm op-70 mb-1>{{ t('sleepDuration').value }}</div>
              <div text-2xl font-bold text-blue-400>
                {{ result.durationHours }}<span text-sm op-70>{{ t('hours').value }}</span>
                {{ result.durationMinutes }}<span text-sm op-70>{{ t('minutes').value }}</span>
              </div>
            </div>
          </n-gi>
          
          <!-- Ideal Sleep -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-purple-fade border-purple>
              <div text-sm op-70 mb-1>{{ t('idealSleep').value }}</div>
              <div text-2xl font-bold text-purple-400>
                {{ result.idealRange.min }}-{{ result.idealRange.max }}<span text-sm op-70>{{ t('hours').value }}</span>
              </div>
              <div text-xs op-50 mt-1>{{ result.idealRange.group }}</div>
            </div>
          </n-gi>
          
          <!-- Duration Score -->
          <n-gi span="3 m:1">
            <div p-4 rounded-lg bg-green-fade border-green>
              <div text-sm op-70 mb-1>{{ t('efficiency').value }}</div>
              <div text-2xl font-bold text-green-400>{{ result.durationScore }}%</div>
            </div>
          </n-gi>
        </n-grid>
        
        <!-- Sleep Stages Visualization -->
        <div mt-6>
          <div text-lg font-bold mb-3>{{ t('sleepStages').value }}</div>
          <div flex gap-2 mb-3>
            <div
              v-for="(percent, stage) in result.stages"
              :key="stage"
              flex-1
              h-8
              rounded
              :style="{
                background: stage === 'deep' ? '#6366f1' : 
                           stage === 'rem' ? '#a855f7' : 
                           stage === 'light' ? '#60a5fa' : '#f87171',
                opacity: stage === 'awake' ? 0.7 : 1
              }"
              :title="`${stage}: ${formatNumber(percent)}%`"
            />
          </div>
          <n-grid :cols="4" :x-gap="8">
            <n-gi v-for="(percent, stage) in result.stages" :key="stage">
              <div text-center>
                <div text-xs op-60>
                  {{ stage === 'deep' ? t('deepSleep').value : 
                     stage === 'rem' ? t('remSleep').value : 
                     stage === 'light' ? t('lightSleep').value : t('awake').value }}
                </div>
                <div text-sm font-bold>{{ formatNumber(percent) }}%</div>
              </div>
            </n-gi>
          </n-grid>
        </div>
      </c-card>

      <!-- Health Impact Card -->
      <c-card v-if="result.score < 55" mb-4>
        <div flex items-center gap-2>
          <div text-2xl>⚠️</div>
          <div>
            <div font-bold text-orange-400>{{ t('healthImpact').value }}</div>
            <div text-sm op-70>{{ t('healthWarning').value }}</div>
          </div>
        </div>
      </c-card>

      <!-- Tips Card -->
      <c-card>
        <div text-lg font-bold mb-3>{{ t('tips').value }}</div>
        <n-ul>
          <n-li>{{ t('tip1').value }}</n-li>
          <n-li>{{ t('tip2').value }}</n-li>
          <n-li>{{ t('tip3').value }}</n-li>
          <n-li>{{ t('tip4').value }}</n-li>
          <n-li>{{ t('tip5').value }}</n-li>
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
</style>
