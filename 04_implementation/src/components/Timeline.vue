<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useContentStore, usePartyStore, useUIStore, useSkillMasterStore } from '@/stores'
import BurstHighlight from '@/components/timeline/BurstHighlight.vue'
import TimelineHeader from '@/components/timeline/TimelineHeader.vue'
import MemberArea from '@/components/timeline/MemberArea.vue'
import DragTimeIndicator from '@/components/ui/DragTimeIndicator.vue'
import PhaseDividers from '@/components/timeline/PhaseDividers.vue'
import SkillDragLines from '@/components/ui/SkillDragLines.vue'
import { MAX_LANES } from '@/composables/useSkillLane'

const contentStore = useContentStore()
const partyStore = usePartyStore()
const uiStore = useUIStore()
const skillMasterStore = useSkillMasterStore()

const timelineRef = ref<HTMLElement | null>(null)
const headerScrollRef = ref<HTMLElement | null>(null)
const memberAreaComponentRef = ref<any>(null)

// メンバー編集用
const editingMemberId = ref<string | null>(null)

// スクロール同期フラグ（無限ループ防止）
let isSyncingScroll = false

// 行頭スクロールとメンバーエリアスクロールを同期
function syncScroll(source: 'header' | 'member') {
  if (isSyncingScroll) return
  isSyncingScroll = true

  const memberAreaScrollContainer = memberAreaComponentRef.value?.scrollContainerRef

  if (source === 'header' && headerScrollRef.value && memberAreaScrollContainer) {
    memberAreaScrollContainer.scrollTop = headerScrollRef.value.scrollTop
  } else if (source === 'member' && headerScrollRef.value && memberAreaScrollContainer) {
    headerScrollRef.value.scrollTop = memberAreaScrollContainer.scrollTop
  }

  // 次のフレームでフラグをリセット
  requestAnimationFrame(() => {
    isSyncingScroll = false
  })
}

// ジョブ選択ドロップダウンを表示
function startEditingJob(memberId: string) {
  editingMemberId.value = memberId
}

// ジョブを更新（ジョブ固有スキルをリセット、ロール共通スキルは残す）
function updateMemberJob(memberId: string, jobName: string) {
  const job = skillMasterStore.getJob(jobName)
  if (job) {
    // ロール共通スキルと薬のIDリストを取得
    const roleSkillIds = [
      ...skillMasterStore.getSkillsByRole(job.role).map(s => s.id),
      ...skillMasterStore.commonSkills.map(s => s.id)
    ]
    partyStore.changeMemberJob(memberId, jobName, job.role, roleSkillIds)
  }
  editingMemberId.value = null
}

// セレクト変更ハンドラ
function handleJobChange(memberId: string, event: Event) {
  const target = event.target as HTMLSelectElement
  updateMemberJob(memberId, target.value)
}

// ロールに基づくジョブ一覧
function getJobsForRole(role: 'Tank' | 'Healer' | 'DPS') {
  return skillMasterStore.getJobsByRole(role)
}

// タイムラインの幅（ピクセル）
const timelineWidth = computed(() => {
  const duration = contentStore.currentContent?.duration ?? 600
  return uiStore.timeToPixel(duration)
})

// 行頭の幅
const headerWidth = 150

// ホイールイベント
function handleWheel(e: WheelEvent) {
  if (e.shiftKey) {
    // ズーム
    e.preventDefault()
    if (e.deltaY < 0) {
      uiStore.zoomIn()
    } else {
      uiStore.zoomOut()
    }
  } else {
    // 横スクロール
    if (timelineRef.value) {
      timelineRef.value.scrollLeft += e.deltaY
    }
  }
}

// クリックで選択解除
function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target === timelineRef.value || target.classList.contains('timeline-bg')) {
    uiStore.clearSelection()
  }
}

onMounted(() => {
  timelineRef.value?.addEventListener('wheel', handleWheel, { passive: false })
})

onUnmounted(() => {
  timelineRef.value?.removeEventListener('wheel', handleWheel)
})
</script>

