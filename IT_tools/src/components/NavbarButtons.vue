<script setup lang="ts">
import { IconBrandGithub, IconBrandX, IconInfoCircle, IconMoon, IconSun, IconUser } from '@tabler/icons-vue';
import { useStyleStore } from '@/stores/style.store';

const styleStore = useStyleStore();
const { isDarkTheme } = toRefs(styleStore);
</script>

<template>
  <c-tooltip :tooltip="'GitHub 仓库'" position="bottom">
    <c-button
      circle
      variant="text"
      href="https://github.com/sgj-king/tools-for-you"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="'访问 GitHub 仓库'"
    >
      <n-icon size="25" :component="IconBrandGithub" />
    </c-button>
  </c-tooltip>
  <c-tooltip tooltip="作者联系方式" position="bottom">
    <c-button
      circle
      variant="text"
      to="/contact"
      aria-label="作者联系方式"
    >
      <n-icon size="25" :component="IconUser" />
    </c-button>
  </c-tooltip>
  <c-tooltip :tooltip="'关于'" position="bottom">
    <c-button circle variant="text" to="/about" :aria-label="'关于 Tools For You'">
      <n-icon size="25" :component="IconInfoCircle" />
    </c-button>
  </c-tooltip>
  <c-tooltip :tooltip="isDarkTheme ? '切换浅色模式' : '切换深色模式'" position="bottom">
    <c-button
      circle
      variant="text"
      :aria-label="'切换主题模式'"
      @click="() => styleStore.toggleDark()"
    >
      <n-icon v-if="isDarkTheme" size="25" :component="IconSun" />
      <n-icon v-else size="25" :component="IconMoon" />
    </c-button>
  </c-tooltip>
</template>

<style lang="less" scoped>
.n-button {
  &:not(:last-child) {
    margin-right: 5px;
  }
}
</style>
