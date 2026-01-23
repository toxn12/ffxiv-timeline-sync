<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SkillPlacement } from '@/types'
import { usePartyStore, useSkillMasterStore, useUIStore } from '@/stores'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/ContextMenu.vue'
import { useSkillInterference } from '@/composables/useSkillInterference'

const props = withDefaults(defineProps<{
  placement: SkillPlacement
  memberId: string
  collapsed?: boolean
}>(), {
  collapsed: false
})

const partyStore = usePartyStore()
const skillMasterStore = useSkillMasterStore()
const uiStore = useUIStore()
const { getInterference } = useSkillInterference()

const skill = computed(() => skillMasterStore.getSkillById(props.placement.skillId))

// スキル干渉情報
const interference = computed(() => getInterference(props.placement.id))

// 右クリックメニュー
const contextMenu = ref<{ x: number; y: number } | null>(null)

// メモ編集
const editingMemo = ref(false)
const memoText = ref('')

// ツールチップ表示
const showTooltip = ref(false)
const tooltipPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })

// キャストタイムのスタイル
const castTimeStyle = computed(() => {
  const castTime = skill.value?.castTime ?? 0
  if (castTime === 0) return { display: 'none' }

  const width = Math.max(uiStore.timeToPixel(castTime), 20)
  return {
    left: `${uiStore.timeToPixel(props.placement.time)}px`,
    width: `${width}px`
  }
})

// 効果時間のスタイル（メインバー）
const style = computed(() => {
  const castTime = skill.value?.castTime ?? 0
  const duration = skill.value?.duration ?? 15
  const startTime = props.placement.time + castTime
  const width = Math.max(uiStore.timeToPixel(duration), 40)
  return {
    left: `${uiStore.timeToPixel(startTime)}px`,
    width: `${width}px`
  }
})

// リキャストタイムのスタイル
const recastStyle = computed(() => {
  const castTime = skill.value?.castTime ?? 0
  const duration = skill.value?.duration ?? 15
  const recast = skill.value?.recast ?? 0
  const startTime = props.placement.time + castTime + duration
  const recastDuration = Math.max(recast - castTime - duration, 0)

  if (recastDuration === 0) return { display: 'none' }

  const width = Math.max(uiStore.timeToPixel(recastDuration), 20)
  return {
    left: `${uiStore.timeToPixel(startTime)}px`,
    width: `${width}px`
  }
})

const bgColor = computed(() => {
  switch (skill.value?.type) {
    case '軽減': return 'bg-blue-600'
    case 'バフ': return 'bg-green-600'
    case 'バリア': return 'bg-purple-600'
    case '薬': return 'bg-orange-600'
    default: return 'bg-gray-600'
  }
})

// スキルの効果情報を表示用に整形
const effectText = computed(() => {
  if (!skill.value) return ''
  const effects: string[] = []
  if (skill.value.physicalMitigation) {
    effects.push(`物理軽減${skill.value.physicalMitigation}%`)
  }
  if (skill.value.magicalMitigation) {
    effects.push(`魔法軽減${skill.value.magicalMitigation}%`)
  }
  if (skill.value.buffPower) {
    effects.push(`バフ効果${skill.value.buffPower}%`)
  }
  return effects.length > 0 ? `\n${effects.join(', ')}` : ''
})

const isSelected = computed(() =>
  uiStore.selectedObjectId === props.placement.id && uiStore.selectedObjectType === 'skill'
)

function handleClick(e: MouseEvent) {
  e.stopPropagation()
  uiStore.selectObject(props.placement.id, 'skill')
}

function handleContextMenu(e: MouseEvent) {
  // 折りたたみ時は右クリックメニュー無効化
  if (props.collapsed) return
  e.preventDefault()
  e.stopPropagation()
  contextMenu.value = {
    x: e.clientX,
    y: e.clientY
  }
}

function getContextMenuItems(): ContextMenuItem[] {
  return [
    {
      label: 'メモを編集',
      action: () => {
        editingMemo.value = true
        memoText.value = props.placement.memo ?? ''
      }
    },
    {
      label: '削除',
      action: () => {
        partyStore.deleteSkill(props.placement.id)
      }
    }
  ]
}

function saveMemo() {
  partyStore.updateSkill({
    id: props.placement.id,
    memo: memoText.value || undefined
  })
  editingMemo.value = false
}

