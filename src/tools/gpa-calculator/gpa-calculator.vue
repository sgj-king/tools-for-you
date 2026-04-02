<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { DeleteOutlined, AddCircleOutlined } from '@vicons/material';

interface Course {
  id: number;
  name: string;
  credits: number | null;
  grade: string;
}

const { t } = useI18n();

// 持久化存储课程数据
const courses = useStorage<Course[]>('gpa-courses', [
  { id: 1, name: '', credits: null, grade: '' },
]);

// GPA 4.0 标准评分体系
const gradePoints: Record<string, number> = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
};

const gradeOptions = Object.keys(gradePoints);

// 添加课程
function addCourse() {
  const newId = courses.value.length > 0 ? Math.max(...courses.value.map(c => c.id)) + 1 : 1;
  courses.value.push({
    id: newId,
    name: '',
    credits: null,
    grade: '',
  });
}

// 删除课程
function removeCourse(id: number) {
  if (courses.value.length > 1) {
    courses.value = courses.value.filter(c => c.id !== id);
  }
}

// 清空所有课程
function clearAllCourses() {
  courses.value = [{ id: 1, name: '', credits: null, grade: '' }];
}

// 计算 GPA
const gpaResult = computed(() => {
  let totalCredits = 0;
  let totalGradePoints = 0;
  let validCourses = 0;

  for (const course of courses.value) {
    if (course.credits && course.credits > 0 && course.grade && gradePoints[course.grade] !== undefined) {
      totalCredits += course.credits;
      totalGradePoints += course.credits * gradePoints[course.grade];
      validCourses++;
    }
  }

  if (totalCredits === 0) {
    return { gpa: null, totalCredits: 0, courseCount: 0 };
  }

  return {
    gpa: (totalGradePoints / totalCredits).toFixed(2),
    totalCredits,
    courseCount: validCourses,
  };
});

// GPA 等级描述
const gpaLevel = computed(() => {
  const gpa = parseFloat(gpaResult.value.gpa || '0');
  if (gpa >= 3.7) return { text: t('tools.gpa-calculator.excellent'), color: 'success' };
  if (gpa >= 3.0) return { text: t('tools.gpa-calculator.good'), color: 'info' };
  if (gpa >= 2.0) return { text: t('tools.gpa-calculator.average'), color: 'warning' };
  return { text: t('tools.gpa-calculator.needsImprovement'), color: 'error' };
});
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 800px">
      <!-- GPA 结果展示卡片 -->
      <c-card mb-4>
        <div flex flex-col items-center gap-4>
          <div text-center>
            <div text-4xl font-bold mb-2 :style="{ color: `var(--${gpaLevel.color}-color)` }">
              {{ gpaResult.gpa || '0.00' }}
            </div>
            <n-tag :type="gpaLevel.color as 'success' | 'info' | 'warning' | 'error'" size="small">
              {{ gpaLevel.text }}
            </n-tag>
          </div>
          <div flex gap-8 text-center>
            <div>
              <div text-2xl font-bold>{{ gpaResult.totalCredits }}</div>
              <div text-sm op-60>{{ t('tools.gpa-calculator.totalCredits') }}</div>
            </div>
            <div>
              <div text-2xl font-bold>{{ gpaResult.courseCount }}</div>
              <div text-sm op-60>{{ t('tools.gpa-calculator.courseCount') }}</div>
            </div>
          </div>
        </div>
      </c-card>

      <!-- 课程列表 -->
      <c-card mb-4>
        <div flex justify-between items-center mb-4>
          <div text-lg font-bold>{{ t('tools.gpa-calculator.courseList') }}</div>
          <n-button quaternary size="small" @click="clearAllCourses">
            <template #icon>
              <n-icon :component="DeleteOutlined" />
            </template>
            {{ t('tools.gpa-calculator.clearAll') }}
          </n-button>
        </div>

        <!-- 表头 -->
        <div grid grid-cols-12 gap-2 mb-2 px-2 text-sm op-60>
          <div col-span-4>{{ t('tools.gpa-calculator.courseName') }}</div>
          <div col-span-3 text-center>{{ t('tools.gpa-calculator.credits') }}</div>
          <div col-span-3 text-center>{{ t('tools.gpa-calculator.grade') }}</div>
          <div col-span-2></div>
        </div>

        <!-- 课程行 -->
        <div v-for="course in courses" :key="course.id" grid grid-cols-12 gap-2 mb-2 items-center>
          <div col-span-4>
            <n-input
              v-model:value="course.name"
              :placeholder="t('tools.gpa-calculator.courseNamePlaceholder')"
              size="small"
            />
          </div>
          <div col-span-3>
            <n-input-number
              v-model:value="course.credits"
              :min="0"
              :max="10"
              :step="0.5"
              size="small"
              placeholder="0"
              style="width: 100%"
            />
          </div>
          <div col-span-3>
            <n-select
              v-model:value="course.grade"
              :options="gradeOptions.map(g => ({ label: g, value: g }))"
              :placeholder="t('tools.gpa-calculator.selectGrade')"
              size="small"
              style="width: 100%"
            />
          </div>
          <div col-span-2 flex justify-center>
            <n-button
              quaternary
              circle
              size="small"
              :disabled="courses.length <= 1"
              @click="removeCourse(course.id)"
            >
              <template #icon>
                <n-icon :component="DeleteOutlined" />
              </template>
            </n-button>
          </div>
        </div>

        <!-- 添加课程按钮 -->
        <n-button dashed block mt-2 @click="addCourse">
          <template #icon>
            <n-icon :component="AddCircleOutlined" />
          </template>
          {{ t('tools.gpa-calculator.addCourse') }}
        </n-button>
      </c-card>

      <!-- 评分标准说明 -->
      <c-card>
        <div text-lg font-bold mb-3>{{ t('tools.gpa-calculator.gradingScale') }}</div>
        <n-grid :cols="4" :x-gap="12" :y-gap="8" responsive="screen">
          <n-gi v-for="(point, grade) in gradePoints" :key="grade">
            <div flex justify-between px-2 py-1 rounded bg-dark>
              <span font-bold>{{ grade }}</span>
              <span op-70>{{ point.toFixed(1) }}</span>
            </div>
          </n-gi>
        </n-grid>
      </c-card>
    </div>
  </div>
</template>
