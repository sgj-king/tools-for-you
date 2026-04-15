<script setup lang="ts">
const optionsA = [
  { label: 'Option A', value: 'a' },
  { label: 'Option B', value: 'b', tooltip: 'This is a tooltip' },
  { label: 'Option C', value: 'c' },
];

const optionB = {
  'Option A': 'a',
  'Option B': 'b',
  'Option C': 'c',
};

const valueA = ref('a');
</script>

<template>
  <c-buttons-select v-model:value="valueA" :options="optionsA" label="标签：" />
  <c-buttons-select v-model:value="valueA" :options="optionsA" label="标签：" label-position="left" mt-2 />
  <c-buttons-select v-model:value="valueA" :options="optionB" label="选项对象：" />
</template>
