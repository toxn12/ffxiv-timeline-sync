/**
 * キーボードショートカットComposable
 */
import { onMounted, onUnmounted } from 'vue'
import type { KeyboardShortcut } from '@/types'

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  function handleKeydown(e: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      // undefined の場合は修飾キーの状態を問わない、明示的に指定された場合のみチェック
      const ctrlMatch = shortcut.ctrl === undefined || e.ctrlKey === shortcut.ctrl
      const shiftMatch = shortcut.shift === undefined || e.shiftKey === shortcut.shift
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

      if (ctrlMatch && shiftMatch && keyMatch) {
        e.preventDefault()
        shortcut.action()
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}
