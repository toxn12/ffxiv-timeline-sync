<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContentStore, useUIStore } from '@/stores'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu.vue'

const contentStore = useContentStore()
const uiStore = useUIStore()

const phases = computed(() => contentStore.phases)

// フェーズ名編集
const editingPhaseId = ref<string | null>(null)
const editingName = ref('')

// 右クリックメニュー
const contextMenu = ref<{ x: number; y: number; phaseId: string; clickX: number } | null>(null)

function getStyle(phase: typeof phases.value[0]) {
  return {
    left: `${uiStore.timeToPixel(phase.startTime)}px`,
    width: `${uiStore.timeToPixel(phase.endTime - phase.startTime)}px`,
    backgroundColor: phase.color
  }
}

function isSelected(phaseId: string) {
  return uiStore.selectedObjectId === phaseId && uiStore.selectedObjectType === 'phase'
}

function handleClick(phaseId: string, e: MouseEvent) {
  if (uiStore.isEditMode) {
    e.stopPropagation()

    if (uiStore.selectedTool === 'split') {
      // 分割
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const phase = phases.value.find(p => p.id === phaseId)
      if (phase) {
        const clickTime = phase.startTime + uiStore.pixelToTime(clickX)
        contentStore.splitPhase(phaseId, clickTime)
      }
    } else {
      uiStore.selectObject(phaseId, 'phase')
    }
  }
}

function handleDoubleClick(phase: typeof phases.value[0]) {
  if (uiStore.isEditMode) {
    editingPhaseId.value = phase.id
    editingName.value = phase.name
  }
}

function finishEditing() {
  if (editingPhaseId.value) {
    contentStore.updatePhase({
      id: editingPhaseId.value,
      name: editingName.value
    })
    editingPhaseId.value = null
  }
}

function handleContextMenu(phase: typeof phases.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode) return
  e.preventDefault()
  e.stopPropagation()

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const clickX = e.clientX - rect.left

  contextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    phaseId: phase.id,
    clickX
  }
}

function getContextMenuItems(): ContextMenuItem[] {
  if (!contextMenu.value) return []
  const phase = phases.value.find(p => p.id === contextMenu.value!.phaseId)
  if (!phase) return []

  const items: ContextMenuItem[] = []

  // フェーズの区切りを追加
  items.push({
    label: 'フェーズの区切りを追加',
    action: () => {
      if (contextMenu.value && phase) {
        const clickTime = phase.startTime + uiStore.pixelToTime(contextMenu.value.clickX)
        contentStore.splitPhase(contextMenu.value.phaseId, clickTime)
      }
    }
  })

  // 削除（最低1つは必要なので条件付き）
  items.push({
    label: '削除',
    action: () => {
      if (contextMenu.value) {
        contentStore.deletePhase(contextMenu.value.phaseId)
      }
    },
    disabled: phases.value.length <= 1
  })

  return items
}

// ドラッグ処理
let dragStartX = 0
let dragStartTime = 0

function handleMouseDown(phase: typeof phases.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode || uiStore.selectedTool !== 'select') return
  if (phase.startTime === 0) return // 最初のフェーズは移動不可

  e.preventDefault()
  e.stopPropagation()
  dragStartX = e.clientX
  dragStartTime = phase.startTime

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - dragStartX
    const deltaTime = uiStore.pixelToTime(deltaX)
    const newStartTime = Math.max(0, dragStartTime + deltaTime)
    contentStore.movePhase(phase.id, newStartTime)
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
  <div class="h-8 relative border-b border-gray-700">
    <div
      v-for="phase in phases"
      :key="phase.id"
      class="absolute top-0 h-full flex items-center justify-center text-sm font-medium text-white"
      :class="[
        isSelected(phase.id) ? 'ring-2 ring-yellow-400 ring-inset' : '',
        uiStore.isEditMode ? 'cursor-pointer hover:brightness-110' : ''
      ]"
      :style="getStyle(phase)"
      @click="handleClick(phase.id, $event)"
      @dblclick="handleDoubleClick(phase)"
      @mousedown="handleMouseDown(phase, $event)"
      @contextmenu="handleContextMenu(phase, $event)"
    >
      <input
        v-if="editingPhaseId === phase.id"
        v-model="editingName"
        class="bg-transparent border-none outline-none w-full text-white text-center"
        @blur="finishEditing"
        @keydown.enter="finishEditing"
        @click.stop
      />
      <span v-else>{{ phase.name }}</span>
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
