<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NCard, NInputGroup, NInputGroupLabel, NInputNumber, NSelect, NTabs, NTabPane, NGrid, NGi, NButton, useMessage } from 'naive-ui';
import { unitCategories } from './unit-converter.models';
import { useClipboard } from '@vueuse/core';

const { copy, copied } = useClipboard();
const message = useMessage();

// 当前选中的类别
const activeCategory = ref('length');

// 当前类别下的所有单位值
const unitValues = ref<Record<string, number>>({});

// 初始化所有单位值为 0
function initUnitValues(categoryKey: string) {
  const category = unitCategories.find(c => c.key === categoryKey);
  if (!category) return;
  
  const values: Record<string, number> = {};
  Object.keys(category.units).forEach(key => {
    values[key] = 0;
  });
  unitValues.value = values;
}

// 更新所有单位值
function updateValues(sourceKey: string, value: number) {
  const category = unitCategories.find(c => c.key === activeCategory.value);
  if (!category) return;
  
  const sourceUnit = category.units[sourceKey as keyof typeof category.units];
  if (!sourceUnit) return;
  
  // 转换为基准单位
  const baseValue = sourceUnit.toBase(value);
  
  // 从基准单位转换为其他单位
  Object.keys(category.units).forEach(key => {
    if (key === sourceKey) {
      unitValues.value[key] = value;
    } else {
      const unit = category.units[key as keyof typeof category.units];
      unitValues.value[key] = unit.fromBase(baseValue);
    }
  });
}

// 格式化数值
function formatValue(value: number): string {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e9 || Math.abs(value) <= 1e-9) {
    return value.toExponential(6);
  }
  // 对于整数或接近整数的值，显示整数
  if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 1e-10) {
    return value.toString();
  }
  // 否则显示合适的小数位数
  return parseFloat(value.toPrecision(10)).toString();
}

// 复制值
function copyValue(key: string) {
  const category = unitCategories.find(c => c.key === activeCategory.value);
  if (!category) return;
  
  const unit = category.units[key as keyof typeof category.units];
  const value = unitValues.value[key];
  const text = `${formatValue(value)} ${unit.unit}`;
  
  copy(text);
  if (copied.value) {
    message.success(`已复制: ${text}`);
  }
}

// 交换两个单位的值
function swapUnits(fromKey: string, toKey: string) {
  const category = unitCategories.find(c => c.key === activeCategory.value);
  if (!category) return;
  
  // 获取 fromKey 的值
  const value = unitValues.value[fromKey];
  
  // 更新所有值
  updateValues(toKey, category.units[toKey as keyof typeof category.units].fromBase(category.units[fromKey as keyof typeof category.units].toBase(value)));
}

// 监听类别变化，重新初始化
watch(activeCategory, () => {
  initUnitValues(activeCategory.value);
  // 设置一个默认值
  const category = unitCategories.find(c => c.key === activeCategory.value);
  if (category) {
    const firstKey = Object.keys(category.units)[0];
    updateValues(firstKey, 1);
  }
}, { immediate: true });

// 当前类别的单位选项
const currentCategory = computed(() => unitCategories.find(c => c.key === activeCategory.value));
</script>

<template>
  <div class="unit-converter">
    <n-tabs v-model:value="activeCategory" type="line" animated>
      <n-tab-pane v-for="category in unitCategories" :key="category.key" :name="category.key" :tab="category.name">
        <div class="converter-grid">
          <n-input-group
            v-for="[key, unit] in Object.entries(currentCategory?.units || {})"
            :key="key"
            class="unit-input"
          >
            <n-input-group-label class="unit-name">
              {{ unit.name }}
            </n-input-group-label>
            <n-input-number
              v-model:value="unitValues[key]"
              :format="formatValue"
              :precision="10"
              @update:value="(v) => v !== null && updateValues(key, v)"
            />
            <n-input-group-label class="unit-symbol">
              {{ unit.unit }}
            </n-input-group-label>
            <n-button
              quaternary
              size="small"
              class="copy-btn"
              @click="copyValue(key)"
            >
              {{ copied ? '✓' : '📋' }}
            </n-button>
          </n-input-group>
        </div>
      </n-tab-pane>
    </n-tabs>
    
    <!-- 快速参考 -->
    <n-card title="常用换算" class="quick-ref" size="small">
      <div class="ref-grid">
        <div class="ref-item" v-for="item in [
          { from: '1 英寸', to: '2.54 厘米' },
          { from: '1 英尺', to: '30.48 厘米' },
          { from: '1 英里', to: '1.609 千米' },
          { from: '1 磅', to: '0.454 千克' },
          { from: '1 加仑', to: '3.785 升' },
          { from: '1 GB', to: '1024 MB' },
        ]" :key="item.from">
          <span class="ref-from">{{ item.from }}</span>
          <span class="ref-arrow">=</span>
          <span class="ref-to">{{ item.to }}</span>
        </div>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.unit-converter {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.converter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

.unit-input {
  width: 100%;
}

.unit-name {
  min-width: 60px;
  font-weight: 500;
}

.unit-symbol {
  min-width: 50px;
  justify-content: center;
}

.copy-btn {
  min-width: 36px;
}

.quick-ref {
  margin-top: 8px;
}

.ref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.ref-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--n-color-hover);
  border-radius: 6px;
  font-size: 13px;
}

.ref-from {
  color: var(--n-text-color-1);
  font-weight: 500;
}

.ref-arrow {
  color: var(--n-text-color-3);
}

.ref-to {
  color: var(--n-text-color-2);
}

@media (max-width: 640px) {
  .converter-grid {
    grid-template-columns: 1fr;
  }
  
  .ref-grid {
    grid-template-columns: 1fr;
  }
}
</style>
