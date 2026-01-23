/**
 * パーティメンバー間でのスキル干渉検知
 * 同じスキルが複数のメンバーで同時に使われている場合に検知する
 */
import { computed } from 'vue'
import { usePartyStore, useSkillMasterStore } from '@/stores'

export interface SkillInterference {
  placementId: string
  hasInterference: boolean
  interferingMembers: string[] // 干渉しているメンバーの名前
}

export function useSkillInterference() {
  const partyStore = usePartyStore()
  const skillMasterStore = useSkillMasterStore()

  /**
   * 全スキルの干渉情報を計算
   */
  const skillInterferences = computed((): Map<string, SkillInterference> => {
    const result = new Map<string, SkillInterference>()
    const members = partyStore.members

    // 各メンバーのスキルをチェック
    for (const member of members) {
      for (const placement of member.skillPlacements) {
        const skill = skillMasterStore.getSkillById(placement.skillId)
        if (!skill) continue

        // ロールスキルのみチェック対象
        if (!skill.role) continue

        const startTime = placement.time
        const endTime = placement.time + skill.duration
        const interferingMembers: string[] = []

        // 他のメンバーの同じスキルとの干渉をチェック
        for (const otherMember of members) {
          if (otherMember.id === member.id) continue

          for (const otherPlacement of otherMember.skillPlacements) {
            // 同じスキルIDかチェック
            if (otherPlacement.skillId !== placement.skillId) continue

            const otherSkill = skillMasterStore.getSkillById(otherPlacement.skillId)
            if (!otherSkill) continue

            const otherStartTime = otherPlacement.time
            const otherEndTime = otherPlacement.time + otherSkill.duration

            // 効果時間が重複しているかチェック
            const isOverlapping =
              (startTime < otherEndTime && endTime > otherStartTime)

            if (isOverlapping) {
              interferingMembers.push(otherMember.name)
            }
          }
        }

        result.set(placement.id, {
          placementId: placement.id,
          hasInterference: interferingMembers.length > 0,
          interferingMembers
        })
      }
    }

    return result
  })

  /**
   * 特定のスキル配置の干渉情報を取得
   */
  function getInterference(placementId: string): SkillInterference | undefined {
    return skillInterferences.value.get(placementId)
  }

  return {
    skillInterferences,
    getInterference
  }
}
