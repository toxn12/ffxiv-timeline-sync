<script setup lang="ts">
import { useUIStore } from '@/stores'

const uiStore = useUIStore()
</script>

<template>
  <div
    v-if="uiStore.isLoading"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95"
  >
    <div class="flex flex-col items-center gap-6 max-w-md w-full px-6">
      <!-- スピナー -->
      <div class="relative">
        <div
          class="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"
        ></div>
      </div>

      <!-- ローディングメッセージ -->
      <div class="text-center">
        <p class="text-lg font-medium text-white mb-2">
          {{ uiStore.loadingMessage }}
        </p>
        <p
          v-if="uiStore.loadingProgress.total > 0"
          class="text-sm text-gray-400"
        >
          {{ uiStore.loadingProgress.current }} / {{ uiStore.loadingProgress.total }}
        </p>
      </div>

      <!-- プログレスバー（総数がある場合のみ） -->
      <div
        v-if="uiStore.loadingProgress.total > 0"
        class="w-full bg-gray-700 rounded-full h-2 overflow-hidden"
      >
        <div
          class="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
          :style="{
            width: `${(uiStore.loadingProgress.current / uiStore.loadingProgress.total) * 100}%`
          }"
        ></div>
      </div>
    </div>
  </div>
</template>