<template>
  <div class="h-full flex">
    <!-- 行頭（固定列） -->
    <div
      class="flex-shrink-0 bg-gray-800 border-r border-gray-700 sticky left-0 z-10"
      :style="{ width: `${headerWidth}px` }"
    >
      <!-- フェーズ/時間/ギミック行の行頭 -->
      <div class="h-8 border-b border-gray-700 flex items-center px-2 text-xs text-gray-400">
        フェーズ
      </div>
      <div class="h-6 border-b border-gray-700 flex items-center px-2 text-xs text-gray-400">
        時間
      </div>
      <div class="h-8 border-b border-gray-700 flex items-center px-2 text-xs text-gray-400">
        ギミック
      </div>
      <div class="h-6 border-b border-gray-700 flex items-center px-2 text-xs text-gray-400">
        メモ
      </div>

      <!-- メンバー行の行頭（通常モード時のみ表示） -->
      <div
        v-if="uiStore.isNormalMode"
        ref="headerScrollRef"
        class="overflow-y-auto"
        style="max-height: calc(100% - 88px)"
        @scroll="syncScroll('header')"
      >
        <!-- 軽減効果集計行の行頭 -->
        <div class="h-16 border-b border-gray-700 flex flex-col items-start justify-center px-2 bg-gray-800/50">
          <div class="text-xs font-semibold text-blue-400">物理軽減</div>
          <div class="text-xs font-semibold text-purple-400">魔法軽減</div>
        </div>

        <!-- 各メンバーのレーン行 -->
        <template v-for="member in partyStore.members">
          <!-- 折りたたみ時は1行のみ表示 -->
          <template v-if="member.collapsed">
            <div
              :key="`${member.id}-collapsed`"
              class="h-10 border-b border-gray-700 flex items-center px-2 gap-2"
            >
              <!-- 折りたたみボタン -->
              <button
                class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-200 flex-shrink-0"
                @click="partyStore.toggleMemberCollapsed(member.id)"
              >
                ▶
              </button>
              <span
                class="w-2 h-2 rounded-full flex-shrink-0"
                :class="{
                  'bg-blue-500': member.role === 'Tank',
                  'bg-green-500': member.role === 'Healer',
                  'bg-red-500': member.role === 'DPS'
                }"
              />
              <!-- ジョブ選択ドロップダウン -->
              <select
                :value="member.job"
                class="flex-1 bg-gray-700 border border-gray-600 rounded text-xs py-1 px-1 cursor-pointer hover:bg-gray-600 truncate"
                @change="handleJobChange(member.id, $event)"
              >
                <optgroup label="Tank">
                  <option v-for="job in getJobsForRole('Tank')" :key="job.id" :value="job.name">
                    {{ job.name }}
                  </option>
                </optgroup>
                <optgroup label="Healer">
                  <option v-for="job in getJobsForRole('Healer')" :key="job.id" :value="job.name">
                    {{ job.name }}
                  </option>
                </optgroup>
                <optgroup label="DPS">
                  <option v-for="job in getJobsForRole('DPS')" :key="job.id" :value="job.name">
                    {{ job.name }}
                  </option>
                </optgroup>
              </select>
            </div>
          </template>
          <!-- 展開時は4レーン表示 -->
          <template v-else>
            <div
              v-for="lane in MAX_LANES"
              :key="`${member.id}-${lane - 1}`"
              class="h-10 border-b border-gray-700 flex items-center px-2 gap-2"
            >
              <!-- 最初のレーンのみ折りたたみボタン、ロールインジケータ、ジョブ選択を表示 -->
              <template v-if="lane === 1">
                <!-- 折りたたみボタン -->
                <button
                  class="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-200 flex-shrink-0"
                  @click="partyStore.toggleMemberCollapsed(member.id)"
                >
                  ▼
                </button>
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="{
                    'bg-blue-500': member.role === 'Tank',
                    'bg-green-500': member.role === 'Healer',
                    'bg-red-500': member.role === 'DPS'
                  }"
                />
                <!-- ジョブ選択ドロップダウン -->
                <select
                  :value="member.job"
                  class="flex-1 bg-gray-700 border border-gray-600 rounded text-xs py-1 px-1 cursor-pointer hover:bg-gray-600 truncate"
                  @change="handleJobChange(member.id, $event)"
                >
                  <optgroup label="Tank">
                    <option v-for="job in getJobsForRole('Tank')" :key="job.id" :value="job.name">
                      {{ job.name }}
                    </option>
                  </optgroup>
                  <optgroup label="Healer">
                    <option v-for="job in getJobsForRole('Healer')" :key="job.id" :value="job.name">
                      {{ job.name }}
                    </option>
                  </optgroup>
                  <optgroup label="DPS">
                    <option v-for="job in getJobsForRole('DPS')" :key="job.id" :value="job.name">
                      {{ job.name }}
                    </option>
                  </optgroup>
                </select>
              </template>
              <!-- 2行目以降はレーン番号のみ表示 -->
              <template v-else>
                <span class="text-xs text-gray-500 ml-8">L{{ lane }}</span>
              </template>
            </div>
          </template>
        </template>
      </div>
    </div>

    <!-- タイムライン本体（横スクロール） -->
    <div
      ref="timelineRef"
      class="flex-1 overflow-x-auto overflow-y-hidden relative"
      @click="handleClick"
    >
      <!-- タイムライン背景 -->
      <div
        class="timeline-bg absolute inset-0"
        :style="{ width: `${timelineWidth}px` }"
      >
        <!-- バーストハイライト（最背面） -->
        <BurstHighlight />
        <!-- フェーズ区切り線 -->
        <PhaseDividers />
        <!-- スキルドラッグ中の垂直線 -->
        <SkillDragLines />
      </div>

      <!-- タイムラインコンテンツ -->
      <div
        class="relative"
        :style="{ width: `${timelineWidth}px`, minHeight: '100%' }"
      >
        <!-- ヘッダー部分（固定） -->
        <TimelineHeader />

        <!-- メンバーエリア -->
        <MemberArea ref="memberAreaComponentRef" @scroll="syncScroll('member')" @wheel="handleWheel" />
      </div>
    </div>

    <!-- ドラッグ中の時刻表示 -->
    <DragTimeIndicator />
  </div>
</template>
