<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePartyStore, useUIStore, useContentStore } from '@/stores'
import MemberRow from '@/components/timeline/MemberRow.vue'
import MitigationGraph from '@/components/timeline/MitigationGraph.vue'

const partyStore = usePartyStore()
const uiStore = useUIStore()
const contentStore = useContentStore()

// スクロールコンテナのref
const scrollContainerRef = ref<HTMLElement | null>(null)

// タイムラインの幅
const timelineWidth = computed(() => {
  const duration = contentStore.currentContent?.duration ?? 600
  return uiStore.timeToPixel(duration)
})

// 親コンポーネントにrefを公開
defineExpose({
  scrollContainerRef
})

// スクロールイベントを親に伝える
const emit = defineEmits<{
  scroll: []
  wheel: [WheelEvent]
}>()

function handleScroll() {
  emit('scroll')
}

// ホイールイベントを親に委譲
function handleWheel(e: WheelEvent) {
  emit('wheel', e)
}

onMounted(() => {
  scrollContainerRef.value?.addEventListener('wheel', handleWheel, { passive: false })
})

onUnmounted(() => {
  scrollContainerRef.value?.removeEventListener('wheel', handleWheel)
})
</script>

<template>
  <!-- 通常モード時のみメンバー行を表示 -->
  <div
    v-if="uiStore.isNormalMode"
    ref="scrollContainerRef"
    class="overflow-y-auto"
    style="max-height: calc(100vh - 180px)"
    @scroll="handleScroll"
  >
    <!-- 軽減効果集計行 -->
    <div class="h-16 border-b border-gray-700 relative bg-gray-800/50">
      <MitigationGraph :width="timelineWidth" />
    </div>

    <!-- メンバー行 -->
    <MemberRow
      v-for="member in partyStore.members"
      :key="member.id"
      :member="member"
    />
  </div>
</template>
