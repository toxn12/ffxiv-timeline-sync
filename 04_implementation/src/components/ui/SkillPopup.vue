<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Role, Skill } from '@/types'
import { useSkillMasterStore } from '@/stores'

const props = defineProps<{
  job: string
  role: Role
  position: { x: number; y: number }
}>()

const emit = defineEmits<{
  select: [skillId: string]
  close: []
}>()

const skillMasterStore = useSkillMasterStore()
const popupRef = ref<HTMLElement | null>(null)

const skills = computed(() => skillMasterStore.getSkillsByJob(props.job))

const groupedSkills = computed(() => {
  const groups: { label: string; skills: Skill[] }[] = []

  // ジョブ固有スキル
  const jobSkills = skills.value.filter(s => s.job === props.job)
  if (jobSkills.length > 0) {
    groups.push({ label: 'ジョブスキル', skills: jobSkills })
  }

  // ロールスキル
  const roleSkills = skills.value.filter(s => s.role === props.role)
  if (roleSkills.length > 0) {
    groups.push({ label: 'ロールスキル', skills: roleSkills })
  }

  // 共通スキル
  const commonSkills = skills.value.filter(s => !s.job && !s.role)
  if (commonSkills.length > 0) {
    groups.push({ label: '共通', skills: commonSkills })
  }

  return groups
})

function handleClickOutside(e: MouseEvent) {
  if (popupRef.value && !popupRef.value.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div
    ref="popupRef"
    class="fixed bg-gray-800 border border-gray-600 rounded shadow-lg z-50 max-h-80 overflow-y-auto"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`
    }"
  >
    <div
      v-for="group in groupedSkills"
      :key="group.label"
      class="p-2"
    >
      <div class="text-xs text-gray-400 mb-1">{{ group.label }}</div>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="skill in group.skills"
          :key="skill.id"
          class="px-2 py-1 text-xs rounded hover:bg-gray-700"
          :class="{
            'bg-blue-600': skill.type === '軽減',
            'bg-green-600': skill.type === 'バフ',
            'bg-purple-600': skill.type === 'バリア',
            'bg-orange-600': skill.type === '薬'
          }"
          @click="emit('select', skill.id)"
        >
          {{ skill.name }}
        </button>
      </div>
    </div>

    <div v-if="groupedSkills.length === 0" class="p-4 text-sm text-gray-400">
      スキルがありません
    </div>
  </div>
</template>
