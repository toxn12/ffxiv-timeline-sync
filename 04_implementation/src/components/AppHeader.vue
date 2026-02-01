<script setup lang="ts">
import { useContentStore, usePartyStore, useUIStore } from '@/stores'
import BossSelector from '@/components/header/BossSelector.vue'
import PartySelector from '@/components/header/PartySelector.vue'
import ZoomControls from '@/components/header/ZoomControls.vue'
import EditToolbar from '@/components/header/EditToolbar.vue'
import GimmickFilterPanel from '@/components/timeline/GimmickFilterPanel.vue'
import { downloadGuideMarkdown } from '@/utils/guideExporter'

const contentStore = useContentStore()
const partyStore = usePartyStore()
const uiStore = useUIStore()

function handleSave() {
  if (uiStore.isEditMode) {
    contentStore.saveContent()
  } else {
    partyStore.exportParty()
  }
}

function handleExitEdit() {
  uiStore.setMode('normal')
}

function handleExportGuide() {
  if (contentStore.currentContent) {
    downloadGuideMarkdown(contentStore.currentContent)
  }
}
</script>

<template>
  <header class="bg-gray-800 border-b border-gray-700 px-4 transition-all duration-300" :class="uiStore.headerCollapsed ? 'py-1' : 'py-2'">
    <!-- モバイル用折りたたみボタン -->
    <button
      class="md:hidden mb-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center gap-1"
      @click="uiStore.toggleHeaderCollapsed()"
    >
      <span v-if="uiStore.headerCollapsed">▼</span>
      <span v-else>▲</span>
      <span>{{ uiStore.headerCollapsed ? 'メニューを表示' : 'メニューを隠す' }}</span>
    </button>

    <!-- 通常モード -->
    <div v-if="uiStore.isNormalMode" class="flex items-center gap-4" :class="{ 'hidden md:flex': uiStore.headerCollapsed }">
      <BossSelector />
      <PartySelector />
      <button
        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        @click="uiStore.openModal('partyManage')"
      >
        パーティ管理
      </button>
      <div class="flex-1" />
      <!-- ギミックフィルタパネル（コンテンツ選択時のみ表示） -->
      <GimmickFilterPanel v-if="contentStore.currentContent" />
      <ZoomControls />
      <!-- 攻略ガイドエクスポート（コンテンツ選択時のみ表示） -->
      <button
        v-if="contentStore.currentContent"
        class="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm"
        @click="handleExportGuide"
      >
        📄 攻略ガイド
      </button>
      <button
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm"
        @click="handleSave"
      >
        ダウンロード
      </button>
    </div>

    <!-- 編集モード -->
    <div v-else class="flex items-center gap-4" :class="{ 'hidden md:flex': uiStore.headerCollapsed }">
      <div class="text-sm font-medium">
        編集中: {{ contentStore.currentContent?.bossName }}
      </div>
      <EditToolbar />
      <div class="flex-1" />
      <ZoomControls />
      <button
        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        @click="uiStore.openModal('contentSettings')"
      >
        設定
      </button>
      <button
        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        @click="handleExitEdit"
      >
        編集終了
      </button>
      <button
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm"
        @click="handleSave"
      >
        ダウンロード
      </button>
    </div>
  </header>
</template>
