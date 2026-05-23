<script setup lang="ts">
import convert from 'xml-js';
import { isValidXML } from '../xml-formatter/xml-formatter.service';
import { withDefaultOnError } from '@/utils/defaults';
import type { UseValidationRule } from '@/composable/validation';

const defaultValue = '<a x="1.234" y="它"/>';
function transformer(value: string) {
  return withDefaultOnError(() => {
    return JSON.stringify(convert.xml2js(value, { compact: true }), null, 2);
  }, '');
}

const rules: UseValidationRule<string>[] = [
  {
    validator: isValidXML,
    message: 'Provided XML is not valid.',
  },
];
</script>

<template>
  <format-transformer
    input-label="Your XML content"
    :input-default="defaultValue"
    input-placeholder="在此粘贴 XML 内容..."
    output-label="转换后的 JSON"
    output-language="json"
    :transformer="transformer"
    :input-validation-rules="rules"
  />
</template>
