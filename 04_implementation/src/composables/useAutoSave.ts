/**
 * 自動保存Composable
 */
import { watch } from 'vue'
import { usePartyStore } from '@/stores'
import { debounce } from '@/utils'

export function useAutoSave() {
  const partyStore = usePartyStore()

  const debouncedSave = debounce(() => {
    partyStore.saveParty()
  }, 2000)

  // パーティストアの変更を監視
  watch(
    () => partyStore.currentParty,
    () => {
      debouncedSave()
    },
    { deep: true }
  )

  return {
    saveNow: () => partyStore.saveParty()
  }
}
