<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContentStore, useUIStore } from '@/stores'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu.vue'

const contentStore = useContentStore()
const uiStore = useUIStore()

const bursts = computed(() => contentStore.burstTimings)

// 右クリックメニュー
const contextMenu = ref<{ x: number; y: number; burstId: string } | null>(null)

function getStyle(burst: typeof bursts.value[0]) {
  return {
    left: `${uiStore.timeToPixel(burst.startTime)}px`,
    width: `${uiStore.timeToPixel(burst.endTime - burst.startTime)}px`
  }
}

function isSelected(burstId: string) {
  return uiStore.selectedObjectId === burstId && uiStore.selectedObjectType === 'burst'
}

function handleClick(burstId: string, e: MouseEvent) {
  if (uiStore.isEditMode) {
    e.stopPropagation()
    uiStore.selectObject(burstId, 'burst')
  }
}

// ドラッグ処理
let dragStartX = 0
let dragStartTime = 0

function handleContextMenu(burst: typeof bursts.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode) return
  e.preventDefault()
  e.stopPropagation()
  contextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    burstId: burst.id
  }
}

function getContextMenuItems(): ContextMenuItem[] {
  if (!contextMenu.value) return []
  return [
    {
      label: '削除',
      action: () => {
        if (contextMenu.value) {
          contentStore.deleteBurst(contextMenu.value.burstId)
        }
      }
    }
  ]
}

function handleMouseDown(burst: typeof bursts.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode || uiStore.selectedTool !== 'select') return
  e.preventDefault()
  e.stopPropagation()

  dragStartX = e.clientX
  dragStartTime = burst.startTime

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - dragStartX
    const deltaTime = uiStore.pixelToTime(deltaX)
    const newStartTime = Math.max(0, dragStartTime + deltaTime)
    contentStore.moveBurst(burst.id, newStartTime)
    uiStore.setDraggingTime(newStartTime, moveEvent.clientX, moveEvent.clientY)
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    uiStore.setDraggingTime(null)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<template>
  <div class="absolute inset-0 pointer-events-none">
    <div
      v-for="burst in bursts"
      :key="burst.id"
      class="absolute top-0 bottom-0 bg-yellow-200 bg-opacity-20"
      :class="[
        isSelected(burst.id) ? 'ring-2 ring-yellow-400' : '',
        uiStore.isEditMode ? 'pointer-events-auto cursor-move' : ''
      ]"
      :style="getStyle(burst)"
      @click="handleClick(burst.id, $event)"
      @mousedown="handleMouseDown(burst, $event)"
      @contextmenu="handleContextMenu(burst, $event)"
    >
      <!-- バースト名 -->
      <div
        v-if="burst.name"
        class="absolute top-1 left-1 text-xs text-yellow-600 font-medium"
      >
        {{ burst.name }}
      </div>
    </div>

    <!-- 右クリックメニュー -->
    <ContextMenu
      v-if="contextMenu"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="getContextMenuItems()"
      @close="contextMenu = null"
    />
  </div>
</template>
