<script setup lang="ts">
import { IconDragDrop, IconHeart } from '@tabler/icons-vue';
import { useHead } from '@vueuse/head';
import { computed } from 'vue';
import Draggable from 'vuedraggable';
import ColoredCard from '../components/ColoredCard.vue';
import ToolCard from '../components/ToolCard.vue';
import { useToolStore } from '@/tools/tools.store';
import { config } from '@/config';

const toolStore = useToolStore();

useHead({ title: 'IT Tools - Handy online tools for developers' });
const favoriteTools = computed(() => toolStore.favoriteTools);

// Update favorite tools order when drag is finished
function onUpdateFavoriteTools() {
  toolStore.updateFavoriteTools(favoriteTools.value); // Update the store with the new order
}
</script>

<template>
  <div class="pt-50px">
    <div class="grid-wrapper">
      <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
        <ColoredCard v-if="config.showBanner" :title="'关注我们'" :icon="IconHeart">
          {{ '给我们点个 Star' }}
          <a
            href="https://github.com/sgj-king/tools-for-you"
            rel="noopener"
            target="_blank"
            :aria-label="'GitHub 仓库'"
          >GitHub</a>
          {{ '关注我们的' }}
          <a
            href="https://x.com/ittoolsdottech"
            rel="noopener"
            target="_blank"
            :aria-label="'Tools For You X 账号'"
          >X</a>.
          {{ '感谢您的支持！' }}
          <n-icon :component="IconHeart" />
        </ColoredCard>
      </div>

      <transition name="height">
        <div v-if="toolStore.favoriteTools.length > 0">
          <h3 class="mb-5px mt-25px text-neutral-400 font-500">
            {{ '我的收藏' }}
            <c-tooltip :tooltip="'拖放重新排列收藏夹'">
              <n-icon :component="IconDragDrop" size="18" />
            </c-tooltip>
          </h3>
          <Draggable
            :list="favoriteTools"
            class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4"
            ghost-class="ghost-favorites-draggable"
            item-key="name"
            @end="onUpdateFavoriteTools"
          >
            <template #item="{ element: tool }">
              <ToolCard :tool="tool" />
            </template>
          </Draggable>
        </div>
      </transition>

      <div v-if="toolStore.newTools.length > 0">
        <h3 class="mb-5px mt-25px text-neutral-400 font-500">
          {{ '最新工具' }}
        </h3>
        <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
          <ToolCard v-for="tool in toolStore.newTools" :key="tool.name" :tool="tool" />
        </div>
      </div>

      <h3 class="mb-5px mt-25px text-neutral-400 font-500">
        {{ '全部工具' }}
      </h3>
      <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-4">
        <ToolCard v-for="tool in toolStore.tools" :key="tool.name" :tool="tool" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.height-enter-active,
.height-leave-active {
  transition: all 0.5s ease-in-out;
  overflow: hidden;
  max-height: 500px;
}

.height-enter-from,
.height-leave-to {
  max-height: 42px;
  overflow: hidden;
  opacity: 0;
  margin-bottom: 0;
}

.ghost-favorites-draggable {
  opacity: 0.4;
  background-color: #ccc;
  border: 2px dashed #666;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
  animation: ghost-favorites-draggable-animation 0.2s ease-out;
}

@keyframes ghost-favorites-draggable-animation {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 0.4;
    transform: scale(1.0);
  }
}

.grid-wrapper {
  position: relative;
  padding: 24px;
  border-radius: 24px;
  background: var(--app-surface-2);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-soft);
}

.grid-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(420px 200px at 90% 0%, rgba(30, 139, 119, 0.12), transparent 60%);
  opacity: 0.8;
  pointer-events: none;
}

.grid-wrapper > * {
  position: relative;
  z-index: 1;
}

.grid-wrapper h3 {
  color: var(--app-muted) !important;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 700px) {
  .grid-wrapper {
    padding: 16px;
    border-radius: 18px;
  }
}
</style>

