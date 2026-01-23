<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePartyStore, useContentStore } from '@/stores'

const emit = defineEmits<{
  close: []
}>()

const partyStore = usePartyStore()
const contentStore = useContentStore()

const newPartyName = ref('')
const importJson = ref('')
const errorMessage = ref('')

// 現在選択中のパーティID
const selectedPartyId = computed(() => partyStore.currentPartyId)

function createParty() {
  if (!newPartyName.value.trim()) {
    errorMessage.value = 'パーティ名を入力してください'
    return
  }
  partyStore.createParty({
    name: newPartyName.value,
    contentId: contentStore.currentContentId ?? ''
  })
  newPartyName.value = ''
  errorMessage.value = ''
}

function selectParty(partyId: string) {
  partyStore.selectParty(partyId)
  // パーティのcontentIdを現在のコンテンツに更新
  const party = partyStore.parties.find(p => p.id === partyId)
  if (party && contentStore.currentContentId) {
    partyStore.updateParty({ contentId: contentStore.currentContentId })
  }
}

function deleteParty(partyId: string) {
  if (confirm('このパーティを削除しますか？')) {
    partyStore.deleteParty(partyId)
  }
}

function exportParty() {
  partyStore.exportParty()
}

function importParty() {
  if (!importJson.value.trim()) {
    errorMessage.value = 'JSONを入力してください'
    return
  }
  try {
    partyStore.importParty(importJson.value)
    importJson.value = ''
    errorMessage.value = ''
  } catch (e) {
    errorMessage.value = (e as Error).message
  }
}

function handleFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      importJson.value = reader.result as string
    }
    reader.readAsText(file)
  }
}

function handleClose() {
  // モーダルを閉じる際、選択されたパーティをコンテンツの対象パーティとして確定
  emit('close')
}

function decreaseMemberCount() {
  if (partyStore.currentParty && partyStore.currentParty.members.length > 2) {
    partyStore.setMemberCount(partyStore.currentParty.members.length - 1)
  }
}

function increaseMemberCount() {
  if (partyStore.currentParty && partyStore.currentParty.members.length < 8) {
    partyStore.setMemberCount(partyStore.currentParty.members.length + 1)
  }
}

function handleMemberCountChange(e: Event) {
  const target = e.target as HTMLSelectElement
  partyStore.setMemberCount(Number(target.value))
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
      <!-- ヘッダー -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 class="text-lg font-medium">パーティ管理</h2>
        <button
          class="text-gray-400 hover:text-white"
          @click="handleClose"
        >
          ✕
        </button>
      </div>

      <!-- コンテンツ -->
      <div class="p-4 overflow-y-auto max-h-[60vh]">
        <!-- エラーメッセージ -->
        <div v-if="errorMessage" class="mb-4 p-2 bg-red-900 text-red-200 rounded text-sm">
          {{ errorMessage }}
        </div>

        <!-- 新規作成 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">新規パーティ作成</h3>
          <div class="flex gap-2">
            <input
              v-model="newPartyName"
              type="text"
              placeholder="パーティ名"
              class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
            />
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              @click="createParty"
            >
              作成
            </button>
          </div>
        </div>

        <!-- パーティ一覧 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">パーティ一覧</h3>
          <div class="space-y-2">
            <div
              v-for="party in partyStore.parties"
              :key="party.id"
              class="flex items-center justify-between p-2 rounded cursor-pointer transition-colors"
              :class="selectedPartyId === party.id ? 'bg-blue-600/30 ring-1 ring-blue-500' : 'bg-gray-700 hover:bg-gray-600'"
              @click="selectParty(party.id)"
            >
              <div class="flex items-center gap-3">
                <!-- チェックマーク -->
                <div
                  class="w-5 h-5 rounded border-2 flex items-center justify-center"
                  :class="selectedPartyId === party.id ? 'border-blue-500 bg-blue-500' : 'border-gray-500'"
                >
                  <span v-if="selectedPartyId === party.id" class="text-white text-xs">✓</span>
                </div>
                <div>
                  <div class="text-sm">{{ party.name }}</div>
                  <div class="text-xs text-gray-400">
                    {{ party.members.length }}人
                  </div>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  class="px-2 py-1 text-xs bg-red-600 hover:bg-red-500 rounded"
                  @click.stop="deleteParty(party.id)"
                >
                  削除
                </button>
              </div>
            </div>
            <div v-if="partyStore.parties.length === 0" class="text-sm text-gray-400">
              パーティがありません
            </div>
          </div>
        </div>

        <!-- パーティ人数調整 -->
        <div v-if="partyStore.currentParty" class="mb-6">
          <h3 class="text-sm font-medium mb-2">パーティ人数調整</h3>
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-400">現在: {{ partyStore.currentParty.members.length }}人</span>
            <div class="flex items-center gap-2">
              <button
                class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="partyStore.currentParty.members.length <= 2"
                @click="decreaseMemberCount"
              >
                -
              </button>
              <select
                :value="partyStore.currentParty.members.length"
                class="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm"
                @change="handleMemberCountChange"
              >
                <option v-for="n in 7" :key="n + 1" :value="n + 1">{{ n + 1 }}人</option>
              </select>
              <button
                class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="partyStore.currentParty.members.length >= 8"
                @click="increaseMemberCount"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- エクスポート -->
        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">エクスポート</h3>
          <button
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            :disabled="!partyStore.currentParty"
            @click="exportParty"
          >
            現在のパーティをJSONでダウンロード
          </button>
        </div>

        <!-- インポート -->
        <div>
          <h3 class="text-sm font-medium mb-2">インポート</h3>
          <div class="space-y-2">
            <input
              type="file"
              accept=".json"
              class="text-sm"
              @change="handleFileInput"
            />
            <textarea
              v-model="importJson"
              placeholder="または、JSONを直接貼り付け"
              class="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm resize-none"
            />
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              @click="importParty"
            >
              インポート
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
