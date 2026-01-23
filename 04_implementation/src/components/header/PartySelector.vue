<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePartyStore } from '@/stores'

const partyStore = usePartyStore()

const isOpen = ref(false)

const currentPartyName = computed(() => {
  return partyStore.currentParty?.name ?? 'パーティ選択'
})

function selectParty(partyId: string) {
  partyStore.selectParty(partyId)
  isOpen.value = false
}
</script>

<template>
  <div class="relative">
    <button
      class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
      @click="isOpen = !isOpen"
    >
      <span class="truncate max-w-32">{{ currentPartyName }}</span>
      <span class="text-xs">▼</span>
    </button>

    <!-- ドロップダウン -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-40"
    >
      <div
        v-for="party in partyStore.partyList"
        :key="party.id"
        class="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
        :class="{ 'bg-gray-700': party.id === partyStore.currentPartyId }"
        @click="selectParty(party.id)"
      >
        {{ party.name }}
      </div>

      <div v-if="partyStore.partyList.length === 0" class="px-3 py-2 text-sm text-gray-500">
        パーティがありません
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
