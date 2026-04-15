<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { convert } from './list-converter.models';
import type { ConvertOptions } from './list-converter.types';

const sortOrderOptions = [
  {
    label: '升序排序',
    value: 'asc',
    disabled: false,
  },
  {
    label: '降序排序',
    value: 'desc',
    disabled: false,
  },
];

const conversionConfig = useStorage<ConvertOptions>('list-converter:conversionConfig', {
  lowerCase: false,
  trimItems: true,
  removeDuplicates: true,
  keepLineBreaks: false,
  itemPrefix: '',
  itemSuffix: '',
  listPrefix: '',
  listSuffix: '',
  reverseList: false,
  sortList: null,
  separator: ', ',
});

function transformer(value: string) {
  return convert(value, conversionConfig.value);
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 600px">
      <c-card>
        <div flex>
          <div>
            <n-form-item label="修剪列表项" label-placement="left" label-width="150" :show-feedback="false" mb-2>
              <n-switch v-model:value="conversionConfig.trimItems" />
            </n-form-item>
            <n-form-item label="去除重复" label-placement="left" label-width="150" :show-feedback="false" mb-2>
              <n-switch v-model:value="conversionConfig.removeDuplicates" data-test-id="removeDuplicates" />
            </n-form-item>
            <n-form-item
              label="转换为小写"
              label-placement="left"
              label-width="150"
              :show-feedback="false"
              mb-2
            >
              <n-switch v-model:value="conversionConfig.lowerCase" />
            </n-form-item>
            <n-form-item label="保留换行" label-placement="left" label-width="150" :show-feedback="false" mb-2>
              <n-switch v-model:value="conversionConfig.keepLineBreaks" />
            </n-form-item>
          </div>
          <div flex-1>
            <c-select
              v-model:value="conversionConfig.sortList"
              label="排序列表"
              label-position="left"
              label-width="120px"
              label-align="right"
              mb-2
              :options="sortOrderOptions"
              w-full
              :disabled="conversionConfig.reverseList"
              data-test-id="sortList"
              placeholder="按字母排序"
            />

            <c-input-text
              v-model:value="conversionConfig.separator"
              label="分隔符"
              label-position="left"
              label-width="120px"
              label-align="right"
              mb-2
              placeholder=","
            />

            <n-form-item label="包裹项目" label-placement="left" label-width="120" :show-feedback="false" mb-2>
              <c-input-text
                v-model:value="conversionConfig.itemPrefix"
                placeholder="项目前缀"
                test-id="itemPrefix"
              />
              <c-input-text
                v-model:value="conversionConfig.itemSuffix"
                placeholder="项目后缀"
                test-id="itemSuffix"
              />
            </n-form-item>
            <n-form-item label="包裹列表" label-placement="left" label-width="120" :show-feedback="false" mb-2>
              <c-input-text
                v-model:value="conversionConfig.listPrefix"
                placeholder="列表前缀"
                test-id="listPrefix"
              />
              <c-input-text
                v-model:value="conversionConfig.listSuffix"
                placeholder="列表后缀"
                test-id="listSuffix"
              />
            </n-form-item>
          </div>
        </div>
      </c-card>
    </div>
  </div>
  <format-transformer
    input-label="您的输入数据"
    input-placeholder="在此粘贴输入数据..."
    output-label="转换后的数据"
    :transformer="transformer"
  />
</template>
