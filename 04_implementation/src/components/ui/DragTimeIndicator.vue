<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores'

const uiStore = useUIStore()

const displayTime = computed(() => {
  if (!uiStore.draggingTime) return ''
  const totalSeconds = Math.floor(uiStore.draggingTime.time)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const style = computed(() => {
  if (!uiStore.draggingTime) return { display: 'none' }
  return {
    left: `${uiStore.draggingTime.x + 10}px`,
    top: `${uiStore.draggingTime.y - 30}px`
  }
})
</script>

<template>
  <div
    v-if="uiStore.draggingTime"
    class="fixed z-50 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white font-mono pointer-events-none"
    :style="style"
  >
    {{ displayTime }}
  </div>
</template>
