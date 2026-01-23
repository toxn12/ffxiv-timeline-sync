<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useContentStore } from '@/stores'

const emit = defineEmits<{
  close: []
}>()

const contentStore = useContentStore()

const content = computed(() => contentStore.currentContent)

const raidName = ref(content.value?.raidName ?? '')
const bossName = ref(content.value?.bossName ?? '')
const duration = ref(content.value?.duration ?? 600)
const targets = ref<string[]>([...(content.value?.targets ?? [])])
const newTarget = ref('')

watch(content, (newContent) => {
  if (newContent) {
    raidName.value = newContent.raidName
    bossName.value = newContent.bossName
    duration.value = newContent.duration
    targets.value = [...newContent.targets]
  }
})

function addTarget() {
  if (newTarget.value.trim() && !targets.value.includes(newTarget.value)) {
    targets.value.push(newTarget.value)
    newTarget.value = ''
  }
}

function removeTarget(target: string) {
  targets.value = targets.value.filter(t => t !== target)
}

function save() {
  contentStore.updateContent({
    raidName: raidName.value,
    bossName: bossName.value,
    duration: duration.value,
    targets: targets.value
  })
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
      <!-- ヘッダー -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 class="text-lg font-medium">コンテンツ設定</h2>
        <button
          class="text-gray-400 hover:text-white"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- コンテンツ -->
      <div class="p-4 space-y-4">
        <!-- レイド名 -->
        <div>
          <label class="block text-sm font-medium mb-1">レイド名</label>
          <input
            v-model="raidName"
            type="text"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
          />
        </div>

        <!-- ボス名 -->
        <div>
          <label class="block text-sm font-medium mb-1">ボス名</label>
          <input
            v-model="bossName"
            type="text"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
          />
        </div>

        <!-- タイムライン長 -->
        <div>
          <label class="block text-sm font-medium mb-1">タイムライン長（秒）</label>
          <input
            v-model.number="duration"
            type="number"
            min="60"
            max="3600"
            step="30"
            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
          />
        </div>

        <!-- ターゲット -->
        <div>
          <label class="block text-sm font-medium mb-1">ターゲット</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span
              v-for="target in targets"
              :key="target"
              class="px-2 py-1 bg-gray-700 rounded text-sm flex items-center gap-1"
            >
              {{ target }}
              <button
                class="text-gray-400 hover:text-red-400"
                @click="removeTarget(target)"
              >
                ✕
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newTarget"
              type="text"
              placeholder="新しいターゲット"
              class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm"
              @keydown.enter="addTarget"
            />
            <button
              class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              @click="addTarget"
            >
              追加
            </button>
          </div>
        </div>
      </div>

      <!-- フッター -->
      <div class="flex justify-end gap-2 px-4 py-3 border-t border-gray-700">
        <button
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          @click="emit('close')"
        >
          キャンセル
        </button>
        <button
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          @click="save"
        >
          保存
        </button>
      </div>

      <!-- 注意書き -->
      <div class="px-4 pb-4">
        <div class="p-3 bg-yellow-900 bg-opacity-50 rounded text-xs text-yellow-200">
          ⚠ 新規作成について<br>
          保存したJSONファイルは、以下の場所に手動で配置してください:<br>
          <code class="bg-gray-900 px-1 rounded">public/data/contents/[レイド名]/[ボス名].json</code><br>
          また、index.json にもエントリを追記してください。
        </div>
      </div>
    </div>
  </div>
</template>
