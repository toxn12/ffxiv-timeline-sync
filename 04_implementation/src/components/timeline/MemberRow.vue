<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Member } from '@/types'
import { usePartyStore, useSkillMasterStore, useUIStore } from '@/stores'
import SkillBar from '@/components/timeline-items/SkillBar.vue'
import SkillPopup from '@/components/ui/SkillPopup.vue'
import { MAX_LANES } from '@/composables/useSkillLane'

const props = defineProps<{
  member: Member
}>()

const partyStore = usePartyStore()
const skillMasterStore = useSkillMasterStore()
const uiStore = useUIStore()

const showSkillPopup = ref(false)
const popupPosition = ref({ x: 0, y: 0 })
const clickedTime = ref(0)
const clickedLane = ref(0)

// レーン数（1〜4）
const lanes = Array.from({ length: MAX_LANES }, (_, i) => i)

// このメンバーのスキル配置
const skills = computed(() => props.member.skillPlacements)

// ロールカラー
const roleColor = computed(() => {
  switch (props.member.role) {
    case 'Tank': return 'border-blue-500'
    case 'Healer': return 'border-green-500'
    case 'DPS': return 'border-red-500'
    default: return 'border-gray-500'
  }
})

function handleRowClick(e: MouseEvent, lane: number) {
  // 折りたたみ時はスキル追加を無効化
  if (props.member.collapsed) return

  if (uiStore.isNormalMode) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    popupPosition.value = {
      x: e.clientX,
      y: rect.bottom
    }
    clickedTime.value = uiStore.pixelToTime(e.clientX - rect.left)
    clickedLane.value = lane
    showSkillPopup.value = true
  }
}

function handleSkillSelect(skillId: string) {
  partyStore.addSkill(props.member.id, {
    skillId,
    time: clickedTime.value,
    lane: clickedLane.value
  })
  showSkillPopup.value = false
}
</script>

<template>
  <div>
    <!-- 折りたたみ時：全スキルを1行に重ねて表示 -->
    <template v-if="member.collapsed">
      <div
        class="h-10 relative border-b border-gray-700"
        :class="`border-l-2 ${roleColor}`"
      >
        <!-- 全レーンのスキルを重ねて表示（z-indexで重ね合わせ） -->
        <SkillBar
          v-for="(skill, index) in skills"
          :key="skill.id"
          :placement="skill"
          :member-id="member.id"
          :collapsed="true"
          :style="{ zIndex: skills.length - index }"
        />
      </div>
    </template>

    <!-- 展開時：各レーンを行として表示 -->
    <template v-else>
      <div
        v-for="lane in lanes"
        :key="lane"
        class="h-10 relative border-b border-gray-700"
        :class="[lane === 0 ? `border-l-2 ${roleColor}` : 'border-l border-gray-700', uiStore.isNormalMode ? 'cursor-pointer hover:bg-gray-800/50' : '']"
        @click="handleRowClick($event, lane)"
      >
        <!-- このレーンのスキルバーのみ表示 -->
        <SkillBar
          v-for="skill in skills.filter(s => (s.lane ?? 0) === lane)"
          :key="skill.id"
          :placement="skill"
          :member-id="member.id"
        />
      </div>
    </template>

    <!-- スキル選択ポップアップ -->
    <SkillPopup
      v-if="showSkillPopup"
      :job="member.job"
      :role="member.role"
      :position="popupPosition"
      @select="handleSkillSelect"
      @close="showSkillPopup = false"
    />
  </div>
</template>
