<script setup lang="ts">
import { escape, unescape } from 'lodash';

import { useCopy } from '@/composable/copy';

const escapeInput = ref('<title>IT Tool</title>');
const escapeOutput = computed(() => escape(escapeInput.value));
const { copy: copyEscaped } = useCopy({ source: escapeOutput });

const unescapeInput = ref('&lt;title&gt;IT Tool&lt;/title&gt;');
const unescapeOutput = computed(() => unescape(unescapeInput.value));
const { copy: copyUnescaped } = useCopy({ source: unescapeOutput });
</script>

<template>
  <c-card title="转义 HTML 实体">
    <n-form-item label="您的字符串：">
      <c-input-text
        v-model:value="escapeInput"
        multiline
        placeholder="要转义的字符串"
        rows="3"
        autosize
        raw-text
      />
    </n-form-item>

    <n-form-item label="转义后的字符串：">
      <c-input-text
        multiline
        readonly
        placeholder="转义后的字符串"
        :value="escapeOutput"
        rows="3"
        autosize
      />
    </n-form-item>

    <div flex justify-center>
      <c-button @click="copyEscaped()">
        Copy
      </c-button>
    </div>
  </c-card>
  <c-card title="反转义 HTML 实体">
    <n-form-item label="转义后的字符串：">
      <c-input-text
        v-model:value="unescapeInput"
        multiline
        placeholder="要反转义的字符串"
        rows="3"
        autosize
        raw-text
      />
    </n-form-item>

    <n-form-item label="反转义后的字符串：">
      <c-input-text
        :value="unescapeOutput"
        multiline
        readonly
        placeholder="反转义后的字符串"
        rows="3"
        autosize
      />
    </n-form-item>

    <div flex justify-center>
      <c-button @click="copyUnescaped()">
        Copy
      </c-button>
    </div>
  </c-card>
</template>
