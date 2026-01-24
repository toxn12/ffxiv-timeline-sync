<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContentStore, useUIStore } from '@/stores'
import { useGimmickFilterStore } from '@/stores/gimmickFilterStore'
import { getGimmickColorClass, getCategoryIcon } from '@/utils/gimmickStyles'
import { formatSeconds } from '@/utils/timeFormat'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu.vue'
import GimmickTooltip from '@/components/ui/GimmickTooltip.vue'

const contentStore = useContentStore()
const uiStore = useUIStore()
const filterStore = useGimmickFilterStore()

// フィルタ適用済みギミック一覧を使用
const gimmicks = computed(() => filterStore.filteredGimmicks)

const editingGimmickId = ref<string | null>(null)
const editingName = ref('')

// 右クリックメニュー
const contextMenu = ref<{ x: number; y: number; gimmickId: string } | null>(null)

// メモ編集モーダル
const editingMemoGimmickId = ref<string | null>(null)
const editingMemo = ref('')

// ツールチップ表示（拡張ツールチップ用）
const hoveredGimmickId = ref<string | null>(null)
const tooltipPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const hoveredGimmick = computed(() => {
  if (!hoveredGimmickId.value) return null
  return gimmicks.value.find(g => g.id === hoveredGimmickId.value)
})

function getStyle(gimmick: typeof gimmicks.value[0]) {
  const width = Math.max(uiStore.timeToPixel(gimmick.castDuration), 60)
  return {
    left: `${uiStore.timeToPixel(gimmick.time)}px`,
    width: `${width}px`
  }
}

function isSelected(gimmickId: string) {
  return uiStore.selectedObjectId === gimmickId && uiStore.selectedObjectType === 'gimmick'
}

// 高優先度ギミック（必須軽減・無敵推奨）
function isHighPriority(gimmick: typeof gimmicks.value[0]) {
  return gimmick.mitigation === 'required' || gimmick.mitigation === 'invuln'
}

function handleClick(gimmickId: string, e: MouseEvent) {
  e.stopPropagation()
  if (uiStore.isEditMode) {
    uiStore.selectObject(gimmickId, 'gimmick')
  }
}

function handleDoubleClick(gimmick: typeof gimmicks.value[0]) {
  if (uiStore.isEditMode) {
    editingGimmickId.value = gimmick.id
    editingName.value = gimmick.name
  }
}

function finishEditing() {
  if (editingGimmickId.value) {
    contentStore.updateGimmick({
      id: editingGimmickId.value,
      name: editingName.value
    })
    editingGimmickId.value = null
  }
}

function handleRowClick(e: MouseEvent) {
  if (uiStore.isEditMode && uiStore.selectedTool === 'addGimmick') {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const time = uiStore.pixelToTime(clickX)
    contentStore.addGimmick({ time })
  }
}

// ドラッグ処理
let dragStartX = 0
let dragStartTime = 0

// リサイズ処理
const resizingGimmickId = ref<string | null>(null)
const resizingDuration = ref<number | null>(null)
let resizeStartX = 0
let resizeStartDuration = 0

function handleResizeMouseDown(gimmick: typeof gimmicks.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode || uiStore.selectedTool !== 'select') return
  e.preventDefault()
  e.stopPropagation()

  resizeStartX = e.clientX
  resizeStartDuration = gimmick.castDuration
  resizingGimmickId.value = gimmick.id
  resizingDuration.value = gimmick.castDuration

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - resizeStartX
    const deltaDuration = uiStore.pixelToTime(deltaX) // ミリ秒
    const newDuration = Math.max(100, resizeStartDuration + deltaDuration) // 最小100ms
    resizingDuration.value = Math.round(newDuration / 100) * 100 // 100ms単位に丸める
    contentStore.updateGimmick({
      id: gimmick.id,
      castDuration: resizingDuration.value
    })
  }

  const handleMouseUp = () => {
    resizingGimmickId.value = null
    resizingDuration.value = null
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleContextMenu(gimmick: typeof gimmicks.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode) return
  e.preventDefault()
  e.stopPropagation()
  contextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    gimmickId: gimmick.id
  }
}

function getContextMenuItems(): ContextMenuItem[] {
  if (!contextMenu.value) return []
  const gimmick = gimmicks.value.find(g => g.id === contextMenu.value!.gimmickId)
  return [
    {
      label: 'メモを編集',
      action: () => {
        if (contextMenu.value && gimmick) {
          editingMemoGimmickId.value = gimmick.id
          editingMemo.value = gimmick.memo ?? ''
        }
      }
    },
    {
      label: '削除',
      action: () => {
        if (contextMenu.value) {
          contentStore.deleteGimmick(contextMenu.value.gimmickId)
        }
      }
    }
  ]
}

function saveMemo() {
  if (editingMemoGimmickId.value) {
    contentStore.updateGimmick({
      id: editingMemoGimmickId.value,
      memo: editingMemo.value || undefined
    })
    editingMemoGimmickId.value = null
  }
}

