/**
 * スキルマスターデータストア（読み取り専用）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Skill, Job, SkillMaster } from '@/types'
import { useUIStore } from './uiStore'

export const useSkillMasterStore = defineStore('skillMaster', () => {
  // State
  const jobs = ref<Job[]>([])
  const roleSkills = ref<{
    Tank: Skill[]
    Healer: Skill[]
    DPS: Skill[]
  }>({
    Tank: [],
    Healer: [],
    DPS: []
  })
  const commonSkills = ref<Skill[]>([])

  // Getters
  const allSkills = computed(() => {
    const jobSkills = jobs.value.flatMap(j => j.skills)
    const allRoleSkills = [
      ...roleSkills.value.Tank,
      ...roleSkills.value.Healer,
      ...roleSkills.value.DPS
    ]
    return [...jobSkills, ...allRoleSkills, ...commonSkills.value]
  })

  // Actions

  // スキルマスターを読み込み
  async function loadSkillMaster(): Promise<void> {
    const uiStore = useUIStore()
    try {
      uiStore.updateLoadingProgress(0, 'スキルマスターを読み込み中...')
      const res = await fetch('/data/skills/jobs.json')
      const data: SkillMaster = await res.json()
      jobs.value = data.jobs
      roleSkills.value = data.roleSkills
      commonSkills.value = data.commonSkills
    } catch (e) {
      console.error('Failed to load skill master', e)
    }
  }

  // ジョブでスキルを取得
  function getSkillsByJob(jobName: string): Skill[] {
    const job = jobs.value.find(j => j.name === jobName)
    if (!job) return []

    const jobSkills = job.skills
    const roleSkillList = roleSkills.value[job.role] ?? []
    return [...jobSkills, ...roleSkillList, ...commonSkills.value]
  }

  // ロールでスキルを取得
  function getSkillsByRole(role: 'Tank' | 'Healer' | 'DPS'): Skill[] {
    return [...(roleSkills.value[role] ?? []), ...commonSkills.value]
  }

  // IDでスキルを取得
  function getSkillById(id: string): Skill | undefined {
    return allSkills.value.find(s => s.id === id)
  }

  // ジョブ一覧を取得
  function getJobsByRole(role: 'Tank' | 'Healer' | 'DPS'): Job[] {
    return jobs.value.filter(j => j.role === role)
  }

  // ジョブを取得
  function getJob(jobName: string): Job | undefined {
    return jobs.value.find(j => j.name === jobName)
  }

  return {
    // State
    jobs,
    roleSkills,
    commonSkills,
    // Getters
    allSkills,
    // Actions
    loadSkillMaster,
    getSkillsByJob,
    getSkillsByRole,
    getSkillById,
    getJobsByRole,
    getJob
  }
})
