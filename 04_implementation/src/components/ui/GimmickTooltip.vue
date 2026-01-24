<script setup lang="ts">
import type { Gimmick } from '@/types'
import {
  categoryLabels,
  severityLabels,
  mitigationLabels,
  damageTypeLabels,
  getCategoryIcon,
  getMitigationLevel
} from '@/utils/gimmickStyles'

defineProps<{
  gimmick: Gimmick
  position: { x: number; y: number }
}>()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed z-50 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-xs text-white max-w-xs pointer-events-none shadow-xl"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
    >
      <!-- ギミック名 + アイコン -->
      <div class="font-bold mb-2 flex items-center gap-1">
        <span v-if="gimmick.category">{{ getCategoryIcon(gimmick.category) }}</span>
        <span>{{ gimmick.name }}</span>
      </div>

      <!-- メタデータがある場合のみ表示 -->
      <template v-if="gimmick.category || gimmick.severity || gimmick.mitigation">
        <div class="border-t border-gray-700 my-2" />

        <!-- カテゴリ -->
        <div v-if="gimmick.category" class="mb-1">
          <span class="text-gray-400">カテゴリ:</span>
          <span class="ml-2">{{ categoryLabels[gimmick.category] }}</span>
        </div>

        <!-- ダメージタイプ -->
        <div v-if="gimmick.damageType" class="mb-1">
          <span class="text-gray-400">ダメージ:</span>
          <span class="ml-2">{{ damageTypeLabels[gimmick.damageType] }}</span>
        </div>

        <!-- 危険度 -->
        <div v-if="gimmick.severity" class="mb-1">
          <span class="text-gray-400">危険度:</span>
          <span
            class="ml-2 font-semibold"
            :class="{
              'text-blue-400': gimmick.severity === 'low',
              'text-yellow-400': gimmick.severity === 'medium',
              'text-orange-400': gimmick.severity === 'high',
              'text-red-400': gimmick.severity === 'fatal'
            }"
          >
            {{ severityLabels[gimmick.severity] }}
          </span>
        </div>

        <!-- 軽減推奨度 -->
        <div v-if="gimmick.mitigation" class="mb-1">
          <span class="text-gray-400">軽減:</span>
          <span class="ml-2">
            {{ '🛡️'.repeat(getMitigationLevel(gimmick.mitigation)) }}
            {{ mitigationLabels[gimmick.mitigation] }}
          </span>
        </div>

        <!-- ターゲット -->
        <div v-if="gimmick.targets && gimmick.targets.length > 0" class="mb-1">
          <span class="text-gray-400">ターゲット:</span>
          <span class="ml-2">{{ gimmick.targets.join(', ') }}</span>
        </div>

        <!-- 説明 -->
        <div v-if="gimmick.description" class="border-t border-gray-700 my-2 pt-2 text-gray-300 leading-relaxed">
          {{ gimmick.description }}
        </div>

        <!-- ギミック要素 -->
        <div v-if="gimmick.mechanics && gimmick.mechanics.length > 0" class="mt-2">
          <div class="text-gray-400 mb-1">ギミック要素:</div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="mechanic in gimmick.mechanics"
              :key="mechanic"
              class="bg-gray-700 px-2 py-0.5 rounded text-xs"
            >
              {{ mechanic }}
            </span>
          </div>
        </div>
      </template>

      <!-- メモ -->
      <div v-if="gimmick.memo" class="border-t border-gray-700 my-2 pt-2 text-yellow-200">
        <span class="text-yellow-400">📝</span> {{ gimmick.memo }}
      </div>
    </div>
  </Teleport>
</template>
