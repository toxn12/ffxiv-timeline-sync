<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
      <!-- コンテンツ -->
      <div class="p-6">
        <p class="text-sm">{{ message }}</p>
      </div>

      <!-- フッター -->
      <div class="flex justify-end gap-2 px-4 py-3 border-t border-gray-700">
        <button
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          @click="emit('cancel')"
        >
          キャンセル
        </button>
        <button
          class="px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-sm"
          @click="emit('confirm')"
        >
          確認
        </button>
      </div>
    </div>
  </div>
</template>
