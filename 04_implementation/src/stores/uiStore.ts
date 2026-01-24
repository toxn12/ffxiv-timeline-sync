/**
 * UI状態管理ストア
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppMode, EditTool, ObjectType } from '@/types'

export const useUIStore = defineStore('ui', () => {
  // State
  const mode = ref<AppMode>('normal')
  const selectedTool = ref<EditTool>('select')
  const selectedObjectId = ref<string | null>(null)
  const selectedObjectType = ref<ObjectType | null>(null)
  const zoomLevel = ref(2.5) // デフォルト2.5倍（1秒=25px）
  const scrollPosition = ref({ x: 0, y: 0 })

  const modals = ref({
    partyManage: false,
    contentSettings: false,
    confirm: false
  })

  const confirmData = ref<{
    message: string
    onConfirm: () => void
  } | null>(null)

  // ドラッグ中の時刻表示用
  const draggingTime = ref<{ time: number; x: number; y: number } | null>(null)

  // スキルドラッグ中の垂直線表示用（開始位置と終了位置）
  const draggingSkillPositions = ref<{ startTime: number; endTime: number } | null>(null)

  // Getters
  const isEditMode = computed(() => mode.value === 'edit')
  const isNormalMode = computed(() => mode.value === 'normal')
  const hasSelection = computed(() => selectedObjectId.value !== null)

  // 時間→ピクセル変換（1秒 = 10px * zoomLevel）
  const pixelsPerSecond = computed(() => 10 * zoomLevel.value)

  // Actions

  // モード設定
  function setMode(newMode: AppMode): void {
    mode.value = newMode
    if (newMode === 'normal') {
      selectedTool.value = 'select'
    }
    clearSelection()
  }

  // ツール設定
  function setTool(tool: EditTool): void {
    selectedTool.value = tool
    clearSelection()
  }

  // オブジェクト選択
  function selectObject(id: string, type: ObjectType): void {
    selectedObjectId.value = id
    selectedObjectType.value = type
  }

  // メンバー選択
  function selectMember(memberId: string): void {
    selectedObjectId.value = memberId
    selectedObjectType.value = 'member'
  }

  // 選択解除
  function clearSelection(): void {
    selectedObjectId.value = null
    selectedObjectType.value = null
  }

  // ズーム設定
  function setZoom(level: number): void {
    zoomLevel.value = Math.max(0.25, Math.min(4.0, level))
  }

  // ズームイン
  function zoomIn(): void {
    setZoom(zoomLevel.value * 1.25)
  }

  // ズームアウト
  function zoomOut(): void {
    setZoom(zoomLevel.value / 1.25)
  }

  // スクロール位置設定
  function setScrollPosition(x: number, y: number): void {
    scrollPosition.value = { x, y }
  }

  // モーダルを開く
  function openModal(name: keyof typeof modals.value): void {
    modals.value[name] = true
  }

  // モーダルを閉じる
  function closeModal(name: keyof typeof modals.value): void {
    modals.value[name] = false
    if (name === 'confirm') {
      confirmData.value = null
    }
  }

  // 確認ダイアログを表示
  function showConfirm(message: string, onConfirm: () => void): void {
    confirmData.value = { message, onConfirm }
    modals.value.confirm = true
  }

  // 確認ダイアログの確定
  function executeConfirm(): void {
    if (confirmData.value) {
      confirmData.value.onConfirm()
    }
    closeModal('confirm')
  }

  // 時間をピクセル位置に変換（time: ミリ秒）
  function timeToPixel(timeMs: number): number {
    return (timeMs / 1000) * pixelsPerSecond.value
  }

  // ピクセル位置を時間に変換（戻り値: ミリ秒）
  function pixelToTime(pixel: number): number {
    return (pixel / pixelsPerSecond.value) * 1000
  }

  // ドラッグ中の時刻を設定
  function setDraggingTime(time: number | null, x?: number, y?: number): void {
    if (time === null) {
      draggingTime.value = null
    } else {
      draggingTime.value = { time, x: x ?? 0, y: y ?? 0 }
    }
  }

  // スキルドラッグ中の垂直線位置を設定
  function setDraggingSkillPositions(startTime: number | null, endTime?: number): void {
    if (startTime === null) {
      draggingSkillPositions.value = null
    } else {
      draggingSkillPositions.value = { startTime, endTime: endTime ?? startTime }
    }
  }

  return {
    // State
    mode,
    selectedTool,
    selectedObjectId,
    selectedObjectType,
    zoomLevel,
    scrollPosition,
    modals,
    confirmData,
    draggingTime,
    draggingSkillPositions,
    // Getters
    isEditMode,
    isNormalMode,
    hasSelection,
    pixelsPerSecond,
    // Actions
    setMode,
    setTool,
    selectObject,
    selectMember,
    clearSelection,
    setZoom,
    zoomIn,
    zoomOut,
    setScrollPosition,
    openModal,
    closeModal,
    showConfirm,
    executeConfirm,
    timeToPixel,
    pixelToTime,
    setDraggingTime,
    setDraggingSkillPositions
  }
})
