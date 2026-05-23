<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStorage } from '@vueuse/core';
import {
  NButton, NInput, NModal, NSelect, NIcon, NTag,
  NTooltip, NPopconfirm, NScrollbar,
} from 'naive-ui';
import {
  Plus, Trash, Search, Globe, Clock,
  Briefcase, CalendarEvent, Plus as Add,
} from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '世界时钟',
    subtitle: '多时区实时时钟，轻松规划跨国会议与日程',
    addCity: '添加城市',
    searchCity: '搜索城市...',
    myCities: '我的时区',
    empty: '还没有添加城市，点击「添加城市」开始 ✨',
    delete: '移除',
    deleteConfirm: '确定移除这个城市吗？',
    workHours: '工作时间',
    offHours: '非工作时间',
    sleepHours: '深夜',
    timeDiff: '时差',
    ahead: '快',
    behind: '慢',
    same: '相同',
    meetingPlanner: '会议规划',
    meetingTime: '选择会议时间',
    meetingYourTime: '您的本地时间',
    noOverlap: '没有共同工作时间',
    overlapFound: '找到共同工作时间段',
    hours: '时',
    minutes: '分',
    seconds: '秒',
    today: '今天',
    tomorrow: '明天',
    yesterday: '昨天',
    format12: '12小时制',
    format24: '24小时制',
    settings: '设置',
    localTime: '本地时间',
    hourAhead: '小时快',
    hourBehind: '小时慢',
    noResults: '没有找到匹配的城市',
    quickAdd: '快捷添加',
    presetBeijing: '北京',
    presetTokyo: '东京',
    presetLondon: '伦敦',
    presetNewYork: '纽约',
    presetLA: '洛杉矶',
    presetSydney: '悉尼',
    presetParis: '巴黎',
    presetDubai: '迪拜',
    presetSingapore: '新加坡',
    presetMoscow: '莫斯科',
    presetBerlin: '柏林',
    presetSeoul: '首尔',
    exportTime: '导出时间表',
    am: '上午',
    pm: '下午',
  },
  en: {
    title: 'World Clock',
    subtitle: 'Multi-timezone live clock, plan international meetings with ease',
    addCity: 'Add City',
    searchCity: 'Search city...',
    myCities: 'My Timezones',
    empty: 'No cities added yet. Click "Add City" to start! ✨',
    delete: 'Remove',
    deleteConfirm: 'Remove this city?',
    workHours: 'Work Hours',
    offHours: 'Off Hours',
    sleepHours: 'Late Night',
    timeDiff: 'Time Diff',
    ahead: 'ahead',
    behind: 'behind',
    same: 'same',
    meetingPlanner: 'Meeting Planner',
    meetingTime: 'Select meeting time',
    meetingYourTime: 'Your local time',
    noOverlap: 'No overlapping work hours',
    overlapFound: 'Overlapping work hours found',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    format12: '12h',
    format24: '24h',
    settings: 'Settings',
    localTime: 'Local Time',
    hourAhead: 'h ahead',
    hourBehind: 'h behind',
    noResults: 'No matching cities found',
    quickAdd: 'Quick Add',
    presetBeijing: 'Beijing',
    presetTokyo: 'Tokyo',
    presetLondon: 'London',
    presetNewYork: 'New York',
    presetLA: 'Los Angeles',
    presetSydney: 'Sydney',
    presetParis: 'Paris',
    presetDubai: 'Dubai',
    presetSingapore: 'Singapore',
    presetMoscow: 'Moscow',
    presetBerlin: 'Berlin',
    presetSeoul: 'Seoul',
    exportTime: 'Export Schedule',
    am: 'AM',
    pm: 'PM',
  },
};

const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// ===================== Timezone data =====================
interface TimezoneCity {
  id: string;
  name: string;
  nameEn: string;
  tz: string;
  country: string;
  countryEn: string;
  emoji: string;
}

