<script setup lang="ts">
import { decodeSafeLinksURL } from './safelink-decoder.service';
import TextareaCopyable from '@/components/TextareaCopyable.vue';

const inputSafeLinkUrl = ref('');
const outputDecodedUrl = computed(() => {
  try {
    return decodeSafeLinksURL(inputSafeLinkUrl.value);
  }
  catch (e: any) {
    return e.toString();
  }
});
</script>

<template>
  <div>
    <c-input-text
      v-model:value="inputSafeLinkUrl"
      raw-text
      placeholder="您输入的 Outlook SafeLink URL..."
      autofocus
      label="您输入的 Outlook SafeLink URL："
    />

    <n-divider />

    <n-form-item label="输出解码后的 URL：">
      <TextareaCopyable :value="outputDecodedUrl" :word-wrap="true" />
    </n-form-item>
  </div>
</template>
