<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore, useUIStore } from '@/stores'

const contentStore = useContentStore()
const uiStore = useUIStore()

const isOpen = ref(false)
const hoveredRaid = ref<string | null>(null)

const currentBossName = computed(() => {
  if (!contentStore.currentContent) return 'コンテンツ選択'
  return `${contentStore.currentContent.raidName} - ${contentStore.currentContent.bossName}`
})

async function selectBoss(file: string, editMode: boolean) {
  isOpen.value = false
  await contentStore.selectContentByFile(file)
  uiStore.setMode(editMode ? 'edit' : 'normal')
}

function createNew() {
  contentStore.createContent({})
  uiStore.setMode('edit')
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <button
      class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
      @click="isOpen = !isOpen"
    >
      <span class="truncate max-w-48">{{ currentBossName }}</span>
      <span class="text-xs">▼</span>
    </button>

    <!-- ドロップダウン -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-48"
    >
      <!-- レイド一覧 -->
      <div
        v-for="raid in contentStore.raidList"
        :key="raid.name"
        class="relative"
        @mouseenter="hoveredRaid = raid.name"
        @mouseleave="hoveredRaid = null"
      >
        <div class="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center justify-between">
          <span class="text-sm">{{ raid.name }}</span>
          <span class="text-xs">▶</span>
        </div>

        <!-- サブメニュー -->
        <div
          v-if="hoveredRaid === raid.name"
          class="absolute left-full top-0 bg-gray-800 border border-gray-700 rounded shadow-lg min-w-40"
        >
          <template v-for="boss in raid.bosses" :key="boss.name">
            <div
              class="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
              @click="selectBoss(boss.file, false)"
            >
              {{ boss.name }}
            </div>
            <div
              class="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-yellow-400"
              @click="selectBoss(boss.file, true)"
            >
              {{ boss.name }}（編集）
            </div>
          </template>
        </div>
      </div>

      <!-- 区切り線 -->
      <div class="border-t border-gray-700 my-1" />

      <!-- 新規作成 -->
      <div
        class="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-green-400"
        @click="createNew"
      >
        ＋ 新規作成
      </div>
    </div>

    <!-- オーバーレイ -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    />
  </div>
</template>