const allCities: TimezoneCity[] = [
  { id: 'beijing', name: '北京', nameEn: 'Beijing', tz: 'Asia/Shanghai', country: '中国', countryEn: 'China', emoji: '🇨🇳' },
  { id: 'shanghai', name: '上海', nameEn: 'Shanghai', tz: 'Asia/Shanghai', country: '中国', countryEn: 'China', emoji: '🇨🇳' },
  { id: 'hongkong', name: '香港', nameEn: 'Hong Kong', tz: 'Asia/Hong_Kong', country: '中国', countryEn: 'China', emoji: '🇭🇰' },
  { id: 'taipei', name: '台北', nameEn: 'Taipei', tz: 'Asia/Taipei', country: '中国', countryEn: 'China', emoji: '🇹🇼' },
  { id: 'tokyo', name: '东京', nameEn: 'Tokyo', tz: 'Asia/Tokyo', country: '日本', countryEn: 'Japan', emoji: '🇯🇵' },
  { id: 'seoul', name: '首尔', nameEn: 'Seoul', tz: 'Asia/Seoul', country: '韩国', countryEn: 'Korea', emoji: '🇰🇷' },
  { id: 'singapore', name: '新加坡', nameEn: 'Singapore', tz: 'Asia/Singapore', country: '新加坡', countryEn: 'Singapore', emoji: '🇸🇬' },
  { id: 'bangkok', name: '曼谷', nameEn: 'Bangkok', tz: 'Asia/Bangkok', country: '泰国', countryEn: 'Thailand', emoji: '🇹🇭' },
  { id: 'dubai', name: '迪拜', nameEn: 'Dubai', tz: 'Asia/Dubai', country: '阿联酋', countryEn: 'UAE', emoji: '🇦🇪' },
  { id: 'mumbai', name: '孟买', nameEn: 'Mumbai', tz: 'Asia/Kolkata', country: '印度', countryEn: 'India', emoji: '🇮🇳' },
  { id: 'moscow', name: '莫斯科', nameEn: 'Moscow', tz: 'Europe/Moscow', country: '俄罗斯', countryEn: 'Russia', emoji: '🇷🇺' },
  { id: 'istanbul', name: '伊斯坦布尔', nameEn: 'Istanbul', tz: 'Europe/Istanbul', country: '土耳其', countryEn: 'Turkey', emoji: '🇹🇷' },
  { id: 'london', name: '伦敦', nameEn: 'London', tz: 'Europe/London', country: '英国', countryEn: 'UK', emoji: '🇬🇧' },
  { id: 'paris', name: '巴黎', nameEn: 'Paris', tz: 'Europe/Paris', country: '法国', countryEn: 'France', emoji: '🇫🇷' },
  { id: 'berlin', name: '柏林', nameEn: 'Berlin', tz: 'Europe/Berlin', country: '德国', countryEn: 'Germany', emoji: '🇩🇪' },
  { id: 'rome', name: '罗马', nameEn: 'Rome', tz: 'Europe/Rome', country: '意大利', countryEn: 'Italy', emoji: '🇮🇹' },
  { id: 'amsterdam', name: '阿姆斯特丹', nameEn: 'Amsterdam', tz: 'Europe/Amsterdam', country: '荷兰', countryEn: 'Netherlands', emoji: '🇳🇱' },
  { id: 'madrid', name: '马德里', nameEn: 'Madrid', tz: 'Europe/Madrid', country: '西班牙', countryEn: 'Spain', emoji: '🇪🇸' },
  { id: 'zurich', name: '苏黎世', nameEn: 'Zurich', tz: 'Europe/Zurich', country: '瑞士', countryEn: 'Switzerland', emoji: '🇨🇭' },
  { id: 'cairo', name: '开罗', nameEn: 'Cairo', tz: 'Africa/Cairo', country: '埃及', countryEn: 'Egypt', emoji: '🇪🇬' },
  { id: 'johannesburg', name: '约翰内斯堡', nameEn: 'Johannesburg', tz: 'Africa/Johannesburg', country: '南非', countryEn: 'S. Africa', emoji: '🇿🇦' },
  { id: 'newyork', name: '纽约', nameEn: 'New York', tz: 'America/New_York', country: '美国', countryEn: 'USA', emoji: '🇺🇸' },
  { id: 'losangeles', name: '洛杉矶', nameEn: 'Los Angeles', tz: 'America/Los_Angeles', country: '美国', countryEn: 'USA', emoji: '🇺🇸' },
  { id: 'chicago', name: '芝加哥', nameEn: 'Chicago', tz: 'America/Chicago', country: '美国', countryEn: 'USA', emoji: '🇺🇸' },
  { id: 'sanfrancisco', name: '旧金山', nameEn: 'San Francisco', tz: 'America/Los_Angeles', country: '美国', countryEn: 'USA', emoji: '🇺🇸' },
  { id: 'toronto', name: '多伦多', nameEn: 'Toronto', tz: 'America/Toronto', country: '加拿大', countryEn: 'Canada', emoji: '🇨🇦' },
  { id: 'vancouver', name: '温哥华', nameEn: 'Vancouver', tz: 'America/Vancouver', country: '加拿大', countryEn: 'Canada', emoji: '🇨🇦' },
  { id: 'mexicocity', name: '墨西哥城', nameEn: 'Mexico City', tz: 'America/Mexico_City', country: '墨西哥', countryEn: 'Mexico', emoji: '🇲🇽' },
  { id: 'saopaulo', name: '圣保罗', nameEn: 'São Paulo', tz: 'America/Sao_Paulo', country: '巴西', countryEn: 'Brazil', emoji: '🇧🇷' },
  { id: 'buenosaires', name: '布宜诺斯艾利斯', nameEn: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', country: '阿根廷', countryEn: 'Argentina', emoji: '🇦🇷' },
  { id: 'sydney', name: '悉尼', nameEn: 'Sydney', tz: 'Australia/Sydney', country: '澳大利亚', countryEn: 'Australia', emoji: '🇦🇺' },
  { id: 'melbourne', name: '墨尔本', nameEn: 'Melbourne', tz: 'Australia/Melbourne', country: '澳大利亚', countryEn: 'Australia', emoji: '🇦🇺' },
  { id: 'auckland', name: '奥克兰', nameEn: 'Auckland', tz: 'Pacific/Auckland', country: '新西兰', countryEn: 'NZ', emoji: '🇳🇿' },
  { id: 'honolulu', name: '檀香山', nameEn: 'Honolulu', tz: 'Pacific/Honolulu', country: '美国', countryEn: 'USA', emoji: '🇺🇸' },
  { id: 'anchorage', name: '安克雷奇', nameEn: 'Anchorage', tz: 'America/Anchorage', country: '美国', countryEn: 'USA', emoji: '🇺🇸' },
  { id: 'denver', name: '丹佛', nameEn: 'Denver', tz: 'America/Denver', country: '美国', countryEn: 'USA', emoji: '🇺🇸' },
  { id: 'lima', name: '利马', nameEn: 'Lima', tz: 'America/Lima', country: '秘鲁', countryEn: 'Peru', emoji: '🇵🇪' },
  { id: 'nairobi', name: '内罗毕', nameEn: 'Nairobi', tz: 'Africa/Nairobi', country: '肯尼亚', countryEn: 'Kenya', emoji: '🇰🇪' },
  { id: 'lagos', name: '拉各斯', nameEn: 'Lagos', tz: 'Africa/Lagos', country: '尼日利亚', countryEn: 'Nigeria', emoji: '🇳🇬' },
  { id: 'helsinki', name: '赫尔辛基', nameEn: 'Helsinki', tz: 'Europe/Helsinki', country: '芬兰', countryEn: 'Finland', emoji: '🇫🇮' },
  { id: 'stockholm', name: '斯德哥尔摩', nameEn: 'Stockholm', tz: 'Europe/Stockholm', country: '瑞典', countryEn: 'Sweden', emoji: '🇸🇪' },
  { id: 'warsaw', name: '华沙', nameEn: 'Warsaw', tz: 'Europe/Warsaw', country: '波兰', countryEn: 'Poland', emoji: '🇵🇱' },
  { id: 'lisbon', name: '里斯本', nameEn: 'Lisbon', tz: 'Europe/Lisbon', country: '葡萄牙', countryEn: 'Portugal', emoji: '🇵🇹' },
  { id: 'jakarta', name: '雅加达', nameEn: 'Jakarta', tz: 'Asia/Jakarta', country: '印度尼西亚', countryEn: 'Indonesia', emoji: '🇮🇩' },
  { id: 'karachi', name: '卡拉奇', nameEn: 'Karachi', tz: 'Asia/Karachi', country: '巴基斯坦', countryEn: 'Pakistan', emoji: '🇵🇰' },
  { id: 'dhaka', name: '达卡', nameEn: 'Dhaka', tz: 'Asia/Dhaka', country: '孟加拉', countryEn: 'Bangladesh', emoji: '🇧🇩' },
];

// ===================== State =====================
const selectedCityIds = useStorage<string[]>('world-clock-cities', ['beijing', 'tokyo', 'london', 'newyork', 'losangeles']);
const is24h = useStorage('world-clock-24h', true);
const showAddModal = ref(false);
const searchQuery = ref('');
const now = ref(new Date());
let timer: ReturnType<typeof setInterval>;

// ===================== Computed =====================
const selectedCities = computed(() => {
  return selectedCityIds.value
    .map(id => allCities.find(c => c.id === id))
    .filter(Boolean) as TimezoneCity[];
});

const availableCities = computed(() => {
  return allCities.filter(c => !selectedCityIds.value.includes(c.id));
});

const filteredCities = computed(() => {
  if (!searchQuery.value.trim()) return availableCities.value;
  const q = searchQuery.value.toLowerCase();
  return availableCities.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.nameEn.toLowerCase().includes(q) ||
    c.country.toLowerCase().includes(q) ||
    c.countryEn.toLowerCase().includes(q) ||
    c.tz.toLowerCase().includes(q)
  );
});

