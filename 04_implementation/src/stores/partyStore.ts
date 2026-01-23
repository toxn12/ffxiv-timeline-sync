/**
 * パーティ構成管理ストア
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Party, Member, SkillPlacement, PartyInfo } from '@/types'
import { useHistoryStore } from './historyStore'
import { useSkillMasterStore } from './skillMasterStore'
import { generateId } from '@/utils/idGenerator'
import { findAvailableLane } from '@/composables/useSkillLane'

const STORAGE_KEY = 'ffxiv-timeline-parties'

export const usePartyStore = defineStore('party', () => {
  // State
  const parties = ref<Party[]>([])
  const currentPartyId = ref<string | null>(null)

  // Getters
  const currentParty = computed(() =>
    parties.value.find(p => p.id === currentPartyId.value) ?? null
  )

  const members = computed(() => currentParty.value?.members ?? [])

  const partyList = computed((): PartyInfo[] =>
    parties.value.map(p => ({
      id: p.id,
      name: p.name,
      contentId: p.contentId
    }))
  )

  // Actions

  // ローカルストレージから読み込み
  function loadParties(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        parties.value = JSON.parse(data)
      }
    } catch (e) {
      console.error('Failed to load parties from localStorage', e)
    }
  }

  // パーティを選択
  function selectParty(id: string): void {
    currentPartyId.value = id
  }

  // 新規パーティ作成
  function createParty(data: Partial<Party>): Party {
    const now = new Date().toISOString()
    const newParty: Party = {
      id: generateId(),
      name: data.name ?? '新規パーティ',
      contentId: data.contentId ?? '',
      members: data.members ?? createDefaultMembers(),
      createdAt: now,
      updatedAt: now
    }
    parties.value.push(newParty)
    currentPartyId.value = newParty.id
    saveToStorage()
    return newParty
  }

  // パーティ更新
  function updateParty(data: Partial<Party>): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    Object.assign(currentParty.value, data, {
      updatedAt: new Date().toISOString()
    })
    saveToStorage()
  }

  // パーティ削除
  function deleteParty(partyId: string): void {
    const index = parties.value.findIndex(p => p.id === partyId)
    if (index !== -1) {
      parties.value.splice(index, 1)
      if (currentPartyId.value === partyId) {
        currentPartyId.value = parties.value[0]?.id ?? null
      }
      saveToStorage()
    }
  }

  // ローカルストレージに保存
  function saveParty(): void {
    saveToStorage()
  }

  // JSONダウンロード
  function exportParty(): void {
    if (!currentParty.value) return
    const dataStr = JSON.stringify(currentParty.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentParty.value.name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // JSONインポート
  function importParty(json: string): void {
    try {
      const data = JSON.parse(json) as Party
      // IDを新規生成して重複を防ぐ
      data.id = generateId()
      data.createdAt = new Date().toISOString()
      data.updatedAt = new Date().toISOString()
      parties.value.push(data)
      currentPartyId.value = data.id
      saveToStorage()
    } catch (e) {
      throw new Error('JSONの形式が不正です')
    }
  }

  // メンバー更新
  function updateMember(data: Partial<Member> & { id: string }): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    const member = currentParty.value.members.find(m => m.id === data.id)
    if (member) {
      Object.assign(member, data)
      currentParty.value.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // ジョブ変更（ジョブ固有スキルをリセット、ロール共通スキルは残す）
  function changeMemberJob(
    memberId: string,
    newJob: string,
    newRole: 'Tank' | 'Healer' | 'DPS',
    roleSkillIds: string[]
  ): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    const member = currentParty.value.members.find(m => m.id === memberId)
    if (member) {
      const oldRole = member.role
      member.job = newJob
      member.role = newRole

      // ロールが変わった場合は全スキルをリセット
      // ロールが同じ場合はロール共通スキルのみ残す
      if (oldRole !== newRole) {
        member.skillPlacements = []
      } else {
        // ロール共通スキルと薬のみ残す
        member.skillPlacements = member.skillPlacements.filter(
          sp => roleSkillIds.includes(sp.skillId)
        )
      }

      currentParty.value.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // メンバー行の折りたたみ状態を切り替え
  function toggleMemberCollapsed(memberId: string): void {
    if (!currentParty.value) return
    const member = currentParty.value.members.find(m => m.id === memberId)
    if (member) {
      member.collapsed = !member.collapsed
      currentParty.value.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // メンバー並び替え
  function reorderMembers(memberIds: string[]): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    const newMembers = memberIds
      .map((id, index) => {
        const member = currentParty.value!.members.find(m => m.id === id)
        if (member) {
          return { ...member, order: index }
        }
        return null
      })
      .filter((m): m is Member => m !== null)

    currentParty.value.members = newMembers
    currentParty.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  // スキル追加
  function addSkill(memberId: string, skill: Partial<SkillPlacement>): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    const member = currentParty.value.members.find(m => m.id === memberId)
    if (member) {
      const skillMasterStore = useSkillMasterStore()
      const skillData = skillMasterStore.getSkillById(skill.skillId ?? '')

      // レーンを自動選択（laneが指定されていない場合）
      let lane = skill.lane ?? 0
      if (skill.lane === undefined && skillData) {
        lane = findAvailableLane(
          member.skillPlacements,
          skillData,
          skill.time ?? 0,
          undefined,
          skillMasterStore.getSkillById
        )
      }

      const newSkill: SkillPlacement = {
        id: generateId(),
        skillId: skill.skillId ?? '',
        time: skill.time ?? 0,
        lane,
        target: skill.target,
        memo: skill.memo
      }
      member.skillPlacements.push(newSkill)
      currentParty.value.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // スキル更新
  function updateSkill(data: Partial<SkillPlacement> & { id: string }): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    for (const member of currentParty.value.members) {
      const skill = member.skillPlacements.find(s => s.id === data.id)
      if (skill) {
        // 時間が変更された場合、レーンを自動再計算（laneが明示的に指定されていない場合）
        if (data.time !== undefined && data.lane === undefined) {
          const skillMasterStore = useSkillMasterStore()
          const skillData = skillMasterStore.getSkillById(skill.skillId)
          if (skillData) {
            data.lane = findAvailableLane(
              member.skillPlacements,
              skillData,
              data.time,
              data.id,
              skillMasterStore.getSkillById
            )
          }
        }

        Object.assign(skill, data)
        currentParty.value.updatedAt = new Date().toISOString()
        saveToStorage()
        return
      }
    }
  }

  // スキル削除
  function deleteSkill(skillId: string): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    for (const member of currentParty.value.members) {
      const index = member.skillPlacements.findIndex(s => s.id === skillId)
      if (index !== -1) {
        member.skillPlacements.splice(index, 1)
        currentParty.value.updatedAt = new Date().toISOString()
        saveToStorage()
        return
      }
    }
  }

  // スキル移動
  function moveSkill(skillId: string, newTime: number): void {
    if (!currentParty.value) return
    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    for (const member of currentParty.value.members) {
      const skill = member.skillPlacements.find(s => s.id === skillId)
      if (skill) {
        skill.time = newTime
        currentParty.value.updatedAt = new Date().toISOString()
        saveToStorage()
        return
      }
    }
  }

  // メンバー追加
  function addMember(): void {
    if (!currentParty.value) return
    if (currentParty.value.members.length >= 8) return // 最大8人

    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    const newMember: Member = {
      id: generateId(),
      order: currentParty.value.members.length,
      role: 'DPS',
      job: '竜騎士',
      skillPlacements: []
    }

    currentParty.value.members.push(newMember)
    currentParty.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  // メンバー削除
  function removeMember(memberId: string): void {
    if (!currentParty.value) return
    if (currentParty.value.members.length <= 2) return // 最低2人

    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    const index = currentParty.value.members.findIndex(m => m.id === memberId)
    if (index !== -1) {
      currentParty.value.members.splice(index, 1)
      // orderを再割り当て
      currentParty.value.members.forEach((m, i) => {
        m.order = i
      })
      currentParty.value.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // パーティ人数を設定
  function setMemberCount(count: number): void {
    if (!currentParty.value) return
    if (count < 2 || count > 8) return

    const historyStore = useHistoryStore()
    historyStore.push('party', JSON.parse(JSON.stringify(currentParty.value)))

    const currentCount = currentParty.value.members.length

    if (count > currentCount) {
      // メンバーを追加
      const defaultJobs = [
        { role: 'Tank' as const, job: 'ナイト' },
        { role: 'Tank' as const, job: '戦士' },
        { role: 'Healer' as const, job: '白魔道士' },
        { role: 'Healer' as const, job: '学者' },
        { role: 'DPS' as const, job: '竜騎士' },
        { role: 'DPS' as const, job: '忍者' },
        { role: 'DPS' as const, job: '黒魔道士' },
        { role: 'DPS' as const, job: '吟遊詩人' }
      ]
      for (let i = currentCount; i < count; i++) {
        const jobInfo = defaultJobs[i % defaultJobs.length]
        const newMember: Member = {
          id: generateId(),
          order: i,
          role: jobInfo.role,
          job: jobInfo.job,
          skillPlacements: []
        }
        currentParty.value.members.push(newMember)
      }
    } else if (count < currentCount) {
      // メンバーを削除（末尾から）
      currentParty.value.members.splice(count)
    }

    currentParty.value.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  // 状態を復元（Undo/Redo用）
  function restoreState(state: Party): void {
    const index = parties.value.findIndex(p => p.id === state.id)
    if (index !== -1) {
      parties.value[index] = state
      saveToStorage()
    }
  }

  // ローカルストレージ保存（内部用）
  function saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parties.value))
    } catch (e) {
      console.error('Failed to save parties to localStorage', e)
    }
  }

  return {
    // State
    parties,
    currentPartyId,
    // Getters
    currentParty,
    members,
    partyList,
    // Actions
    loadParties,
    selectParty,
    createParty,
    updateParty,
    deleteParty,
    saveParty,
    exportParty,
    importParty,
    updateMember,
    changeMemberJob,
    toggleMemberCollapsed,
    reorderMembers,
    addSkill,
    updateSkill,
    deleteSkill,
    moveSkill,
    addMember,
    removeMember,
    setMemberCount,
    restoreState
  }
})

// デフォルトメンバー構成を作成
function createDefaultMembers(): Member[] {
  const defaultJobs = [
    { role: 'Tank' as const, job: 'ナイト' },
    { role: 'Tank' as const, job: '戦士' },
    { role: 'Healer' as const, job: '白魔道士' },
    { role: 'Healer' as const, job: '学者' },
    { role: 'DPS' as const, job: '竜騎士' },
    { role: 'DPS' as const, job: '忍者' },
    { role: 'DPS' as const, job: '黒魔道士' },
    { role: 'DPS' as const, job: '吟遊詩人' }
  ]

  return defaultJobs.map((job, index) => ({
    id: generateId(),
    order: index,
    role: job.role,
    job: job.job,
    skillPlacements: []
  }))
}
