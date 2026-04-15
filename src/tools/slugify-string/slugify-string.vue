<script setup lang="ts">
import slugify from '@sindresorhus/slugify';
import { withDefaultOnError } from '@/utils/defaults';
import { useCopy } from '@/composable/copy';

const input = ref('');
const slug = computed(() => withDefaultOnError(() => slugify(input.value), ''));
const { copy } = useCopy({ source: slug, text: 'Slug copied to clipboard' });
</script>

<template>
  <div>
    <c-input-text v-model:value="input" multiline placeholder="输入字符串（如：我的文件路径）" label="要转换为 Slug 的字符串" autofocus raw-text mb-5 />

    <c-input-text :value="slug" multiline readonly placeholder="Slug 将在此生成（如：my-file-path）" label="您的 Slug" mb-5 />

    <div flex justify-center>
      <c-button :disabled="slug.length === 0" @click="copy()">
        Copy slug
      </c-button>
    </div>
  </div>
</template>