// Local timezone
const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const localCity = computed(() => {
  const found = allCities.find(c => c.tz === localTz);
  return found || {
    id: 'local',
    name: lang.value === 'zh' ? '本地' : 'Local',
    nameEn: 'Local',
    tz: localTz,
    country: '',
    countryEn: '',
    emoji: '📍',
  };
});

// ===================== Time helpers =====================
function getTimeInTz(tz: string, date?: Date) {
  const d = date || now.value;
  const str = d.toLocaleString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = str.split(':');
  return {
    hours: parseInt(parts[0]) || 0,
    minutes: parseInt(parts[1]) || 0,
    seconds: parseInt(parts[2]) || 0,
  };
}

function getTimeString(tz: string) {
  const d = now.value;
  return d.toLocaleTimeString(lang.value === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !is24h.value,
  });
}

function getDateString(tz: string) {
  const d = now.value;
  return d.toLocaleDateString(lang.value === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getOffsetDiff(tz: string) {
  const localOffset = -now.value.getTimezoneOffset() / 60;
  const targetDate = new Date(now.value.toLocaleString('en-US', { timeZone: tz }));
  const localDate = new Date(now.value.toLocaleString('en-US', { timeZone: localTz }));
  const diff = (targetDate.getTime() - localDate.getTime()) / (1000 * 60 * 60);
  return Math.round(diff * 2) / 2; // round to nearest 0.5
}

function getTimePeriod(hours: number): 'work' | 'off' | 'sleep' {
  if (hours >= 9 && hours < 18) return 'work';
  if (hours >= 7 && hours < 22) return 'off';
  return 'sleep';
}

function getCityLabel(city: TimezoneCity) {
  return lang.value === 'zh' ? city.name : city.nameEn;
}

function getCountryLabel(city: TimezoneCity) {
  return lang.value === 'zh' ? city.country : city.countryEn;
}

function getOffsetLabel(diff: number) {
  if (diff === 0) return t('same').value;
  const absDiff = Math.abs(diff);
  const label = diff > 0 ? t('ahead').value : t('behind').value;
  if (absDiff % 1 === 0) {
    return `${absDiff}${t('hourAhead').value.replace('h ', '').trim()}${label}`;
  }
  return `${absDiff}${t('hourAhead').value.replace('h ', '').trim()}${label}`;
}

function isDifferentDay(tz: string) {
  const localDay = now.value.getDate();
  const targetDay = new Date(now.value.toLocaleString('en-US', { timeZone: tz })).getDate();
  if (targetDay === localDay) return null;
  return targetDay > localDay ? 'tomorrow' : 'yesterday';
}

// ===================== Analog clock SVG =====================
function getClockHands(tz: string) {
  const time = getTimeInTz(tz);
  const secAngle = time.seconds * 6;
  const minAngle = time.minutes * 6 + time.seconds * 0.1;
  const hourAngle = (time.hours % 12) * 30 + time.minutes * 0.5;
  return { hourAngle, minAngle, secAngle };
}

// ===================== Actions =====================
function addCity(id: string) {
  if (!selectedCityIds.value.includes(id)) {
    selectedCityIds.value.push(id);
  }
  showAddModal.value = false;
  searchQuery.value = '';
}

function removeCity(id: string) {
  selectedCityIds.value = selectedCityIds.value.filter(i => i !== id);
}

function moveCityUp(index: number) {
  if (index > 0) {
    const arr = [...selectedCityIds.value];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    selectedCityIds.value = arr;
  }
}

function moveCityDown(index: number) {
  if (index < selectedCityIds.value.length - 1) {
    const arr = [...selectedCityIds.value];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    selectedCityIds.value = arr;
  }
}

function exportSchedule() {
  let text = lang.value === 'zh' ? '📅 世界时钟时间表\n' : '📅 World Clock Schedule\n';
  text += `${'='.repeat(40)}\n`;
  text += `${lang.value === 'zh' ? '生成时间' : 'Generated'}: ${now.value.toLocaleString()}\n\n`;

  selectedCities.value.forEach(city => {
    const timeStr = getTimeString(city.tz);
    const dateStr = getDateString(city.tz);
    const diff = getOffsetDiff(city.tz);
    const diffLabel = getOffsetLabel(diff);
    text += `${city.emoji} ${getCityLabel(city)} (${getCountryLabel(city)})\n`;
    text += `   ${timeStr}  ${dateStr}  (${diffLabel})\n\n`;
  });

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `world-clock-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// Meeting planner: find overlapping work hours (9-18) across all selected timezones
const meetingHour = ref(12);
const meetingMinute = ref(0);

interface MeetingSlot {
  localHour: number;
  localMinute: number;
  slots: { city: TimezoneCity; hour: number; minute: number; period: string }[];
  allWorkHours: boolean;
}

const meetingSlots = computed<MeetingSlot[]>(() => {
  const slots: MeetingSlot[] = [];
  const allTzs = [localCity.value, ...selectedCities.value];

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const entries = allTzs.map(city => {
        // Calculate the time in each timezone when local time is h:m
        const localOffset = -now.value.getTimezoneOffset();
        const targetOffset = getOffsetDiff(city.tz) * 60;
        let targetHour = h + Math.floor((targetOffset + localOffset) / 60);
        let targetMinute = m + ((targetOffset + localOffset) % 60);

        // Normalize
        while (targetMinute >= 60) { targetMinute -= 60; targetHour++; }
        while (targetMinute < 0) { targetMinute += 60; targetHour--; }
        while (targetHour >= 24) targetHour -= 24;
        while (targetHour < 0) targetHour += 24;

        const period = getTimePeriod(targetHour);
        return { city, hour: targetHour, minute: targetMinute, period };
      });

      const allWork = entries.every(e => e.period === 'work');
      slots.push({ localHour: h, localMinute: m, slots: entries, allWorkHours: allWork });
    }
  }

  return slots;
});

const bestMeetingSlots = computed(() => {
  const workSlots = meetingSlots.value.filter(s => s.allWorkHours);
  return workSlots.slice(0, 6);
});

// ===================== Lifecycle =====================
onMounted(() => {
  const nav = navigator.language || 'zh';
  lang.value = nav.startsWith('zh') ? 'zh' : 'en';

  timer = setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1100px">

      <!-- Header -->
      <c-card mb-4>
        <div flex items-center justify-between flex-wrap gap-3>
          <div>
            <div text-lg font-bold>{{ t('title').value }}</div>
            <div text-sm op-60>{{ t('subtitle').value }}</div>
          </div>
          <div flex items-center gap-2>
            <!-- 12/24h toggle -->
            <n-button size="small" quaternary @click="is24h = !is24h">
              {{ is24h ? t('format24').value : t('format12').value }}
            </n-button>
            <!-- Lang toggle -->
            <n-button size="small" quaternary @click="lang = lang === 'zh' ? 'en' : 'zh'">
              {{ lang === 'zh' ? 'EN' : '中文' }}
            </n-button>
            <!-- Export -->
            <n-button size="small" quaternary @click="exportSchedule" :disabled="selectedCities.length === 0">
              📋 {{ t('exportTime').value }}
            </n-button>
            <!-- Add -->
            <n-button type="primary" @click="showAddModal = true">
              <template #icon><n-icon><Plus /></n-icon></template>
              {{ t('addCity').value }}
            </n-button>
          </div>
        </div>

        <!-- Local time display -->
        <div mt-4 flex items-center gap-4>
          <div class="wc-local-badge">
            <span text-2xl>📍</span>
            <div>
              <div text-xs op-50>{{ t('localTime').value }}</div>
              <div text-xl font-bold font-mono>{{ getTimeString(localTz) }}</div>
            </div>
          </div>
          <div text-sm op-50>{{ getDateString(localTz) }}</div>
        </div>
      </c-card>

      <!-- Quick Add Presets -->
      <c-card mb-4 v-if="availableCities.length > 0">
        <div text-sm op-60 mb-2>{{ t('quickAdd').value }}</div>
        <div flex gap-2 flex-wrap>
          <n-tag
            v-for="city in availableCities.slice(0, 12)"
            :key="city.id"
            size="small"
            round
            style="cursor: pointer"
            @click="addCity(city.id)"
          >
            {{ city.emoji }} {{ lang === 'zh' ? city.name : city.nameEn }}
            <template #icon><n-icon><Add :size="12" /></n-icon></template>
          </n-tag>
        </div>
      </c-card>

      <!-- City Cards -->
      <div v-if="selectedCities.length" class="wc-grid">
        <div
          v-for="(city, index) in selectedCities"
          :key="city.id"
          class="wc-card"
          :class="`wc-card--${getTimePeriod(getTimeInTz(city.tz).hours)}`"
        >
          <!-- Analog clock -->
          <div class="wc-clock-face">
            <svg viewBox="0 0 100 100" class="wc-clock-svg">
              <!-- Clock face -->
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15" />
              <!-- Hour markers -->
              <g v-for="i in 12" :key="'h' + i" :transform="`rotate(${i * 30} 50 50)`">
                <line x1="50" y1="8" x2="50" y2="14" stroke="currentColor" stroke-width="2" opacity="0.4"
                  :stroke-linecap="'round'" />
              </g>
              <!-- Minute markers -->
              <g v-for="i in 60" :key="'m' + i" :transform="`rotate(${i * 6} 50 50)`">
                <line v-if="i % 5 !== 0" x1="50" y1="9" x2="50" y2="11" stroke="currentColor" stroke-width="0.8"
                  opacity="0.15" />
              </g>
              <!-- Work hours arc (9-18) -->
              <path
                :d="`M 50 50 L ${50 + 42 * Math.sin(9 * Math.PI / 12)} ${50 - 42 * Math.cos(9 * Math.PI / 12)} A 42 42 0 ${18 - 9 > 12 ? 1 : 0} 1 ${50 + 42 * Math.sin(18 * Math.PI / 12)} ${50 - 42 * Math.cos(18 * Math.PI / 12)} Z`"
                fill="currentColor" opacity="0.04"
              />
              <!-- Hands -->
              <line
                :x1="50" :y1="50"
                :x2="50 + 24 * Math.sin(getClockHands(city.tz).hourAngle * Math.PI / 180)"
                :y2="50 - 24 * Math.cos(getClockHands(city.tz).hourAngle * Math.PI / 180)"
                stroke="currentColor" stroke-width="3.5" stroke-linecap="round" opacity="0.9"
              />
              <line
                :x1="50" :y1="50"
                :x2="50 + 34 * Math.sin(getClockHands(city.tz).minAngle * Math.PI / 180)"
                :y2="50 - 34 * Math.cos(getClockHands(city.tz).minAngle * Math.PI / 180)"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"
              />
              <line
                :x1="50" :y1="50"
                :x2="50 + 38 * Math.sin(getClockHands(city.tz).secAngle * Math.PI / 180)"
                :y2="50 - 38 * Math.cos(getClockHands(city.tz).secAngle * Math.PI / 180)"
                class="wc-sec-hand" stroke-width="1" stroke-linecap="round"
              />
              <!-- Center dot -->
              <circle cx="50" cy="50" r="2.5" fill="currentColor" opacity="0.8" />
            </svg>
          </div>

          <!-- City info -->
          <div class="wc-card-info">
            <div flex items-center gap-2 mb-1>
              <span text-xl>{{ city.emoji }}</span>
              <div>
                <div font-bold text-base>{{ getCityLabel(city) }}</div>
                <div text-xs op-50>{{ getCountryLabel(city) }}</div>
              </div>
            </div>

            <!-- Digital time -->
            <div class="wc-digital" font-mono>
              {{ getTimeString(city.tz) }}
            </div>

            <!-- Date + day indicator -->
            <div flex items-center gap-2 mt-1>
              <span text-xs op-50>{{ getDateString(city.tz) }}</span>
              <n-tag
                v-if="isDifferentDay(city.tz) === 'tomorrow'"
                size="tiny"
                :bordered="false"
                type="warning"
              >
                {{ t('tomorrow').value }}
              </n-tag>
              <n-tag
                v-else-if="isDifferentDay(city.tz) === 'yesterday'"
                size="tiny"
                :bordered="false"
                type="default"
              >
                {{ t('yesterday').value }}
              </n-tag>
            </div>

            <!-- Time diff -->
            <div class="wc-diff">
              {{ t('timeDiff').value }}:
              <span :class="{
                'wc-diff-ahead': getOffsetDiff(city.tz) > 0,
                'wc-diff-behind': getOffsetDiff(city.tz) < 0,
                'wc-diff-same': getOffsetDiff(city.tz) === 0,
              }">
                {{ getOffsetLabel(getOffsetDiff(city.tz)) }}
              </span>
            </div>

            <!-- Time period indicator -->
            <div class="wc-period" :class="`wc-period--${getTimePeriod(getTimeInTz(city.tz).hours)}`">
              <span v-if="getTimePeriod(getTimeInTz(city.tz).hours) === 'work'">💼 {{ t('workHours').value }}</span>
              <span v-else-if="getTimePeriod(getTimeInTz(city.tz).hours) === 'off'">🌅 {{ t('offHours').value }}</span>
              <span v-else>🌙 {{ t('sleepHours').value }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="wc-card-actions">
            <button class="wc-action-btn" @click.stop="moveCityUp(index)" :disabled="index === 0"
              :title="lang === 'zh' ? '上移' : 'Move Up'">⬆️</button>
            <button class="wc-action-btn" @click.stop="moveCityDown(index)"
              :disabled="index === selectedCities.length - 1"
              :title="lang === 'zh' ? '下移' : 'Move Down'">⬇️</button>
            <n-popconfirm @positive-click="removeCity(city.id)">
              <template #trigger>
                <button class="wc-action-btn wc-action-btn--danger" :title="t('delete').value">🗑️</button>
              </template>
              {{ t('deleteConfirm').value }}
            </n-popconfirm>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <c-card v-else>
        <div text-center py-10>
          <div text-5xl mb-4>🌍</div>
          <div text-lg op-60 mb-2>{{ t('empty').value }}</div>
          <n-button type="primary" mt-4 @click="showAddModal = true">
            <template #icon><n-icon><Plus /></n-icon></template>
            {{ t('addCity').value }}
          </n-button>
        </div>
      </c-card>

      <!-- Meeting Planner -->
      <c-card mt-4 v-if="selectedCities.length >= 1">
        <div flex items-center gap-2 mb-4>
          <span text-xl>🤝</span>
          <div font-bold>{{ t('meetingPlanner').value }}</div>
        </div>

        <div v-if="bestMeetingSlots.length > 0">
          <div text-sm op-60 mb-3>
            ✅ {{ t('overlapFound').value }}
          </div>
          <div class="wc-meeting-grid">
            <div v-for="slot in bestMeetingSlots" :key="`${slot.localHour}-${slot.localMinute}`" class="wc-meeting-slot">
              <div class="wc-meeting-local">
                {{ String(slot.localHour).padStart(2, '0') }}:{{ String(slot.localMinute).padStart(2, '0') }}
              </div>
              <div class="wc-meeting-cities">
                <div v-for="entry in slot.slots" :key="entry.city.id" class="wc-meeting-entry" :class="`wc-meeting-entry--${entry.period}`">
                  <span text-xs>{{ entry.city.emoji }}</span>
                  <span text-xs>{{ lang === 'zh' ? entry.city.name : entry.city.nameEn }}</span>
                  <span text-xs font-mono>{{ String(entry.hour).padStart(2, '0') }}:{{ String(entry.minute).padStart(2, '0') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div text-sm op-50>
            ⚠️ {{ t('noOverlap').value }}
          </div>
        </div>
      </c-card>

      <!-- Add City Modal -->
      <n-modal
        v-model:show="showAddModal"
        preset="card"
        :title="t('addCity').value"
        style="max-width: 560px"
        :bordered="false"
        :segmented="{ content: true }"
      >
        <n-input
          v-model:value="searchQuery"
          :placeholder="t('searchCity').value"
          clearable
          size="large"
          mb-4
        >
          <template #prefix><n-icon><Search /></n-icon></template>
        </n-input>

        <n-scrollbar style="max-height: 400px">
          <div v-if="filteredCities.length" class="wc-city-list">
            <div
              v-for="city in filteredCities"
              :key="city.id"
              class="wc-city-item"
              @click="addCity(city.id)"
            >
              <span text-xl>{{ city.emoji }}</span>
              <div flex-1>
                <div font-bold>{{ lang === 'zh' ? city.name : city.nameEn }}</div>
                <div text-xs op-50>{{ lang === 'zh' ? city.country : city.countryEn }} · {{ city.tz }}</div>
              </div>
              <n-icon op-40><Plus /></n-icon>
            </div>
          </div>
          <div v-else text-center py-6 op-50>
            {{ t('noResults').value }}
          </div>
        </n-scrollbar>
      </n-modal>
    </div>
  </div>
</template>

<style scoped>
/* Grid */
.wc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* Card */
.wc-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.wc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: 16px 16px 0 0;
  transition: opacity 0.3s;
}

.wc-card--work::before {
  background: linear-gradient(90deg, #34d399, #10b981);
  opacity: 1;
}

.wc-card--off::before {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  opacity: 0.8;
}

.wc-card--sleep::before {
  background: linear-gradient(90deg, #818cf8, #6366f1);
  opacity: 0.6;
}

.wc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px -8px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.15);
}

/* Clock face */
.wc-clock-face {
  flex-shrink: 0;
  width: 90px;
  height: 90px;
}

.wc-clock-svg {
  width: 100%;
  height: 100%;
  color: inherit;
}

.wc-sec-hand {
  stroke: #ef4444;
  opacity: 0.7;
  animation: wc-tick 1s steps(60) infinite;
}

@keyframes wc-tick {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.5; }
}

/* Card info */
.wc-card-info {
  flex: 1;
  min-width: 0;
}

/* Digital time */
.wc-digital {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.2;
}

/* Time diff */
.wc-diff {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 4px;
}

.wc-diff-ahead { color: #34d399; }
.wc-diff-behind { color: #f87171; }
.wc-diff-same { color: #60a5fa; }

/* Period */
.wc-period {
  font-size: 0.72rem;
  margin-top: 6px;
  padding: 2px 8px;
  border-radius: 8px;
  display: inline-block;
}

.wc-period--work {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.wc-period--off {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.wc-period--sleep {
  background: rgba(129, 140, 248, 0.15);
  color: #818cf8;
}

/* Card actions */
.wc-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease;
}

.wc-card:hover .wc-card-actions {
  opacity: 1;
  transform: translateY(0);
}

.wc-action-btn {
  background: rgba(255, 255, 255, 0.06);
  border: none;
  border-radius: 6px;
  padding: 3px 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.15s;
  line-height: 1;
}

.wc-action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
}

.wc-action-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.wc-action-btn--danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Local badge */
.wc-local-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 12px;
  padding: 8px 16px;
}

/* City list in modal */
.wc-city-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wc-city-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.wc-city-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Meeting grid */
.wc-meeting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.wc-meeting-slot {
  background: rgba(52, 211, 153, 0.06);
  border: 1px solid rgba(52, 211, 153, 0.15);
  border-radius: 12px;
  padding: 12px;
}

.wc-meeting-local {
  font-size: 1.2rem;
  font-weight: 700;
  font-family: monospace;
  margin-bottom: 8px;
  color: #34d399;
}

.wc-meeting-cities {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wc-meeting-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  padding: 2px 0;
}

.wc-meeting-entry--work { color: #34d399; }
.wc-meeting-entry--off { color: #fbbf24; }
.wc-meeting-entry--sleep { color: #818cf8; }

/* Responsive */
@media (max-width: 640px) {
  .wc-grid {
    grid-template-columns: 1fr;
  }

  .wc-card {
    padding: 14px;
  }

  .wc-clock-face {
    width: 70px;
    height: 70px;
  }

  .wc-digital {
    font-size: 1.3rem;
  }
}
</style>
