<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContentStore, useUIStore } from '@/stores'

const contentStore = useContentStore()
const uiStore = useUIStore()

const phases = computed(() => contentStore.phases)

// フェーズの区切り線情報（最初のフェーズの開始位置は除く）
const dividers = computed(() => {
  return phases.value.slice(1).map((phase, index) => ({
    phaseId: phase.id,
    phaseIndex: index + 1, // 元のインデックス
    position: uiStore.timeToPixel(phase.startTime),
    time: phase.startTime
  }))
})

// ドラッグ中の情報
const draggingDivider = ref<{ phaseId: string; startX: number; startTime: number } | null>(null)
const draggingTime = ref<number | null>(null)

function handleMouseDown(divider: typeof dividers.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode) return
  e.preventDefault()
  e.stopPropagation()

  draggingDivider.value = {
    phaseId: divider.phaseId,
    startX: e.clientX,
    startTime: divider.time
  }

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!draggingDivider.value) return

    const deltaX = moveEvent.clientX - draggingDivider.value.startX
    const deltaTime = uiStore.pixelToTime(deltaX)
    const newTime = Math.max(0, draggingDivider.value.startTime + deltaTime)

    // 前後のフェーズの範囲内に制限
    const phaseIndex = phases.value.findIndex(p => p.id === draggingDivider.value!.phaseId)
    if (phaseIndex > 0) {
      const prevPhase = phases.value[phaseIndex - 1]
      const currentPhase = phases.value[phaseIndex]
      const minTime = prevPhase.startTime + 1000 // 最低1秒（1000ms）
      const maxTime = currentPhase.endTime - 1000 // 最低1秒残す
      const clampedTime = Math.max(minTime, Math.min(maxTime, newTime))

      draggingTime.value = clampedTime
      uiStore.setDraggingTime(clampedTime, moveEvent.clientX, moveEvent.clientY)
    }
  }

  const handleMouseUp = () => {
    if (draggingDivider.value && draggingTime.value !== null) {
      // フェーズ区切りを移動
      contentStore.movePhaseDivider(draggingDivider.value.phaseId, draggingTime.value)
    }

    draggingDivider.value = null
    draggingTime.value = null
    uiStore.setDraggingTime(null)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<template>
  <div class="absolute inset-0">
    <div
      v-for="divider in dividers"
      :key="divider.phaseId"
      class="absolute top-0 bottom-0 w-1 bg-gray-600 hover:bg-blue-500 transition-colors"
      :class="uiStore.isEditMode ? 'cursor-ew-resize pointer-events-auto' : 'pointer-events-none'"
      :style="{ left: `${divider.position - 2}px` }"
      @mousedown="handleMouseDown(divider, $event)"
    />
  </div>
</template>
