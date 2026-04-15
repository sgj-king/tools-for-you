<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { computed, ref } from 'vue';

// 持久化存储数据
const totalClasses = ref<number | null>(null);
const attendedClasses = ref<number | null>(null);
const requiredPercentage = useStorage('attendance-required-percentage', 75);

// 计算当前出勤率
const currentPercentage = computed(() => {
  if (!totalClasses.value || totalClasses.value === 0 || attendedClasses.value === null) {
    return null;
  }
  return (attendedClasses.value / totalClasses.value) * 100;
});

// 计算可以逃课的节数
const canBunk = computed(() => {
  if (!totalClasses.value || totalClasses.value === 0 || attendedClasses.value === null) {
    return null;
  }
  // 计算在保持最低出勤率的情况下，还能逃多少节课
  // 设可逃节数为x，则有：(attended / (total + x)) >= required/100
  // 解得：x <= attended * 100 / required - total
  const bunkable = Math.floor(attendedClasses.value * 100 / requiredPercentage.value - totalClasses.value);
  return Math.max(0, bunkable);
});

// 计算需要补上的节数
const needToAttend = computed(() => {
  if (!totalClasses.value || totalClasses.value === 0 || attendedClasses.value === null) {
    return null;
  }
  // 计算需要再上多少节才能达到最低出勤率
  // 设需要再上节数为y，则有：(attended + y) / (total + y) >= required/100
  // 解得：y >= (required * total - 100 * attended) / (100 - required)
  const needed = Math.ceil((requiredPercentage.value * totalClasses.value - 100 * attendedClasses.value) / (100 - requiredPercentage.value));
  return Math.max(0, needed);
});

// 状态判断
const status = computed(() => {
  if (currentPercentage.value === null) return null;
  const pct = currentPercentage.value;
  const req = requiredPercentage.value;
  
  if (pct >= req + 10) {
    return { type: 'success', text: '安全', icon: '✨' };
  } else if (pct >= req) {
    return { type: 'warning', text: '警告', icon: '⚠️' };
  } else {
    return { type: 'error', text: '危险', icon: '🚨' };
  }
});

// 进度条颜色
const progressColor = computed(() => {
  if (currentPercentage.value === null) return '#666';
  const pct = currentPercentage.value;
  const req = requiredPercentage.value;
  
  if (pct >= req + 10) return '#18a058';
  if (pct >= req) return '#f0a020';
  return '#d03050';
});

// 快捷设置出勤率
const quickPercentages = [60, 70, 75, 80, 85, 90];