function cancelMemoEdit() {
  editingMemo.value = false
  memoText.value = ''
}

function handleMouseEnter(e: MouseEvent) {
  if (props.placement.memo) {
    showTooltip.value = true
    tooltipPosition.value = { x: e.clientX, y: e.clientY }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (props.placement.memo && showTooltip.value) {
    tooltipPosition.value = { x: e.clientX, y: e.clientY }
  }
}

function handleMouseLeave() {
  showTooltip.value = false
}

// ドラッグ処理
let dragStartX = 0
let dragStartTime = 0

function handleMouseDown(e: MouseEvent) {
  // 折りたたみ時はドラッグ無効化
  if (props.collapsed) return
  if (!uiStore.isNormalMode) return
  e.preventDefault()
  e.stopPropagation()

  dragStartX = e.clientX
  dragStartTime = props.placement.time

  const duration = skill.value?.duration ?? 15

  const handleMouseMove = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - dragStartX
    const deltaTime = uiStore.pixelToTime(deltaX)
    const newTime = Math.max(0, dragStartTime + deltaTime)
    const endTime = newTime + duration
    partyStore.moveSkill(props.placement.id, newTime)
    uiStore.setDraggingTime(newTime, moveEvent.clientX, moveEvent.clientY)
    uiStore.setDraggingSkillPositions(newTime, endTime)
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    uiStore.setDraggingTime(null)
    uiStore.setDraggingSkillPositions(null)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>

<template>
  <div>
    <!-- キャストタイムバー -->
    <div
      v-if="(skill?.castTime ?? 0) > 0"
      class="absolute top-1 h-8 rounded border-2 border-yellow-400 bg-pink-400/40 pointer-events-none"
      :style="castTimeStyle"
    />

    <!-- 効果時間バー（メインバー） -->
    <div
      class="absolute top-1 h-8 rounded flex items-center justify-center text-xs text-white font-medium cursor-move"
      :class="[bgColor, isSelected ? 'ring-2 ring-yellow-400' : '', placement.memo ? 'ring-1 ring-yellow-500/50' : '', interference?.hasInterference ? 'ring-2 ring-red-500' : '']"
      :style="style"
      :title="`${skill?.name ?? '不明'} (${placement.time}秒)${effectText}${interference?.hasInterference ? `\n⚠️ 干渉: ${interference.interferingMembers.join(', ')}` : ''}`"
      @click="handleClick"
      @contextmenu="handleContextMenu"
      @mousedown="handleMouseDown"
      @mouseenter="handleMouseEnter"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <span class="truncate px-1">{{ skill?.name ?? '?' }}</span>
      <!-- メモアイコン -->
      <span v-if="placement.memo" class="text-yellow-400 text-[10px]">📝</span>
      <!-- 干渉警告アイコン -->
      <span v-if="interference?.hasInterference" class="text-red-400 text-[10px] ml-0.5">⚠️</span>
    </div>

    <!-- リキャストタイムバー -->
    <div
      v-if="(skill?.recast ?? 0) > (skill?.castTime ?? 0) + (skill?.duration ?? 0)"
      class="absolute top-1 h-8 rounded bg-gray-700/50 border border-gray-600 pointer-events-none"
      :style="recastStyle"
    />

    <!-- 右クリックメニュー -->
    <ContextMenu
      v-if="contextMenu"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="getContextMenuItems()"
      @close="contextMenu = null"
    />

    <!-- メモツールチップ -->
    <Teleport to="body">
      <div
        v-if="showTooltip && placement.memo"
        class="fixed z-50 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white max-w-xs whitespace-pre-wrap pointer-events-none"
        :style="{
          left: `${tooltipPosition.x + 10}px`,
          top: `${tooltipPosition.y + 10}px`
        }"
      >
        {{ placement.memo }}
      </div>
    </Teleport>

    <!-- メモ編集モーダル -->
    <Teleport to="body">
      <div
        v-if="editingMemo"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="cancelMemoEdit"
      >
        <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4">
          <h3 class="text-lg font-medium mb-3">メモを編集</h3>
          <textarea
            v-model="memoText"
            class="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm resize-none"
            placeholder="メモを入力..."
          />
          <div class="flex justify-end gap-2 mt-3">
            <button
              class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              @click="cancelMemoEdit"
            >
              キャンセル
            </button>
            <button
              class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
              @click="saveMemo"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
