/**
 * ドラッグ＆ドロップComposable
 */
import { ref } from 'vue'
import { useUIStore } from '@/stores'

export interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startTime: number
  currentTime: number
}

export function useDragAndDrop(onMove: (newTime: number) => void) {
  const uiStore = useUIStore()

  const dragState = ref<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentTime: 0
  })

  function startDrag(e: MouseEvent, initialTime: number) {
    dragState.value = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startTime: initialTime,
      currentTime: initialTime
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragState.value.isDragging) return

      const deltaX = moveEvent.clientX - dragState.value.startX
      const deltaTime = uiStore.pixelToTime(deltaX)
      const newTime = Math.max(0, dragState.value.startTime + deltaTime)

      dragState.value.currentTime = newTime
      onMove(newTime)
    }

    const handleMouseUp = () => {
      dragState.value.isDragging = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return {
    dragState,
    startDrag
  }
}
