<script setup lang="ts">
import { computed } from 'vue'
import { useUIStore } from '@/stores'

const uiStore = useUIStore()

const helpText = computed(() => {
  if (uiStore.isEditMode) {
    switch (uiStore.selectedTool) {
      case 'select':
        return 'クリックで選択、ドラッグで移動。Delete で削除。'
      case 'split':
        return 'フェーズバーをクリックして分割。'
      case 'delete':
        return 'クリックで削除。'
      case 'addGimmick':
        return 'ギミック行をクリックして追加。'
      case 'addBurst':
        return 'タイムライン上をクリックしてバーストタイミングを追加。'
      default:
        return ''
    }
  }
  return 'ジョブ行をクリックしてスキルを配置。ホイールで横スクロール、Shift+ホイールでズーム。'
})
</script>

<template>
  <footer class="bg-gray-800 border-t border-gray-700 px-4 py-2">
    <p class="text-xs text-gray-400">{{ helpText }}</p>
  </footer>
</template>
