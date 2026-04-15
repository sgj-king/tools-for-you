<script setup lang="ts">
import { convertTextToUnicode, convertUnicodeToText } from './text-to-unicode.service';
import { useCopy } from '@/composable/copy';

const inputText = ref('');
const unicodeFromText = computed(() => inputText.value.trim() === '' ? '' : convertTextToUnicode(inputText.value));
const { copy: copyUnicode } = useCopy({ source: unicodeFromText });

const inputUnicode = ref('');
const textFromUnicode = computed(() => inputUnicode.value.trim() === '' ? '' : convertUnicodeToText(inputUnicode.value));
const { copy: copyText } = useCopy({ source: textFromUnicode });
</script>

<template>
  <c-card title="文本转 Unicode">
    <c-input-text v-model:value="inputText" multiline placeholder="e.g. 'Hello Avengers'" label="输入要转换为 Unicode 的文本" autosize autofocus raw-text test-id="text-to-unicode-input" />
    <c-input-text v-model:value="unicodeFromText" label="从文本转换的 Unicode" multiline raw-text readonly mt-2 placeholder="文本的 Unicode 表示将在此显示" test-id="text-to-unicode-output" />
    <div mt-2 flex justify-center>
      <c-button :disabled="!unicodeFromText" @click="copyUnicode()">
        Copy unicode to clipboard
      </c-button>
    </div>
  </c-card>

  <c-card title="Unicode 转文本">
    <c-input-text v-model:value="inputUnicode" multiline placeholder="输入 Unicode" label="输入要转换为文本的 Unicode" autosize raw-text test-id="unicode-to-text-input" />
    <c-input-text v-model:value="textFromUnicode" label="从 Unicode 转换的文本" multiline raw-text readonly mt-2 placeholder="Unicode 的文本表示将在此显示" test-id="unicode-to-text-output" />
    <div mt-2 flex justify-center>
      <c-button :disabled="!textFromUnicode" @click="copyText()">
        Copy text to clipboard
      </c-button>
    </div>
  </c-card>
</template>
