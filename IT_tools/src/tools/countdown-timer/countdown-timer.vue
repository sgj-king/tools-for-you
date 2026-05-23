<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useStorage } from '@vueuse/core';

// i18n labels
const labels = {
  zh: {
    title: '倒计时器',
    newCountdown: '创建倒计时',
    name: '事件名称',
    namePlaceholder: '输入事件名称...',
    targetDate: '目标日期',
    targetTime: '目标时间',
    color: '主题色',
    add: '创建',
    myCountdowns: '我的倒计时',
    empty: '暂无倒计时，点击上方创建一个吧',
    days: '天',
    hours: '时',
    minutes: '分',
    seconds: '秒',
    expired: '已到期！',
    ago: '前',
    delete: '删除',
    edit: '编辑',
    preset: '快捷模板',
    presetExam: '期末考试',
    presetGraduate: '毕业典礼',
    presetNewYear: '新年倒计时',
    presetBirthday: '生日倒计时',
    presetDeadline: '项目截止',
    totalDays: '总天数',
    remainingDays: '剩余天数',
    progress: '进度',
    completed: '已完成',
    created: '已创建',
    remaining: '剩余',
    past: '已过去',
    categories: '分类',
    categoryStudy: '学习',
    categoryWork: '工作',
    categoryLife: '生活',
    categoryOther: '其他',
    sortDefault: '默认排序',
    sortNearest: '最近优先',
    sortFarthest: '最远优先',
    copyShare: '复制分享',
    copied: '已复制！',
    today: '今天',
    deleteConfirm: '确定删除这个倒计时吗？',
    noFuture: '请选择未来的日期',
    duplicate: '该事件名称已存在',
  },
  en: {
    title: 'Countdown Timer',
    newCountdown: 'Create Countdown',
    name: 'Event Name',
    namePlaceholder: 'Enter event name...',
    targetDate: 'Target Date',
    targetTime: 'Target Time',
    color: 'Theme Color',
    add: 'Create',
    myCountdowns: 'My Countdowns',
    empty: 'No countdowns yet. Create one above!',
    days: 'Days',
    hours: 'Hrs',
    minutes: 'Min',
    seconds: 'Sec',
    expired: 'Expired!',
    ago: ' ago',
    delete: 'Delete',
    edit: 'Edit',
    preset: 'Quick Presets',
    presetExam: 'Final Exam',
    presetGraduate: 'Graduation',
    presetNewYear: 'New Year',
    presetBirthday: 'Birthday',
    presetDeadline: 'Project Deadline',
    totalDays: 'Total Days',
    remainingDays: 'Remaining',
    progress: 'Progress',
    completed: 'Completed',
    created: 'Created',
    remaining: 'Remaining',
    past: 'Past',
    categories: 'Category',
    categoryStudy: 'Study',
    categoryWork: 'Work',
    categoryLife: 'Life',
    categoryOther: 'Other',
    sortDefault: 'Default',
    sortNearest: 'Nearest First',
    sortFarthest: 'Farthest First',
    copyShare: 'Copy & Share',
    copied: 'Copied!',
    today: 'Today',
    deleteConfirm: 'Delete this countdown?',
    noFuture: 'Please select a future date',
    duplicate: 'Event name already exists',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Types
interface CountdownItem {
  id: string;
  name: string;
  targetDate: string; // ISO date string
  targetTime: string; // HH:mm
  color: string;
  category: 'study' | 'work' | 'life' | 'other';
  createdAt: string; // ISO date string
}

// State
const countdowns = useStorage<CountdownItem[]>('countdown-timer-items', []);
const newName = ref('');
const newDate = ref('');
const newTime = ref('00:00');
const newColor = ref('#18a058');
const newCategory = ref<'study' | 'work' | 'life' | 'other'>('life');
const sortMode = ref<'default' | 'nearest' | 'farthest'>('default');
const now = ref(Date.now());
const copiedId = ref<string | null>(null);
const showModal = ref(false);

// Timer tick
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});
onUnmounted(() => clearInterval(timer));

