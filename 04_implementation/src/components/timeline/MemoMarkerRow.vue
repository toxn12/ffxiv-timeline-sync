<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContentStore, useUIStore } from '@/stores'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu.vue'

const contentStore = useContentStore()
const uiStore = useUIStore()

const memos = computed(() => contentStore.timelineMemos)

// 右クリックメニュー
const contextMenu = ref<{ x: number; y: number; memoId: string | null; clickTime: number } | null>(null)

// メモ編集モーダル
const editingMemoId = ref<string | null>(null)
const editingText = ref('')
const isNewMemo = ref(false)
const newMemoTime = ref(0)

// ツールチップ表示
const hoveredMemoId = ref<string | null>(null)
const tooltipPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })

function getStyle(memo: typeof memos.value[0]) {
  return {
    left: `${uiStore.timeToPixel(memo.time) - 8}px`
  }
}

function handleRowClick(e: MouseEvent) {
  // 編集モードでメモ追加ツール選択時
  if (uiStore.isEditMode && uiStore.selectedTool === 'addMemo') {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const time = uiStore.pixelToTime(clickX)
    isNewMemo.value = true
    newMemoTime.value = time
    editingText.value = ''
    editingMemoId.value = 'new'
  }
}

function handleContextMenu(e: MouseEvent, memo?: typeof memos.value[0]) {
  if (!uiStore.isEditMode) return
  e.preventDefault()
  e.stopPropagation()

  const rect = (e.currentTarget as HTMLElement).closest('.memo-row')?.getBoundingClientRect()
  const clickX = rect ? e.clientX - rect.left : 0
  const clickTime = uiStore.pixelToTime(clickX)

  contextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    memoId: memo?.id ?? null,
    clickTime
  }
}

function getContextMenuItems(): ContextMenuItem[] {
  if (!contextMenu.value) return []

  const items: ContextMenuItem[] = []

  if (contextMenu.value.memoId) {
    // 既存メモの右クリックメニュー
    items.push({
      label: 'メモを編集',
      action: () => {
        const memo = memos.value.find(m => m.id === contextMenu.value!.memoId)
        if (memo) {
          editingMemoId.value = memo.id
          editingText.value = memo.text
          isNewMemo.value = false
        }
      }
    })
    items.push({
      label: '削除',
      action: () => {
        if (contextMenu.value?.memoId) {
          contentStore.deleteTimelineMemo(contextMenu.value.memoId)
        }
      }
    })
  } else {
    // 空白部分の右クリックメニュー
    items.push({
      label: 'メモを追加',
      action: () => {
        if (contextMenu.value) {
          isNewMemo.value = true
          newMemoTime.value = contextMenu.value.clickTime
          editingText.value = ''
          editingMemoId.value = 'new'
        }
      }
    })
  }

  return items
}

function saveMemo() {
  if (isNewMemo.value) {
    contentStore.addTimelineMemo({
      time: newMemoTime.value,
      text: editingText.value
    })
  } else if (editingMemoId.value) {
    contentStore.updateTimelineMemo({
      id: editingMemoId.value,
      text: editingText.value
    })
  }
  cancelEdit()
}

function cancelEdit() {
  editingMemoId.value = null
  editingText.value = ''
  isNewMemo.value = false
}

function handleMouseEnter(memo: typeof memos.value[0], e: MouseEvent) {
  hoveredMemoId.value = memo.id
  tooltipPosition.value = { x: e.clientX, y: e.clientY }
}

function handleMouseMove(memo: typeof memos.value[0], e: MouseEvent) {
  if (hoveredMemoId.value === memo.id) {
    tooltipPosition.value = { x: e.clientX, y: e.clientY }
  }
}

function handleMouseLeave() {
  hoveredMemoId.value = null
}

// ドラッグ処理
let dragStartX = 0
let dragStartTime = 0

function handleMouseDown(memo: typeof memos.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode || uiStore.selectedTool !== 'select') return
  e.preventDefault()
  e.stopPropagation()

  dragStartX = e.clientX
  dragStartTime = memo.time

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - dragStartX
    const deltaTime = uiStore.pixelToTime(deltaX)
    const newTime = Math.max(0, dragStartTime + deltaTime)
    contentStore.moveTimelineMemo(memo.id, newTime)
    uiStore.setDraggingTime(newTime, moveEvent.clientX, moveEvent.clientY)
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
  <div
    class="memo-row h-6 relative border-b border-gray-700"
    :class="uiStore.isEditMode && uiStore.selectedTool === 'addMemo' ? 'cursor-crosshair' : ''"
    @click="handleRowClick"
    @contextmenu="handleContextMenu($event)"
  >
    <!-- メモマーカー -->
    <div
      v-for="memo in memos"
      :key="memo.id"
      class="absolute top-0 h-full flex items-center justify-center text-amber-400 cursor-pointer select-none"
      :class="uiStore.isEditMode ? 'cursor-move hover:text-amber-300' : 'hover:text-amber-300'"
      :style="getStyle(memo)"
      @click.stop
      @contextmenu.stop="handleContextMenu($event, memo)"
      @mouseenter="handleMouseEnter(memo, $event)"
      @mousemove="handleMouseMove(memo, $event)"
      @mouseleave="handleMouseLeave"
      @mousedown="handleMouseDown(memo, $event)"
    >
      <span class="text-lg font-bold">◆</span>
    </div>

    <!-- 右クリックメニュー -->
    <ContextMenu
      v-if="contextMenu"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="getContextMenuItems()"
      @close="contextMenu = null"
    />

    <!-- メモツールチップ -->
    <Teleport to="body">
      <div
        v-if="hoveredMemoId"
        class="fixed z-50 bg-gray-900 border border-amber-500 rounded px-3 py-2 text-sm text-white max-w-xs whitespace-pre-wrap pointer-events-none"
        :style="{
          left: `${tooltipPosition.x + 10}px`,
          top: `${tooltipPosition.y + 10}px`
        }"
      >
        {{ memos.find(m => m.id === hoveredMemoId)?.text }}
      </div>
    </Teleport>

    <!-- メモ編集モーダル -->
    <Teleport to="body">
      <div
        v-if="editingMemoId"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="cancelEdit"
      >
        <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4">
          <h3 class="text-lg font-medium mb-3">{{ isNewMemo ? 'メモを追加' : 'メモを編集' }}</h3>
          <textarea
            v-model="editingText"
            class="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm resize-none"
            placeholder="メモを入力..."
            autofocus
          />
          <div class="flex justify-end gap-2 mt-3">
            <button
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              @click="cancelEdit"
            >
              キャンセル
            </button>
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              @click="saveMemo"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
