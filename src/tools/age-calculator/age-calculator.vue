<script setup lang="ts">
import { computed, ref } from 'vue';

const { t } = useI18n();

// 出生日期
const birthDate = ref<Date | null>(null);

// 计算结果
const result = computed(() => {
  if (!birthDate.value) {
    return null;
  }

  const birth = new Date(birthDate.value);
  const today = new Date();

  if (birth > today) {
    return null;
  }

  // 计算年龄
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // 计算总天数
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 计算总周数和总月数
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;

  // 计算总小时数、分钟数、秒数
  const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
  const totalMinutes = Math.floor(diffTime / (1000 * 60));
  const totalSeconds = Math.floor(diffTime / 1000);

  // 计算下次生日
  let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday <= today) {
    nextBirthday = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  }
  const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 星座计算
  const zodiacSign = getZodiacSign(birth.getMonth() + 1, birth.getDate());

  // 生肖计算
  const chineseZodiac = getChineseZodiac(birth.getFullYear());

  // 生活统计
  const heartbeats = Math.floor(totalSeconds * 1.2); // 平均每分钟72次心跳
  const breaths = Math.floor(totalMinutes * 16); // 平均每分钟16次呼吸
  const laughs = Math.floor(totalDays * 15); // 平均每天笑15次
  const dreams = Math.floor(totalDays * 4); // 平均每晚做梦4次

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalMonths,
    totalHours,
    totalMinutes,
    totalSeconds,
    daysToNextBirthday,
    nextBirthdayAge: nextBirthday.getFullYear() - birth.getFullYear(),
    zodiacSign,
    chineseZodiac,
    heartbeats,
    breaths,
    laughs,
    dreams,
    birthDayOfWeek: getDayOfWeek(birth),
  };
});

// 获取星座
function getZodiacSign(month: number, day: number): string {
  const signs = [
    { name: '♑ 摩羯座', start: [1, 1], end: [1, 19] },
    { name: '♒ 水瓶座', start: [1, 20], end: [2, 18] },
    { name: '♓ 双鱼座', start: [2, 19], end: [3, 20] },
    { name: '♈ 白羊座', start: [3, 21], end: [4, 19] },
    { name: '♉ 金牛座', start: [4, 20], end: [5, 20] },
    { name: '♊ 双子座', start: [5, 21], end: [6, 21] },
    { name: '♋ 巨蟹座', start: [6, 22], end: [7, 22] },
    { name: '♌ 狮子座', start: [7, 23], end: [8, 22] },
    { name: '♍ 处女座', start: [8, 23], end: [9, 22] },
    { name: '♎ 天秤座', start: [9, 23], end: [10, 23] },
    { name: '♏ 天蝎座', start: [10, 24], end: [11, 22] },
    { name: '♐ 射手座', start: [11, 23], end: [12, 21] },
    { name: '♑ 摩羯座', start: [12, 22], end: [12, 31] },
  ];

  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;
    if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return sign.name;
    }
  }
  return '';
}

// 获取生肖
function getChineseZodiac(year: number): string {
  const zodiacs = ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊'];
  return zodiacs[year % 12];
}

// 获取星期几
function getDayOfWeek(date: Date): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

