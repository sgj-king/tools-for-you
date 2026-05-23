<script setup lang="ts">
import { useHead } from '@vueuse/head';

useHead({ title: 'Page not found - IT Tools' });
</script>

<template>
  <div mt-20 flex flex-col items-center>
    <span text-90px lh-1 op-50>
      <icon-mdi:kettle-steam-outline />
    </span>

    <h1 m-0 mt-3>
      {{ '404 页面不存在' }}
    </h1>
    <div mt-4 op-60>
      {{ '抱歉，该页面似乎不存在' }}
    </div>
    <div mb-8 op-60>
      {{ '也许缓存出现了一些问题，试试强制刷新页面？' }}
    </div>

    <c-button to="/">
      {{ '返回主页' }}
    </c-button>
  </div>
</template>
