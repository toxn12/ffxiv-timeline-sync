/**
 * ズームComposable
 */
import { computed } from 'vue'
import { useUIStore } from '@/stores'

export function useZoom() {
  const uiStore = useUIStore()

  const zoomLevel = computed(() => uiStore.zoomLevel)
  const zoomPercent = computed(() => Math.round(uiStore.zoomLevel * 100))

  function handleWheel(e: WheelEvent) {
    if (e.shiftKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        uiStore.zoomIn()
      } else {
        uiStore.zoomOut()
      }
    }
  }

  return {
    zoomLevel,
    zoomPercent,
    zoomIn: uiStore.zoomIn,
    zoomOut: uiStore.zoomOut,
    setZoom: uiStore.setZoom,
    handleWheel
  }
}