function cancelMemoEdit() {
  editingMemoGimmickId.value = null
  editingMemo.value = ''
}

function handleMouseEnter(gimmick: typeof gimmicks.value[0], e: MouseEvent) {
  // メモまたはメタデータがある場合にツールチップを表示
  if (gimmick.memo || gimmick.category || gimmick.severity || gimmick.mitigation) {
    hoveredGimmickId.value = gimmick.id
    tooltipPosition.value = { x: e.clientX + 10, y: e.clientY + 10 }
  }
}

function handleMouseLeave() {
  hoveredGimmickId.value = null
}

function handleMouseDown(gimmick: typeof gimmicks.value[0], e: MouseEvent) {
  if (!uiStore.isEditMode || uiStore.selectedTool !== 'select') return
  e.preventDefault()
  e.stopPropagation()

  dragStartX = e.clientX
  dragStartTime = gimmick.time

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - dragStartX
    const deltaTime = uiStore.pixelToTime(deltaX)
    const newTime = Math.max(0, dragStartTime + deltaTime)
    contentStore.moveGimmick(gimmick.id, newTime)
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
    class="h-8 relative border-b border-gray-700"
    :class="uiStore.isEditMode && uiStore.selectedTool === 'addGimmick' ? 'cursor-crosshair' : ''"
    @click="handleRowClick"
  >
    <div
      v-for="gimmick in gimmicks"
      :key="gimmick.id"
      class="absolute top-1 h-6 rounded flex items-center px-2 text-xs text-white truncate transition-all"
      :class="[
        getGimmickColorClass(gimmick),
        isSelected(gimmick.id) ? 'ring-2 ring-yellow-400' : '',
        isHighPriority(gimmick) ? 'ring-2 ring-red-500' : '',
        uiStore.isEditMode ? 'cursor-move hover:brightness-110' : '',
        gimmick.memo && !isHighPriority(gimmick) ? 'ring-1 ring-yellow-500/50' : ''
      ]"
      :style="getStyle(gimmick)"
      @click="handleClick(gimmick.id, $event)"
      @dblclick="handleDoubleClick(gimmick)"
      @mousedown="handleMouseDown(gimmick, $event)"
      @contextmenu="handleContextMenu(gimmick, $event)"
      @mouseenter="handleMouseEnter(gimmick, $event)"
      @mouseleave="handleMouseLeave"
    >
      <!-- 発動マーカー（キャスト終了位置） - 編集モード以外で表示 -->
      <div
        v-if="!uiStore.isEditMode"
        class="absolute right-0 top-0 h-full w-1 bg-white opacity-75 pointer-events-none"
        :title="`発動: ${formatSeconds(gimmick.time + gimmick.castDuration)}`"
      />
      <input
        v-if="editingGimmickId === gimmick.id"
        v-model="editingName"
        class="bg-transparent border-none outline-none w-full text-white"
        @blur="finishEditing"
        @keydown.enter="finishEditing"
        @click.stop
      />
      <template v-else>
        <!-- カテゴリアイコン -->
        <span v-if="getCategoryIcon(gimmick.category)" class="mr-1 flex-shrink-0">
          {{ getCategoryIcon(gimmick.category) }}
        </span>
        <span class="truncate">{{ gimmick.name }}</span>
        <!-- 無敵推奨アイコン -->
        <span v-if="gimmick.mitigation === 'invuln'" class="ml-1 flex-shrink-0">⚡</span>
        <!-- メモアイコン -->
        <span v-if="gimmick.memo" class="ml-1 text-yellow-400 flex-shrink-0">📝</span>
      </template>

      <!-- リサイズハンドル（編集モード時のみ） -->
      <div
        v-if="uiStore.isEditMode"
        class="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-purple-400 opacity-0 hover:opacity-100 rounded-r"
        @mousedown.stop="handleResizeMouseDown(gimmick, $event)"
      />

      <!-- リサイズ中の秒数表示 -->
      <div
        v-if="resizingGimmickId === gimmick.id && resizingDuration !== null"
        class="absolute -top-6 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
      >
        {{ formatSeconds(resizingDuration) }}
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

    <!-- 拡張ツールチップ -->
    <GimmickTooltip
      v-if="hoveredGimmick"
      :gimmick="hoveredGimmick"
      :position="tooltipPosition"
    />

    <!-- メモ編集モーダル -->
    <Teleport to="body">
      <div
        v-if="editingMemoGimmickId"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="cancelMemoEdit"
      >
        <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4">
          <h3 class="text-lg font-medium mb-3">メモを編集</h3>
          <textarea
            v-model="editingMemo"
            class="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm resize-none"
            placeholder="メモを入力..."
          />
          <div class="flex justify-end gap-2 mt-3">
            <button
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              @click="cancelMemoEdit"
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
