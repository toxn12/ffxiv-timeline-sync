/**
 * 自動保存Composable
 */
import { watch, onUnmounted } from 'vue'
import { usePartyStore } from '@/stores'
import { debounce } from '@/utils'

export function useAutoSave() {
  const partyStore = usePartyStore()

  const debouncedSave = debounce(() => {
    partyStore.saveParty()
  }, 2000)

  // パーティストアの変更を監視
  const stopWatch = watch(
    () => partyStore.currentParty,
    () => {
      debouncedSave()
    },
    { deep: true }
  )

  // コンポーネントアンマウント時にクリーンアップ
  onUnmounted(() => {
    stopWatch()
    debouncedSave.cancel()
  })

  return {
    saveNow: () => partyStore.saveParty()
  }
}
