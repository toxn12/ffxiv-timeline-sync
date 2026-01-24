/**
 * ギミックフィルタリングの状態管理ストア
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useContentStore } from './contentStore'
import type { GimmickCategory, Severity, MitigationLevel, TargetType } from '@/types'

export const useGimmickFilterStore = defineStore('gimmickFilter', () => {
  const contentStore = useContentStore()

  // フィルタ状態
  const activeCategories = ref<Set<GimmickCategory>>(new Set())
  const activeSeverities = ref<Set<Severity>>(new Set())
  const activeMitigations = ref<Set<MitigationLevel>>(new Set())
  const activeRoleFilter = ref<'all' | 'tanks' | 'healers' | 'dps'>('all')
  const showOnlyMetadata = ref(false)

  // フィルタ適用済みギミック
  const filteredGimmicks = computed(() => {
    return contentStore.gimmicks.filter(gimmick => {
      // メタデータなしギミックは常に表示（後方互換性）
      if (!gimmick.category && !showOnlyMetadata.value) return true

      // カテゴリフィルタ
      if (activeCategories.value.size > 0) {
        if (!gimmick.category) return false
        if (!activeCategories.value.has(gimmick.category)) return false
      }

      // 危険度フィルタ
      if (activeSeverities.value.size > 0) {
        if (!gimmick.severity) return false
        if (!activeSeverities.value.has(gimmick.severity)) return false
      }

      // 軽減フィルタ
      if (activeMitigations.value.size > 0) {
        if (!gimmick.mitigation) return false
        if (!activeMitigations.value.has(gimmick.mitigation)) return false
      }

      // ロールフィルタ
      if (activeRoleFilter.value !== 'all') {
        if (!gimmick.targets || gimmick.targets.length === 0) return true // ターゲット未指定は全員向けとみなす
        const roleTargets = getRoleTargets(activeRoleFilter.value)
        if (!gimmick.targets.some(t => roleTargets.includes(t))) return false
      }

      return true
    })
  })

  // フィルタがアクティブかどうか
  const isFilterActive = computed(() => {
    return activeCategories.value.size > 0 ||
           activeSeverities.value.size > 0 ||
           activeMitigations.value.size > 0 ||
           activeRoleFilter.value !== 'all' ||
           showOnlyMetadata.value
  })

  // アクション
  function toggleCategory(category: GimmickCategory) {
    if (activeCategories.value.has(category)) {
      activeCategories.value.delete(category)
    } else {
      activeCategories.value.add(category)
    }
  }

  function toggleSeverity(severity: Severity) {
    if (activeSeverities.value.has(severity)) {
      activeSeverities.value.delete(severity)
    } else {
      activeSeverities.value.add(severity)
    }
  }

  function toggleMitigation(mitigation: MitigationLevel) {
    if (activeMitigations.value.has(mitigation)) {
      activeMitigations.value.delete(mitigation)
    } else {
      activeMitigations.value.add(mitigation)
    }
  }

  function setRoleFilter(role: 'all' | 'tanks' | 'healers' | 'dps') {
    activeRoleFilter.value = role
  }

  function clearAllFilters() {
    activeCategories.value.clear()
    activeSeverities.value.clear()
    activeMitigations.value.clear()
    activeRoleFilter.value = 'all'
    showOnlyMetadata.value = false
  }

  return {
    // State
    activeCategories,
    activeSeverities,
    activeMitigations,
    activeRoleFilter,
    showOnlyMetadata,

    // Getters
    filteredGimmicks,
    isFilterActive,

    // Actions
    toggleCategory,
    toggleSeverity,
    toggleMitigation,
    setRoleFilter,
    clearAllFilters
  }
})

/**
 * ロールに対応するターゲットタイプを取得
 */
function getRoleTargets(role: 'tanks' | 'healers' | 'dps'): TargetType[] {
  switch (role) {
    case 'tanks':
      return ['tanks', 'mt', 'st', 'all']
    case 'healers':
      return ['healers', 'all']
    case 'dps':
      return ['dps', 'all']
  }
}
