<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores'

const uiStore = useUIStore()

const zoomPercent = computed(() => Math.round(uiStore.zoomLevel * 100))
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
      @click="uiStore.zoomOut()"
      title="ズームアウト"
    >
      −
    </button>
    <span class="text-xs w-12 text-center">{{ zoomPercent }}%</span>
    <button
      class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
      @click="uiStore.zoomIn()"
      title="ズームイン"
    >
      ＋
    </button>
  </div>
</template>
