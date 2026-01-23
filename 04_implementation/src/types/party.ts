/**
 * パーティ関連の型定義
 */

export type Role = 'Tank' | 'Healer' | 'DPS'

export interface Party {
  id: string
  name: string                // パーティ名（例: "固定パーティA"）
  contentId: string           // 対象コンテンツID
  members: Member[]           // メンバー一覧（1〜8人）
  createdAt: string           // 作成日時
  updatedAt: string           // 更新日時
}

export interface Member {
  id: string
  order: number               // 表示順
  playerName?: string         // プレイヤー名（任意）
  role: Role
  job: string                 // ジョブ名（例: "ナイト"）
  skillPlacements: SkillPlacement[]
  collapsed?: boolean         // スキル行を折りたたむかどうか（デフォルトfalse）
}

export interface SkillPlacement {
  id: string
  skillId: string             // スキルマスターのID
  time: number                // 発動時刻（秒）
  lane?: number               // 配置レーン（0〜3、デフォルト0）
  target?: string             // ターゲット（任意）
  memo?: string               // メモ（任意）
}

// パーティ一覧（セレクタ用）
export interface PartyInfo {
  id: string
  name: string
  contentId: string
}