// 重置
function reset() {
  totalClasses.value = null;
  attendedClasses.value = null;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 600px">
      <!-- 结果展示卡片 -->
      <c-card mb-4>
        <div flex flex-col gap-4>
          <!-- 出勤率显示 -->
          <div flex justify-center items-center gap-4>
            <div text-center>
              <div text-5xl font-bold :style="{ color: progressColor }">
                {{ currentPercentage !== null ? currentPercentage.toFixed(1) : '0.0' }}%
              </div>
              <div text-sm op-60 mt-1>{{ '当前出勤率' }}</div>
            </div>
          </div>

          <!-- 进度条 -->
          <div v-if="currentPercentage !== null">
            <n-progress
              type="line"
              :percentage="Math.min(currentPercentage, 100)"
              :color="progressColor"
              :height="24"
              :border-radius="12"
              :indicator-placement="'inside'"
            >
              <template #default="{ percentage }">
                <span text-sm font-bold>{{ percentage.toFixed(1) }}%</span>
              </template>
            </n-progress>
            <div flex justify-between mt-1>
              <span text-xs op-50>0%</span>
              <span text-xs :style="{ color: `var(--${status?.type}-color)` }">
                {{ '要求' }}: {{ requiredPercentage }}%
              </span>
              <span text-xs op-50>100%</span>
            </div>
          </div>

          <!-- 状态提示 -->
          <div v-if="status" flex justify-center>
            <n-tag :type="status.type as 'success' | 'warning' | 'error'" size="large" round>
              <template #icon>
                <span mr-1>{{ status.icon }}</span>
              </template>
              {{ status.text }}
            </n-tag>
          </div>

          <!-- 结果详情 -->
          <div v-if="totalClasses && attendedClasses !== null" grid grid-cols-2 gap-4 mt-2>
            <c-card v-if="canBunk !== null && canBunk > 0" bg="success/10" bordered>
              <div text-center>
                <div text-3xl font-bold text-success>{{ canBunk }}</div>
                <div text-sm op-70>{{ '可以翘课' }}</div>
              </div>
            </c-card>
            <c-card v-if="needToAttend !== null && needToAttend > 0" bg="error/10" bordered>
              <div text-center>
                <div text-3xl font-bold text-error>{{ needToAttend }}</div>
                <div text-sm op-70>{{ '需要上课' }}</div>
              </div>
            </c-card>
            <c-card v-if="(canBunk === 0 && needToAttend === 0) || (canBunk === 0 && needToAttend === 0)" bg="info/10" bordered col-span-2>
              <div text-center>
                <div text-3xl font-bold text-info>0</div>
                <div text-sm op-70>{{ '刚好达标' }}</div>
              </div>
            </c-card>
          </div>
        </div>
      </c-card>

      <!-- 输入区域 -->
      <c-card mb-4>
        <div flex flex-col gap-4>
          <!-- 总课程数 -->
          <div>
            <div text-sm font-medium mb-2>{{ '总课时' }}</div>
            <n-input-number
              v-model:value="totalClasses"
              :min="0"
              :max="1000"
              :placeholder="'总课时数'"
              size="large"
              clearable
              style="width: 100%"
            />
          </div>

          <!-- 已出勤节数 -->
          <div>
            <div text-sm font-medium mb-2>{{ '已上课时' }}</div>
            <n-input-number
              v-model:value="attendedClasses"
              :min="0"
              :max="totalClasses || 1000"
              :placeholder="'已上的课时数'"
              size="large"
              clearable
              style="width: 100%"
            />
          </div>

          <!-- 最低出勤率要求 -->
          <div>
            <div flex justify-between items-center mb-2>
              <span text-sm font-medium>{{ '要求出勤率 (%)' }}</span>
              <span text-lg font-bold :style="{ color: `var(--primary-color)` }">{{ requiredPercentage }}%</span>
            </div>
            <n-slider
              v-model:value="requiredPercentage"
              :min="50"
              :max="100"
              :step="1"
              :marks="{ 50: '50%', 75: '75%', 90: '90%', 100: '100%' }"
            />
            <div flex justify-center gap-2 mt-3 flex-wrap>
              <n-button
                v-for="pct in quickPercentages"
                :key="pct"
                :type="requiredPercentage === pct ? 'primary' : 'default'"
                size="small"
                @click="requiredPercentage = pct"
              >
                {{ pct }}%
              </n-button>
            </div>
          </div>

          <!-- 重置按钮 -->
          <n-button quaternary block @click="reset">
            {{ '重置' }}
          </n-button>
        </div>
      </c-card>

      <!-- 说明卡片 -->
      <c-card>
        <div text-lg font-bold mb-3>{{ '使用说明' }}</div>
        <n-list>
          <n-list-item>
            <div flex items-start gap-2>
              <span text-primary font-bold>1.</span>
              <span>{{ '1. 输入总课时数' }}</span>
            </div>
          </n-list-item>
          <n-list-item>
            <div flex items-start gap-2>
              <span text-primary font-bold>2.</span>
              <span>{{ '2. 输入已上课时数' }}</span>
            </div>
          </n-list-item>
          <n-list-item>
            <div flex items-start gap-2>
              <span text-primary font-bold>3.</span>
              <span>{{ '3. 输入要求出勤率' }}</span>
            </div>
          </n-list-item>
        </n-list>
      </c-card>
    </div>
  </div>
</template>
