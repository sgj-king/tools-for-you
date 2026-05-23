import { useMediaQuery, useStorage, useToggle } from '@vueuse/core';
import { defineStore } from 'pinia';
import { type Ref, watch } from 'vue';

export const useStyleStore = defineStore('style', {
  state: () => {
    // 默认使用夜间模式
    const isDarkTheme = useStorage('vueuse-color-scheme', true) as Ref<boolean>;
    const toggleDark = useToggle(isDarkTheme);

    // 同步 dark 类到 html 元素
    watch(
      isDarkTheme,
      (isDark) => {
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      { immediate: true }
    );

    const isSmallScreen = useMediaQuery('(max-width: 700px)');
    const isMenuCollapsed = useStorage('isMenuCollapsed', isSmallScreen.value) as Ref<boolean>;
    watch(isSmallScreen, v => (isMenuCollapsed.value = v));

    return {
      isDarkTheme,
      toggleDark,
      isMenuCollapsed,
      isSmallScreen,
    };
  },
});
