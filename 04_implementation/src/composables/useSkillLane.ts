/**
 * スキル配置レーンの自動選択ロジック
 */
import type { SkillPlacement } from '@/types'
import type { Skill } from '@/types/skill'

export const MAX_LANES = 4 // 最大レーン数

/**
 * スキルの全占有時間を計算（キャスト + 効果 + リキャスト）
 */
function getSkillOccupyTime(skill: Skill, startTime: number): { start: number; end: number } {
  const castTime = skill.castTime ?? 0
  const recastTime = skill.recast

  return {
    start: startTime,
    end: startTime + recastTime
  }
}

/**
 * 2つの時間範囲が重複しているかチェック
 */
function isOverlapping(
  range1: { start: number; end: number },
  range2: { start: number; end: number }
): boolean {
  return range1.start < range2.end && range1.end > range2.start
}

/**
 * 指定されたレーンで時間が重複するスキルがあるかチェック
 */
export function isLaneAvailable(
  lane: number,
  placements: SkillPlacement[],
  newSkill: Skill,
  newTime: number,
  excludePlacementId?: string,
  getSkillById?: (id: string) => Skill | undefined
): boolean {
  const newRange = getSkillOccupyTime(newSkill, newTime)

  for (const placement of placements) {
    // 除外対象のスキル（編集時の自分自身など）はスキップ
    if (placement.id === excludePlacementId) continue

    // 同じレーンかチェック
    const placementLane = placement.lane ?? 0
    if (placementLane !== lane) continue

    // 配置済みスキルの時間範囲を計算
    if (!getSkillById) continue
    const placementSkill = getSkillById(placement.skillId)
    if (!placementSkill) continue

    const placementRange = getSkillOccupyTime(placementSkill, placement.time)

    // 重複チェック
    if (isOverlapping(newRange, placementRange)) {
      return false
    }
  }

  return true
}

/**
 * 利用可能な最初のレーン番号を取得
 */
export function findAvailableLane(
  placements: SkillPlacement[],
  newSkill: Skill,
  newTime: number,
  excludePlacementId?: string,
  getSkillById?: (id: string) => Skill | undefined
): number {
  // レーン0から順に空いているレーンを探す
  for (let lane = 0; lane < MAX_LANES; lane++) {
    if (isLaneAvailable(lane, placements, newSkill, newTime, excludePlacementId, getSkillById)) {
      return lane
    }
  }

  // すべて埋まっている場合はレーン0（重複を許容）
  return 0
}
