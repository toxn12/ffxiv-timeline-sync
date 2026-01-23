<script setup lang="ts">
import { useUIStore, useContentStore } from '@/stores'

const uiStore = useUIStore()
const contentStore = useContentStore()

const tools = [
  { id: 'select' as const, icon: '↖', label: '選択', shortcut: 'V' },
  { id: 'split' as const, icon: '✂', label: '分割', shortcut: 'C' },
  { id: 'addMemo' as const, icon: '◆', label: 'メモ追加', shortcut: 'M' }
]

function addGimmick() {
  contentStore.addGimmick({ time: 0 })
}

function addBurst() {
  contentStore.addBurst({ startTime: 0, endTime: 15 })
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- ツール選択 -->
    <div class="flex border border-gray-600 rounded overflow-hidden">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="px-3 py-1.5 text-sm"
        :class="uiStore.selectedTool === tool.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'"
        :title="`${tool.label} (${tool.shortcut})`"
        @click="uiStore.setTool(tool.id)"
      >
        {{ tool.icon }}
      </button>
    </div>

    <!-- 追加ボタン -->
    <button
      class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
      @click="addGimmick"
    >
      ＋ギミック
    </button>
    <button
      class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
      @click="addBurst"
    >
      ＋バースト
    </button>
  </div>
</template>
