<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores'

const uiStore = useUIStore()

// 開始位置の垂直線のスタイル
const startLineStyle = computed(() => {
  if (!uiStore.draggingSkillPositions) return { display: 'none' }
  const left = uiStore.timeToPixel(uiStore.draggingSkillPositions.startTime)
  return {
    left: `${left}px`,
    display: 'block'
  }
})

// 終了位置の垂直線のスタイル
const endLineStyle = computed(() => {
  if (!uiStore.draggingSkillPositions) return { display: 'none' }
  const left = uiStore.timeToPixel(uiStore.draggingSkillPositions.endTime)
  return {
    left: `${left}px`,
    display: 'block'
  }
})
</script>

<template>
  <!-- スキルドラッグ中の垂直線（開始位置） -->
  <div
    class="absolute top-0 bottom-0 w-0.5 bg-yellow-400 pointer-events-none z-10"
    :style="startLineStyle"
  />

  <!-- スキルドラッグ中の垂直線（終了位置） -->
  <div
    class="absolute top-0 bottom-0 w-0.5 bg-blue-400 pointer-events-none z-10"
    :style="endLineStyle"
  />
</template>