// 格式化数字（添加千位分隔符）
function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 800px">
      <!-- 输入参数卡片 -->
      <c-card mb-4>
        <div text-lg font-bold mb-4>{{ t('tools.age-calculator.parameters') }}</div>
        
        <!-- 出生日期选择 -->
        <div>
          <div mb-1 text-sm op-70>{{ t('tools.age-calculator.birthDate') }}</div>
          <n-date-picker
            v-model:value="birthDate"
            type="date"
            :placeholder="t('tools.age-calculator.birthPlaceholder')"
            style="width: 100%"
            size="large"
          />
        </div>
      </c-card>

      <!-- 结果展示 -->
      <c-card v-if="result" mb-4>
        <div text-lg font-bold mb-4>{{ t('tools.age-calculator.result') }}</div>
        
        <!-- 主要年龄显示 -->
        <div mb-6 p-6 rounded-xl bg-gradient-primary text-center>
          <div text-sm op-80 mb-2>{{ t('tools.age-calculator.yourAge') }}</div>
          <div text-5xl font-bold mb-2>
            {{ result.years }}<span text-2xl op-70>{{ t('tools.age-calculator.years') }}</span>
            {{ result.months }}<span text-2xl op-70>{{ t('tools.age-calculator.months') }}</span>
            {{ result.days }}<span text-2xl op-70>{{ t('tools.age-calculator.days') }}</span>
          </div>
          <div text-sm op-70>{{ t('tools.age-calculator.bornOn', { day: result.birthDayOfWeek }) }}</div>
        </div>

        <!-- 详细数据卡片 -->
        <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <!-- 总天数 -->
          <n-gi span="1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-xs op-60 mb-1>{{ t('tools.age-calculator.totalDays') }}</div>
              <div text-xl font-bold>{{ formatNumber(result.totalDays) }}</div>
            </div>
          </n-gi>
          <!-- 总周数 -->
          <n-gi span="1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-xs op-60 mb-1>{{ t('tools.age-calculator.totalWeeks') }}</div>
              <div text-xl font-bold>{{ formatNumber(result.totalWeeks) }}</div>
            </div>
          </n-gi>
          <!-- 总月数 -->
          <n-gi span="1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-xs op-60 mb-1>{{ t('tools.age-calculator.totalMonths') }}</div>
              <div text-xl font-bold>{{ formatNumber(result.totalMonths) }}</div>
            </div>
          </n-gi>
          <!-- 总小时数 -->
          <n-gi span="1">
            <div p-4 rounded-lg bg-dark-200>
              <div text-xs op-60 mb-1>{{ t('tools.age-calculator.totalHours') }}</div>
              <div text-xl font-bold>{{ formatNumber(result.totalHours) }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- 下次生日倒计时 -->
        <div mt-4 p-5 rounded-xl bg-birthday border-birthday>
          <div flex items-center justify-between>
            <div>
              <div text-sm op-70 mb-1>{{ t('tools.age-calculator.nextBirthday') }}</div>
              <div text-2xl font-bold>
                <span text-pink-400>{{ result.daysToNextBirthday }}</span>
                <span text-sm op-70 ml-1>{{ t('tools.age-calculator.daysLeft') }}</span>
              </div>
            </div>
            <div text-right>
              <div text-sm op-70 mb-1>{{ t('tools.age-calculator.turningAge') }}</div>
              <div text-2xl font-bold text-pink-400>{{ result.nextBirthdayAge }}</div>
            </div>
          </div>
        </div>

        <!-- 星座与生肖 -->
        <n-grid :cols="2" :x-gap="12" mt-4>
          <n-gi>
            <div p-4 rounded-lg bg-zodiac border-zodiac text-center>
              <div text-xs op-60 mb-1>{{ t('tools.age-calculator.zodiac') }}</div>
              <div text-lg font-bold>{{ result.zodiacSign }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div p-4 rounded-lg bg-chinese-zodiac border-chinese-zodiac text-center>
              <div text-xs op-60 mb-1>{{ t('tools.age-calculator.chineseZodiac') }}</div>
              <div text-lg font-bold>属{{ result.chineseZodiac }}</div>
            </div>
          </n-gi>
        </n-grid>

        <!-- 生活统计 -->
        <div mt-6>
          <div text-lg font-bold mb-3>{{ t('tools.age-calculator.lifeStats') }}</div>
          <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
            <n-gi span="1">
              <div p-4 rounded-lg bg-stats-heartbeat border-stats-heartbeat>
                <div text-xs op-60 mb-1>{{ t('tools.age-calculator.heartbeats') }}</div>
                <div text-xl font-bold text-red-400>❤️ {{ formatNumber(result.heartbeats) }}</div>
              </div>
            </n-gi>
            <n-gi span="1">
              <div p-4 rounded-lg bg-stats-breath border-stats-breath>
                <div text-xs op-60 mb-1>{{ t('tools.age-calculator.breaths') }}</div>
                <div text-xl font-bold text-cyan-400>💨 {{ formatNumber(result.breaths) }}</div>
              </div>
            </n-gi>
            <n-gi span="1">
              <div p-4 rounded-lg bg-stats-laugh>
                <div text-xs op-60 mb-1>{{ t('tools.age-calculator.laughs') }}</div>
                <div text-xl font-bold text-yellow-400>😄 {{ formatNumber(result.laughs) }}</div>
              </div>
            </n-gi>
            <n-gi span="1">
              <div p-4 rounded-lg bg-stats-dream>
                <div text-xs op-60 mb-1>{{ t('tools.age-calculator.dreams') }}</div>
                <div text-xl font-bold text-purple-400>💤 {{ formatNumber(result.dreams) }}</div>
              </div>
            </n-gi>
          </n-grid>
        </div>
      </c-card>

      <!-- 使用说明 -->
      <c-card>
        <div text-lg font-bold mb-3>{{ t('tools.age-calculator.howToUse') }}</div>
        <n-ul>
          <n-li>{{ t('tools.age-calculator.step1') }}</n-li>
          <n-li>{{ t('tools.age-calculator.step2') }}</n-li>
          <n-li>{{ t('tools.age-calculator.step3') }}</n-li>
        </n-ul>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
.bg-dark-200 {
  background: rgba(255, 255, 255, 0.05);
}

.bg-gradient-primary {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2));
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.bg-birthday {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(236, 72, 153, 0.1));
}

.border-birthday {
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.bg-zodiac {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
}

.border-zodiac {
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.bg-chinese-zodiac {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
}

.border-chinese-zodiac {
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.bg-stats-heartbeat {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
}

.border-stats-heartbeat {
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.bg-stats-breath {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(34, 211, 238, 0.05));
}

.border-stats-breath {
  border: 1px solid rgba(34, 211, 238, 0.2);
}

.bg-stats-laugh {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05));
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.bg-stats-dream {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05));
  border: 1px solid rgba(168, 85, 247, 0.2);
}
</style>
