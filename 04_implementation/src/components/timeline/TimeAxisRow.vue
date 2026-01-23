<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore, useUIStore } from '@/stores'
import { formatTime } from '@/utils'

const contentStore = useContentStore()
const uiStore = useUIStore()

// 目盛りの間隔（秒）をズームレベルに応じて調整
const tickInterval = computed(() => {
  const zoom = uiStore.zoomLevel
  if (zoom >= 2) return 10
  if (zoom >= 1) return 15
  if (zoom >= 0.5) return 30
  return 60
})

// 目盛りの配列
const ticks = computed(() => {
  const duration = contentStore.currentContent?.duration ?? 600
  const interval = tickInterval.value
  const result = []
  for (let t = 0; t <= duration; t += interval) {
    result.push(t)
  }
  return result
})
</script>

<template>
  <div class="h-6 relative border-b border-gray-700 bg-gray-800">
    <div
      v-for="tick in ticks"
      :key="tick"
      class="absolute top-0 h-full flex items-end"
      :style="{ left: `${uiStore.timeToPixel(tick)}px` }"
    >
      <div class="w-px h-2 bg-gray-500" />
      <span class="text-xs text-gray-400 ml-1 -mb-0.5">{{ formatTime(tick) }}</span>
    </div>
  </div>
</template>