// Color presets
const colorPresets = [
  '#18a058', '#2080f0', '#f0a020', '#e03050',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#6366f1', '#14b8a6', '#eab308', '#64748b',
];

// Category options
const categoryOptions = computed(() => [
  { label: labels[lang.value].categoryStudy, value: 'study' },
  { label: labels[lang.value].categoryWork, value: 'work' },
  { label: labels[lang.value].categoryLife, value: 'life' },
  { label: labels[lang.value].categoryOther, value: 'other' },
]);

// Sort options
const sortOptions = computed(() => [
  { label: labels[lang.value].sortDefault, value: 'default' },
  { label: labels[lang.value].sortNearest, value: 'nearest' },
  { label: labels[lang.value].sortFarthest, value: 'farthest' },
]);

// Calculate time diff
function getTimeDiff(item: CountdownItem) {
  const target = new Date(`${item.targetDate}T${item.targetTime || '00:00'}`);
  const targetMs = target.getTime();
  const diff = targetMs - now.value;
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const totalSeconds = Math.floor(absDiff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Progress calculation (from creation to target)
  const created = new Date(item.createdAt).getTime();
  const total = targetMs - created;
  let progress = 0;
  if (total > 0) {
    progress = Math.min(100, Math.max(0, ((now.value - created) / total) * 100));
  } else {
    progress = 100;
  }

  return {
    isPast,
    diff,
    days,
    hours,
    minutes,
    seconds,
    progress: Math.round(progress * 10) / 10,
    totalDaysFromCreation: Math.ceil(Math.abs(targetMs - created) / 86400000),
    remainingDays: days,
  };
}

// Sorted countdowns
const sortedCountdowns = computed(() => {
  const items = [...countdowns.value];
  if (sortMode.value === 'nearest') {
    items.sort((a, b) => {
      const diffA = new Date(`${a.targetDate}T${a.targetTime || '00:00'}`).getTime() - now.value;
      const diffB = new Date(`${b.targetDate}T${b.targetTime || '00:00'}`).getTime() - now.value;
      return Math.abs(diffA) - Math.abs(diffB);
    });
  } else if (sortMode.value === 'farthest') {
    items.sort((a, b) => {
      const diffA = new Date(`${a.targetDate}T${a.targetTime || '00:00'}`).getTime() - now.value;
      const diffB = new Date(`${b.targetDate}T${b.targetTime || '00:00'}`).getTime() - now.value;
      return Math.abs(diffB) - Math.abs(diffA);
    });
  }
  return items;
});

// Generate unique ID
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Add countdown
function addCountdown() {
  if (!newName.value.trim() || !newDate.value) return;

  // Check for duplicate name
  if (countdowns.value.some(c => c.name === newName.value.trim())) {
    return;
  }

  countdowns.value.push({
    id: genId(),
    name: newName.value.trim(),
    targetDate: newDate.value,
    targetTime: newTime.value || '00:00',
    color: newColor.value,
    category: newCategory.value,
    createdAt: new Date().toISOString(),
  });

  // Reset form
  newName.value = '';
  newDate.value = '';
  newTime.value = '00:00';
  newColor.value = '#18a058';
  newCategory.value = 'life';
  showModal.value = false;
}

// Delete countdown
function deleteCountdown(id: string) {
  countdowns.value = countdowns.value.filter(c => c.id !== id);
}

// Preset countdowns
function addPreset(preset: 'exam' | 'graduate' | 'newyear' | 'birthday' | 'deadline') {
  const now = new Date();
  const year = now.getFullYear();
  let name = '';
  let date = '';
  let category: CountdownItem['category'] = 'life';

  switch (preset) {
    case 'exam':
      name = labels[lang.value].presetExam;
      // Next Jan or June 15
      date = now.getMonth() < 5
        ? `${year}-06-15`
        : now.getMonth() < 11
          ? `${year + 1}-01-15`
          : `${year + 1}-01-15`;
      category = 'study';
      break;
    case 'graduate':
      name = labels[lang.value].presetGraduate;
      date = `${year + 1}-06-30`;
      category = 'study';
      break;
    case 'newyear':
      name = `${year + 1} ${labels[lang.value].presetNewYear}`;
      date = `${year + 1}-01-01`;
      category = 'life';
      break;
    case 'birthday':
      name = labels[lang.value].presetBirthday;
      date = `${year}-12-25`;
      if (new Date(date) < now) date = `${year + 1}-12-25`;
      category = 'life';
      break;
    case 'deadline':
      name = labels[lang.value].presetDeadline;
      const deadline = new Date(now.getTime() + 30 * 86400000);
      date = deadline.toISOString().slice(0, 10);
      category = 'work';
      break;
  }

  // Don't add if duplicate
  if (countdowns.value.some(c => c.name === name)) return;

  countdowns.value.push({
    id: genId(),
    name,
    targetDate: date,
    targetTime: '00:00',
    color: colorPresets[Math.floor(Math.random() * colorPresets.length)],
    category,
    createdAt: new Date().toISOString(),
  });
}

// Copy countdown text
function copyShare(item: CountdownItem) {
  const diff = getTimeDiff(item);
  const prefix = diff.isPast
    ? (lang.value === 'zh' ? `${item.name} 已过去 ` : `${item.name} was `)
    : (lang.value === 'zh' ? `距离 ${item.name} 还有 ` : `${item.name} in `);

  const text = diff.isPast
    ? `${prefix}${diff.days} ${labels[lang.value].days}`
    : `${prefix}${diff.days} ${labels[lang.value].days} ${diff.hours} ${labels[lang.value].hours} ${diff.minutes} ${labels[lang.value].minutes} ${diff.seconds} ${labels[lang.value].seconds}`;

  navigator.clipboard.writeText(text).then(() => {
    copiedId.value = item.id;
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  });
}

// Format date display
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

// Pad number
function pad(n: number) {
  return n.toString().padStart(2, '0');
}

// Get today string
const todayStr = computed(() => new Date().toISOString().slice(0, 10));
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- Language toggle -->
      <div flex justify-end mb-2>
        <n-button-group size="small">
          <n-button :type="lang === 'zh' ? 'primary' : 'default'" @click="lang = 'zh'">中文</n-button>
          <n-button :type="lang === 'en' ? 'primary' : 'default'" @click="lang = 'en'">EN</n-button>
        </n-button-group>
      </div>

      <!-- Quick presets -->
      <c-card mb-4>
        <div text-lg font-bold mb-3>{{ t('preset') }}</div>
        <n-grid :cols="5" :x-gap="8" :y-gap="8" responsive="screen" item-responsive>
          <n-gi span="5 xs:1 s:1 m:1">
            <n-button quaternary size="small" block @click="addPreset('exam')" style="height: 36px">
              📚 {{ t('presetExam') }}
            </n-button>
          </n-gi>
          <n-gi span="5 xs:1 s:1 m:1">
            <n-button quaternary size="small" block @click="addPreset('graduate')" style="height: 36px">
              🎓 {{ t('presetGraduate') }}
            </n-button>
          </n-gi>
          <n-gi span="5 xs:1 s:1 m:1">
            <n-button quaternary size="small" block @click="addPreset('newyear')" style="height: 36px">
              🎆 {{ t('presetNewYear') }}
            </n-button>
          </n-gi>
          <n-gi span="5 xs:1 s:1 m:1">
            <n-button quaternary size="small" block @click="addPreset('birthday')" style="height: 36px">
              🎂 {{ t('presetBirthday') }}
            </n-button>
          </n-gi>
          <n-gi span="5 xs:1 s:1 m:1">
            <n-button quaternary size="small" block @click="addPreset('deadline')" style="height: 36px">
              📋 {{ t('presetDeadline') }}
            </n-button>
          </n-gi>
        </n-grid>
      </c-card>

      <!-- Create new countdown button -->
      <div mb-4>
        <n-button type="primary" size="large" block @click="showModal = true" style="border-radius: 12px; height: 48px;">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </template>
          {{ t('newCountdown') }}
        </n-button>
      </div>

      <!-- Create modal -->
      <n-modal v-model:show="showModal" preset="card" :title="t('newCountdown')" style="max-width: 500px" :bordered="false" :segmented="{ content: true }">
        <n-form @submit.prevent="addCountdown">
          <n-form-item :label="t('name')">
            <n-input v-model:value="newName" :placeholder="t('namePlaceholder')" maxlength="50" show-count />
          </n-form-item>

          <n-grid :cols="2" :x-gap="12">
            <n-gi>
              <n-form-item :label="t('targetDate')">
                <n-date-picker v-model:formatted-value="newDate" type="date" :is-date-disabled="(ts: number) => ts < Date.now() - 86400000" value-format="yyyy-MM-dd" style="width: 100%" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item :label="t('targetTime')">
                <n-time-picker v-model:formatted-value="newTime" format="HH:mm" value-format="HH:mm" style="width: 100%" />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-form-item :label="t('categories')">
            <n-button-group>
              <n-button v-for="cat in categoryOptions" :key="cat.value" :type="newCategory === cat.value ? 'primary' : 'default'" size="small" @click="newCategory = cat.value">
                {{ cat.label }}
              </n-button>
            </n-button-group>
          </n-form-item>

          <n-form-item :label="t('color')">
            <div flex flex-wrap gap-2>
              <div
                v-for="c in colorPresets" :key="c"
                w-7 h-7 rounded-full cursor-pointer transition-all duration-200
                :style="{
                  backgroundColor: c,
                  transform: newColor === c ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: newColor === c ? `0 0 0 3px ${c}40` : 'none',
                  border: newColor === c ? '2px solid white' : '2px solid transparent',
                }"
                @click="newColor = c"
              />
            </div>
          </n-form-item>

          <n-button type="primary" block attr-type="submit" :disabled="!newName.trim() || !newDate">
            {{ t('add') }}
          </n-button>
        </n-form>
      </n-modal>

      <!-- Sort bar -->
      <div v-if="countdowns.length > 0" flex items-center justify-between mb-4>
        <div text-lg font-bold>{{ t('myCountdowns') }} <span text-sm op-50>({{ countdowns.length }})</span></div>
        <n-button-group size="small">
          <n-button v-for="opt in sortOptions" :key="opt.value" :type="sortMode === opt.value ? 'primary' : 'default'" @click="sortMode = opt.value">
            {{ opt.label }}
          </n-button>
        </n-button-group>
      </div>

      <!-- Empty state -->
      <c-card v-if="countdowns.length === 0" mb-4>
        <div text-center py-8>
          <div text-5xl mb-4>⏳</div>
          <div text-lg op-50>{{ t('empty') }}</div>
        </div>
      </c-card>

      <!-- Countdown cards -->
      <div v-for="item in sortedCountdowns" :key="item.id" mb-4>
        <c-card :style="{ borderLeft: `4px solid ${item.color}` }">
          <div flex items-start justify-between mb-3>
            <div flex-1>
              <div text-xl font-bold :style="{ color: item.color }">{{ item.name }}</div>
              <div text-sm op-60 mt-1>{{ formatDate(item.targetDate) }} {{ item.targetTime !== '00:00' ? item.targetTime : '' }}</div>
            </div>
            <div flex gap-1>
              <n-button quaternary circle size="small" @click="copyShare(item)">
                <template #icon>
                  <span v-if="copiedId === item.id" text-green-400 text-xs>✓</span>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </template>
              </n-button>
              <n-button quaternary circle size="small" type="error" @click="deleteCountdown(item.id)">
                <template #icon>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </template>
              </n-button>
            </div>
          </div>

          <!-- Time display -->
          <div v-if="getTimeDiff(item).isPast" text-center py-2>
            <div text-3xl font-bold :style="{ color: item.color, opacity: 0.6 }">
              {{ t('expired') }}
            </div>
            <div text-sm op-50 mt-1>
              {{ getTimeDiff(item).days }} {{ t('days') }} {{ t('ago') }}
            </div>
          </div>

          <div v-else flex justify-center gap-3 py-3>
            <div v-if="getTimeDiff(item).days > 0" text-center>
              <div text-4xl font-bold :style="{ color: item.color }">
                {{ pad(getTimeDiff(item).days) }}
              </div>
              <div text-xs op-50 mt-1>{{ t('days') }}</div>
            </div>
            <div v-if="getTimeDiff(item).days > 0" text-4xl op-20 self-start mt-1>:</div>
            <div text-center>
              <div text-4xl font-bold :style="{ color: item.color }">
                {{ pad(getTimeDiff(item).hours) }}
              </div>
              <div text-xs op-50 mt-1>{{ t('hours') }}</div>
            </div>
            <div text-4xl op-20 self-start mt-1>:</div>
            <div text-center>
              <div text-4xl font-bold :style="{ color: item.color }">
                {{ pad(getTimeDiff(item).minutes) }}
              </div>
              <div text-xs op-50 mt-1>{{ t('minutes') }}</div>
            </div>
            <div text-4xl op-20 self-start mt-1>:</div>
            <div text-center>
              <div text-4xl font-bold :style="{ color: item.color }">
                {{ pad(getTimeDiff(item).seconds) }}
              </div>
              <div text-xs op-50 mt-1>{{ t('seconds') }}</div>
            </div>
          </div>

          <!-- Progress bar -->
          <div v-if="!getTimeDiff(item).isPast" mb-2>
            <div relative h-2 rounded-full overflow-hidden style="background: rgba(255,255,255,0.08)">
              <div
                h-full rounded-full transition-all duration-1000
                :style="{
                  width: `${getTimeDiff(item).progress}%`,
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                  boxShadow: `0 0 8px ${item.color}60`,
                }"
              />
            </div>
            <div flex justify-between mt-1 text-xs op-40>
              <span>{{ t('progress') }} {{ getTimeDiff(item).progress }}%</span>
              <span>{{ t('remainingDays') }}: {{ getTimeDiff(item).remainingDays }} {{ t('days').toLowerCase() }}</span>
            </div>
          </div>

          <!-- Category tag -->
          <div mt-2>
            <n-tag size="small" :bordered="false" :type="
              item.category === 'study' ? 'info' :
              item.category === 'work' ? 'warning' :
              item.category === 'life' ? 'success' : 'default'
            ">
              {{
                item.category === 'study' ? (lang === 'zh' ? '学习' : 'Study') :
                item.category === 'work' ? (lang === 'zh' ? '工作' : 'Work') :
                item.category === 'life' ? (lang === 'zh' ? '生活' : 'Life') :
                (lang === 'zh' ? '其他' : 'Other')
              }}
            </n-tag>
          </div>
        </c-card>
      </div>

      <!-- Info section -->
      <c-card v-if="countdowns.length > 0" mt-2>
        <div flex items-start gap-2 p-2>
          <span text-lg>💡</span>
          <div text-xs leading-relaxed op-60>
            <template v-if="lang === 'zh'">
              数据保存在本地浏览器中，刷新页面不会丢失。点击分享按钮可复制倒计时文字，支持中英文切换。
            </template>
            <template v-else>
              Data is saved locally in your browser and persists across page refreshes. Click the share button to copy countdown text. Supports Chinese/English switching.
            </template>
          </div>
        </div>
      </c-card>
    </div>
  </div>
</template>

<style scoped>
:deep(.n-date-picker) {
  width: 100%;
}
:deep(.n-time-picker) {
  width: 100%;
}
</style>
