<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGimmickFilterStore } from '@/stores/gimmickFilterStore'
import {
  categoryLabels,
  severityLabels,
  mitigationLabels,
  roleLabels,
  getCategoryIcon
} from '@/utils/gimmickStyles'
import type { GimmickCategory, Severity, MitigationLevel } from '@/types'

const filterStore = useGimmickFilterStore()
const isOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)

// 外側クリックで閉じる
function handleClickOutside(e: MouseEvent) {
  if (panelRef.value && !panelRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function togglePanel(e: MouseEvent) {
  e.stopPropagation()
  isOpen.value = !isOpen.value
}

function handleClearFilters() {
  filterStore.clearAllFilters()
  isOpen.value = false
}
</script>

<template>
  <div ref="panelRef" class="relative">
    <!-- フィルタボタン -->
    <button
      class="px-3 py-1.5 rounded text-sm flex items-center gap-2 transition-colors"
      :class="filterStore.isFilterActive
        ? 'bg-blue-600 hover:bg-blue-500'
        : 'bg-gray-700 hover:bg-gray-600'"
      @click="togglePanel"
    >
      🔍 フィルタ
      <span v-if="filterStore.isFilterActive" class="bg-red-500 rounded-full w-2 h-2" />
    </button>

    <!-- ドロップダウンパネル -->
    <div
      v-if="isOpen"
      class="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded shadow-xl p-4 z-50 min-w-[350px]"
      @click.stop
    >
      <!-- ロール選択 -->
      <div class="mb-4">
        <div class="text-xs font-semibold mb-2 text-gray-300">ロール</div>
        <div class="flex gap-2">
          <button
            v-for="(label, role) in roleLabels"
            :key="role"
            class="px-3 py-1.5 rounded text-xs transition-colors flex-1"
            :class="filterStore.activeRoleFilter === role
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-gray-700 hover:bg-gray-600'"
            @click="filterStore.setRoleFilter(role as 'all' | 'tanks' | 'healers' | 'dps')"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- カテゴリ選択 -->
      <div class="mb-4">
        <div class="text-xs font-semibold mb-2 text-gray-300">カテゴリ</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(label, category) in categoryLabels"
            :key="category"
            class="px-2 py-1 rounded text-xs transition-colors"
            :class="filterStore.activeCategories.has(category as GimmickCategory)
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-gray-700 hover:bg-gray-600'"
            @click="filterStore.toggleCategory(category as GimmickCategory)"
          >
            {{ getCategoryIcon(category as GimmickCategory) }} {{ label }}
          </button>
        </div>
      </div>

      <!-- 危険度選択 -->
      <div class="mb-4">
        <div class="text-xs font-semibold mb-2 text-gray-300">危険度</div>
        <div class="flex gap-2">
          <button
            v-for="(label, severity) in severityLabels"
            :key="severity"
            class="px-2 py-1.5 rounded text-xs transition-colors flex-1"
            :class="filterStore.activeSeverities.has(severity as Severity)
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-gray-700 hover:bg-gray-600'"
            @click="filterStore.toggleSeverity(severity as Severity)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- 軽減推奨度選択 -->
      <div class="mb-4">
        <div class="text-xs font-semibold mb-2 text-gray-300">軽減推奨度</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(label, mitigation) in mitigationLabels"
            :key="mitigation"
            class="px-2 py-1 rounded text-xs transition-colors"
            :class="filterStore.activeMitigations.has(mitigation as MitigationLevel)
              ? 'bg-blue-600 hover:bg-blue-500'
              : 'bg-gray-700 hover:bg-gray-600'"
            @click="filterStore.toggleMitigation(mitigation as MitigationLevel)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <!-- クリアボタン -->
      <button
        v-if="filterStore.isFilterActive"
        class="w-full px-3 py-2 bg-red-600 hover:bg-red-500 rounded text-sm transition-colors"
        @click="handleClearFilters"
      >
        フィルタをクリア
      </button>
    </div>
  </div>
</template>
