<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

export interface ContextMenuItem {
  label: string
  action: () => void
  disabled?: boolean
  divider?: boolean
}

const props = defineProps<{
  x: number
  y: number
  items: ContextMenuItem[]
}>()

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLElement | null>(null)

function handleItemClick(item: ContextMenuItem) {
  if (item.disabled) return
  item.action()
  emit('close')
}

function handleOutsideClick(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  // メニューの位置を調整（画面外に出ないように）
  if (menuRef.value) {
    const rect = menuRef.value.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (rect.right > viewportWidth) {
      menuRef.value.style.left = `${props.x - rect.width}px`
    }
    if (rect.bottom > viewportHeight) {
      menuRef.value.style.top = `${props.y - rect.height}px`
    }
  }

  // 外側クリックで閉じる
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick)
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div
    ref="menuRef"
    class="fixed z-50 bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[150px]"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <template v-for="(item, index) in items" :key="index">
      <div
        v-if="item.divider"
        class="h-px bg-gray-700 my-1"
      />
      <button
        v-else
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="item.disabled"
        @click="handleItemClick(item)"
      >
        {{ item.label }}
      </button>
    </template>
  </div>
</template>
