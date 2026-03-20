<script lang="ts" setup>
import { NIcon } from 'naive-ui';

import { RouterLink } from 'vue-router';
import { Heart, Home2, Menu2 } from '@vicons/tabler';

import { storeToRefs } from 'pinia';
import HeroGradient from '../assets/hero-gradient.svg?component';
import MenuLayout from '../components/MenuLayout.vue';
import NavbarButtons from '../components/NavbarButtons.vue';
import { useStyleStore } from '@/stores/style.store';
import { config } from '@/config';
import type { ToolCategory } from '@/tools/tools.types';
import { useToolStore } from '@/tools/tools.store';
import { useTracker } from '@/modules/tracker/tracker.services';
import CollapsibleToolMenu from '@/components/CollapsibleToolMenu.vue';

const styleStore = useStyleStore();
const version = config.app.version;
const commitSha = config.app.lastCommitSha.slice(0, 7);

const { tracker } = useTracker();
const { t } = useI18n();

const toolStore = useToolStore();
const { favoriteTools, toolsByCategory } = storeToRefs(toolStore);

const tools = computed<ToolCategory[]>(() => [
  ...(favoriteTools.value.length > 0 ? [{ name: t('tools.categories.favorite-tools'), components: favoriteTools.value }] : []),
  ...toolsByCategory.value,
]);
</script>

<template>
  <MenuLayout class="menu-layout" :class="{ isSmallScreen: styleStore.isSmallScreen }">
    <template #sider>
      <RouterLink to="/" class="hero-wrapper">
        <HeroGradient class="gradient" />
        <div class="text-wrapper">
          <div class="title">
            TOOLS FOR YOU
          </div>
          <div class="divider" />
          <div class="subtitle">
            {{ $t('home.subtitle') }}
          </div>
        </div>
      </RouterLink>

      <div class="sider-content">
        <div v-if="styleStore.isSmallScreen" flex flex-col items-center>
          <locale-selector w="90%" />

          <div flex justify-center>
            <NavbarButtons />
          </div>
        </div>

        <CollapsibleToolMenu :tools-by-category="tools" />

        <div class="footer">
          <div>
            IT-Tools

            <c-link target="_blank" rel="noopener" :href="`https://github.com/sgj-king/tools-for-you/tree/v${version}`">
              v{{ version }}
            </c-link>

            <template v-if="commitSha && commitSha.length > 0">
              -
              <c-link
                target="_blank"
                rel="noopener"
                type="primary"
                :href="`https://github.com/sgj-king/tools-for-you/tree/${commitSha}`"
              >
                {{ commitSha }}
              </c-link>
            </template>
          </div>
          <div>
            漏 {{ new Date().getFullYear() }}
            <c-link target="_blank" rel="noopener" href="https://corentin.tech?utm_source=it-tools&utm_medium=footer">
              Corentin Thomasset
            </c-link>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div flex items-center justify-center gap-2>
        <c-button
          circle
          variant="text"
          :aria-label="$t('home.toggleMenu')"
          @click="styleStore.isMenuCollapsed = !styleStore.isMenuCollapsed"
        >
          <NIcon size="25" :component="Menu2" />
        </c-button>

        <c-tooltip :tooltip="$t('home.home')" position="bottom">
          <c-button to="/" circle variant="text" :aria-label="$t('home.home')">
            <NIcon size="25" :component="Home2" />
          </c-button>
        </c-tooltip>

        <c-tooltip :tooltip="$t('home.uiLib')" position="bottom">
          <c-button v-if="config.app.env === 'development'" to="/c-lib" circle variant="text" :aria-label="$t('home.uiLib')">
            <icon-mdi:brush-variant text-20px />
          </c-button>
        </c-tooltip>

        <command-palette />

        <locale-selector v-if="!styleStore.isSmallScreen" />

        <div>
          <NavbarButtons v-if="!styleStore.isSmallScreen" />
        </div>

        <c-tooltip position="bottom" :tooltip="$t('home.support')">
          <c-button
            round
            href="https://www.buymeacoffee.com/cthmsst"
            rel="noopener"
            target="_blank"
            class="support-button"
            :bordered="false"
            @click="() => tracker.trackEvent({ eventName: 'Support button clicked' })"
          >
            {{ $t('home.buyMeACoffee') }}
            <NIcon v-if="!styleStore.isSmallScreen" :component="Heart" ml-2 />
          </c-button>
        </c-tooltip>
      </div>
      <slot />
    </template>
  </MenuLayout>
</template>

<style lang="less" scoped>
.menu-layout {
  color: var(--app-text);
}

.support-button {
  background: linear-gradient(130deg, #1e8b77 0%, #2ca58f 48%, #1a6f60 100%);
  color: #fff !important;
  border-radius: 999px;
  box-shadow: 0 10px 25px rgba(30, 139, 119, 0.28);
  transition: transform ease 0.2s, box-shadow ease 0.2s, padding ease 0.2s;

  &:hover {
    color: #fff;
    padding-left: 30px;
    padding-right: 30px;
    transform: translateY(-1px);
    box-shadow: 0 16px 30px rgba(30, 139, 119, 0.32);
  }
}

.footer {
  text-align: center;
  color: var(--app-muted);
  margin-top: 24px;
  padding: 16px 0 0;
  border-top: 1px dashed var(--app-border);
  font-size: 12px;
}

.sider-content {
  padding-top: 190px;
  padding-bottom: 140px;
}

.hero-wrapper {
  position: absolute;
  display: block;
  left: 14px;
  right: 14px;
  top: 14px;
  z-index: 10;
  overflow: hidden;
  border-radius: 20px;
  background: linear-gradient(140deg, rgba(26, 111, 96, 0.98), rgba(22, 90, 78, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 16px 35px rgba(24, 78, 66, 0.35);

  .gradient {
    position: absolute;
    inset: -60px 0 0 0;
    opacity: 0.7;
  }

  .text-wrapper {
    position: relative;
    z-index: 1;
    text-align: left;
    padding: 18px 18px 16px;
    color: #f5fff8;

    .title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.18em;
      font-family: var(--font-display);
    }

    .divider {
      width: 56px;
      height: 3px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f7f1d1, #6ce7c1);
      margin: 8px 0 6px;
    }

    .subtitle {
      font-size: 12px;
      opacity: 0.85;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  }
}
</style>



