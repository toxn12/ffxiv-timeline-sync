<script setup lang="ts">
import { onMounted } from 'vue'
import { useContentStore, usePartyStore, useSkillMasterStore, useUIStore, useHistoryStore } from '@/stores'
import AppHeader from '@/components/AppHeader.vue'
import Timeline from '@/components/Timeline.vue'
import HelpText from '@/components/HelpText.vue'
import LoadingIndicator from '@/components/LoadingIndicator.vue'
import PartyManageModal from '@/components/modals/PartyManageModal.vue'
import ContentSettingsModal from '@/components/modals/ContentSettingsModal.vue'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'

const contentStore = useContentStore()
const partyStore = usePartyStore()
const skillMasterStore = useSkillMasterStore()
const uiStore = useUIStore()
const historyStore = useHistoryStore()

// キーボードショートカット
function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Z: Undo
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    const entry = historyStore.undo()
    if (entry) {
      if (entry.type === 'content') {
        contentStore.restoreState(entry.state as any)
      } else {
        partyStore.restoreState(entry.state as any)
      }
    }
  }
  // Ctrl+Y or Ctrl+Shift+Z: Redo
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
    e.preventDefault()
    const entry = historyStore.redo()
    if (entry) {
      if (entry.type === 'content') {
        contentStore.restoreState(entry.state as any)
      } else {
        partyStore.restoreState(entry.state as any)
      }
    }
  }
  // Ctrl+S: Save
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    if (uiStore.isEditMode) {
      contentStore.saveContent()
    } else {
      partyStore.saveParty()
    }
  }
  // Delete/Backspace: Delete selected
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (uiStore.hasSelection && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault()
      handleDelete()
    }
  }
  // V: Select tool
  if (e.key === 'v' && !e.ctrlKey && uiStore.isEditMode) {
    uiStore.setTool('select')
  }
  // C: Split tool
  if (e.key === 'c' && !e.ctrlKey && uiStore.isEditMode) {
    uiStore.setTool('split')
  }
  // Escape: Clear selection
  if (e.key === 'Escape') {
    uiStore.clearSelection()
  }
}

function handleDelete() {
  if (!uiStore.selectedObjectId || !uiStore.selectedObjectType) return

  const id = uiStore.selectedObjectId
  const type = uiStore.selectedObjectType

  if (type === 'gimmick') {
    contentStore.deleteGimmick(id)
  } else if (type === 'phase') {
    contentStore.deletePhase(id)
  } else if (type === 'burst') {
    contentStore.deleteBurst(id)
  } else if (type === 'skill') {
    partyStore.deleteSkill(id)
  }

  uiStore.clearSelection()
}

onMounted(async () => {
  try {
    // データ読み込み
    await Promise.all([
      contentStore.loadContents(),
      skillMasterStore.loadSkillMaster()
    ])
    partyStore.loadParties()

    // 初期選択
    if (contentStore.contents.length > 0) {
      contentStore.selectContent(contentStore.contents[0].id)
    }

    // パーティがなければ作成
    if (partyStore.parties.length === 0 && contentStore.currentContentId) {
      partyStore.createParty({ contentId: contentStore.currentContentId })
    }
    if (partyStore.parties.length > 0) {
      partyStore.selectParty(partyStore.parties[0].id)
    }
  } finally {
    // ローディング終了
    uiStore.stopLoading()

    // キーボードイベント
    window.addEventListener('keydown', handleKeydown)
  }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-900 text-white">
    <!-- ローディングインジケータ -->
    <LoadingIndicator />

    <!-- ヘッダー -->
    <AppHeader />

    <!-- メインエリア -->
    <main class="flex-1 overflow-hidden">
      <Timeline />
    </main>

    <!-- ヘルプテキスト -->
    <HelpText />

    <!-- モーダル -->
    <PartyManageModal
      v-if="uiStore.modals.partyManage"
      @close="uiStore.closeModal('partyManage')"
    />
    <ContentSettingsModal
      v-if="uiStore.modals.contentSettings"
      @close="uiStore.closeModal('contentSettings')"
    />
    <ConfirmModal
      v-if="uiStore.modals.confirm"
      :message="uiStore.confirmData?.message ?? ''"
      @confirm="uiStore.executeConfirm()"
      @cancel="uiStore.closeModal('confirm')"
    />
  </div>
</template>
