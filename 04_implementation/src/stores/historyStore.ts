/**
 * Undo/Redo履歴管理ストア
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HistoryEntry } from '@/types'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  // State
  const undoStack = ref<HistoryEntry[]>([])
  const redoStack = ref<HistoryEntry[]>([])

  // Getters
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  // Actions

  // 履歴に追加
  function push(type: 'content' | 'party', state: unknown): void {
    const entry: HistoryEntry = {
      type,
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(state))
    }

    undoStack.value.push(entry)

    // 最大数を超えたら古いものを削除
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }

    // Redoスタックをクリア
    redoStack.value = []
  }

  // Undo
  function undo(): HistoryEntry | null {
    if (undoStack.value.length === 0) return null

    const entry = undoStack.value.pop()!
    redoStack.value.push(entry)

    return entry
  }

  // Redo
  function redo(): HistoryEntry | null {
    if (redoStack.value.length === 0) return null

    const entry = redoStack.value.pop()!
    undoStack.value.push(entry)

    return entry
  }

  // クリア
  function clear(): void {
    undoStack.value = []
    redoStack.value = []
  }

  return {
    // State
    undoStack,
    redoStack,
    // Getters
    canUndo,
    canRedo,
    // Actions
    push,
    undo,
    redo,
    clear
  }
})
