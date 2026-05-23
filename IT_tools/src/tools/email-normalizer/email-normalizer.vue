<script setup lang="ts">
import { normalizeEmail } from 'email-normalizer';
import { withDefaultOnError } from '@/utils/defaults';
import { useCopy } from '@/composable/copy';

const emails = ref('');
const normalizedEmails = computed(() => {
  if (!emails.value) {
    return '';
  }

  return emails.value
    .split('\n')
    .map((email) => {
      return withDefaultOnError(() => normalizeEmail({ email }), `Unable to parse email: ${email}`);
    })
    .join('\n');
});

const { copy } = useCopy({ source: normalizedEmails, text: 'Normalized emails copied to the clipboard', createToast: true });
</script>

<template>
  <div>
    <div class="mb-2">
      Raw emails to normalize:
    </div>
    <c-input-text
      v-model:value="emails"
      placeholder="在此输入邮箱（每行一个）..."
      rows="3"
      multiline
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      autofocus
      monospace
    />

    <div class="mb-2 mt-4">
      Normalized emails:
    </div>
    <c-input-text
      :value="normalizedEmails"
      placeholder="规范化后的邮箱将在此显示..."
      rows="3"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      multiline
      readonly
      monospace
    />
    <div class="mt-4 flex justify-center gap-2">
      <c-button @click="emails = ''">
        Clear emails
      </c-button>
      <c-button :disabled="!normalizedEmails" @click="copy()">
        Copy normalized emails
      </c-button>
    </div>
  </div>
</template>
