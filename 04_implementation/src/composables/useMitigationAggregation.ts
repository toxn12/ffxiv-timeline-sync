/**
 * パーティスキルの軽減効果集計
 */
import { computed } from 'vue'
import { usePartyStore, useContentStore, useSkillMasterStore } from '@/stores'

export interface MitigationData {
  time: number
  physicalMitigation: number
  magicalMitigation: number
  isInvincible: boolean  // 無敵スキルがアクティブかどうか
}

export function useMitigationAggregation() {
  const partyStore = usePartyStore()
  const contentStore = useContentStore()
  const skillMasterStore = useSkillMasterStore()

  /**
   * タイムライン全体の軽減効果を集計
   */
  const mitigationData = computed((): MitigationData[] => {
    const duration = contentStore.currentContent?.duration ?? 600
    const members = partyStore.members
    const result: MitigationData[] = []

    // 1秒ごとにデータポイントを作成
    for (let time = 0; time <= duration; time++) {
      // 同じスキルが複数メンバーで使われている場合は1つだけカウント
      // skillId -> { physical, magical, invincible } のマップを使用
      const activeSkills = new Map<string, { physical: number; magical: number; invincible: boolean }>()

      // 全メンバーのスキルを確認
      for (const member of members) {
        for (const placement of member.skillPlacements) {
          const skill = skillMasterStore.getSkillById(placement.skillId)
          if (!skill) continue

          // スキルの効果時間内かチェック
          const startTime = placement.time
          const endTime = placement.time + skill.duration

          if (time >= startTime && time < endTime) {
            // 軽減スキルのみ集計（バフ、バリアは除外）
            if (skill.type === '軽減') {
              // 同じスキルIDが既に登録されている場合はスキップ（重複カウントしない）
              if (!activeSkills.has(skill.id)) {
                activeSkills.set(skill.id, {
                  physical: skill.physicalMitigation ?? 0,
                  magical: skill.magicalMitigation ?? 0,
                  invincible: skill.invincible ?? false
                })
              }
            }
          }
        }
      }

      // アクティブなスキルの軽減率を合計
      let physicalMitigation = 0
      let magicalMitigation = 0
      let isInvincible = false

      for (const mitigation of activeSkills.values()) {
        // 無敵スキルがある場合は無敵扱い
        if (mitigation.invincible) {
          isInvincible = true
        }
        physicalMitigation += mitigation.physical
        magicalMitigation += mitigation.magical
      }

      // 無敵の場合は軽減率を100%に設定
      if (isInvincible) {
        physicalMitigation = 100
        magicalMitigation = 100
      } else {
        // 上限は100%
        physicalMitigation = Math.min(physicalMitigation, 100)
        magicalMitigation = Math.min(magicalMitigation, 100)
      }

      result.push({
        time,
        physicalMitigation,
        magicalMitigation,
        isInvincible
      })
    }

    return result
  })

  /**
   * 最大軽減率を取得
   */
  const maxPhysicalMitigation = computed(() => {
    return Math.max(...mitigationData.value.map(d => d.physicalMitigation), 0)
  })

  const maxMagicalMitigation = computed(() => {
    return Math.max(...mitigationData.value.map(d => d.magicalMitigation), 0)
  })

  return {
    mitigationData,
    maxPhysicalMitigation,
    maxMagicalMitigation
  }
}
