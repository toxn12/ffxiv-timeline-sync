/**
 * スキルマスター関連の型定義
 */

export type SkillType = '軽減' | 'バフ' | 'バリア' | '薬'

export interface Skill {
  id: string              // 例: "TANK_REPRISAL"
  name: string            // 例: "リプライザル"
  job: string | null      // ジョブ固有の場合（例: "ナイト"）
  role: string | null     // ロール共通の場合（例: "Tank"）
  castTime?: number       // キャストタイム秒（0または未定義の場合は即発動）
  recast: number          // リキャスト秒
  duration: number        // 効果時間秒
  type: SkillType
  icon?: string           // 将来用（パスまたはURL）
  // 効果情報
  physicalMitigation?: number  // 物理軽減率（%）
  magicalMitigation?: number   // 魔法軽減率（%）
  buffPower?: number           // バフ効果（%）（DPSアップなど）
  invincible?: boolean         // 無敵スキルかどうか（タンクの無敵受け用）
}

export interface Job {
  id: string
  name: string            // ジョブ名
  role: 'Tank' | 'Healer' | 'DPS'
  color: string           // 表示色
  skills: Skill[]         // ジョブ固有スキル
}

// スキルマスターのJSON構造
export interface SkillMaster {
  jobs: Job[]
  roleSkills: {
    Tank: Skill[]
    Healer: Skill[]
    DPS: Skill[]
  }
  commonSkills: Skill[]   // 薬など全ロール共通
}
