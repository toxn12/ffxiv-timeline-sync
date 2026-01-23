/**
 * キーボードショートカットComposable
 */
import { onMounted, onUnmounted } from 'vue'
import type { KeyboardShortcut } from '@/types'

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  function handleKeydown(e: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
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
