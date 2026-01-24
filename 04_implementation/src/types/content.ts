/**
 * コンテンツ（ボスタイムライン）関連の型定義
 */

export interface Content {
  id: string
  raidName: string       // レイド名（例: "アルカディア・ヘビー級零式"）
  bossName: string       // ボス名（例: "1層"）
  duration: number       // タイムライン長（ミリ秒）
  targets: string[]      // ターゲット一覧（例: ["ボス", "雑魚A"]）
  phases: Phase[]
  gimmicks: Gimmick[]
  burstTimings: BurstTiming[]
  timelineMemos?: TimelineMemo[]  // タイムライン上のメモ
}

export interface Phase {
  id: string
  name: string           // フェーズ名
  startTime: number      // 開始時刻（ミリ秒）
  endTime: number        // 終了時刻（ミリ秒）
  color: string          // 表示色
}

export interface Gimmick {
  id: string
  name: string           // ギミック名
  time: number           // 発動時刻（ミリ秒）
  castDuration: number   // 詠唱時間（ミリ秒）
  phaseId: string        // 所属フェーズID
  memo?: string          // メモ（任意）

  // 拡張フィールド（すべてオプショナル - 後方互換性のため）
  category?: GimmickCategory        // ギミックの種類
  damageType?: DamageType           // ダメージタイプ
  severity?: Severity               // 危険度
  mitigation?: MitigationLevel      // 軽減推奨度
  targets?: TargetType[]            // ターゲット（複数可）
  description?: string              // 対処法・説明
  mechanics?: string[]              // ギミック要素（例: ["散開", "頭割り"]）
}

// ギミックカテゴリ
export type GimmickCategory =
  | 'raidwide'      // 全体攻撃
  | 'tankbuster'    // タンクバスター
  | 'stack'         // 頭割り
  | 'spread'        // 散開
  | 'tower'         // 塔踏み
  | 'proximity'     // 距離減衰
  | 'mechanic'      // 複合ギミック
  | 'transition'    // フェーズ移行
  | 'enrage'        // 時間切れ
  | 'other'         // その他

// ダメージタイプ
export type DamageType =
  | 'physical'      // 物理ダメージ
  | 'magical'       // 魔法ダメージ
  | 'none'          // ダメージなし
  | 'mixed'         // 混合

// 危険度
export type Severity =
  | 'low'           // 低（通常の攻撃）
  | 'medium'        // 中（要注意）
  | 'high'          // 高（危険）
  | 'fatal'         // 即死級

// 軽減推奨度
export type MitigationLevel =
  | 'none'          // 不要
  | 'optional'      // 任意
  | 'recommended'   // 推奨
  | 'required'      // 必須
  | 'invuln'        // 無敵推奨

// ターゲットタイプ
export type TargetType =
  | 'all'           // 全員
  | 'tanks'         // タンク
  | 'healers'       // ヒーラー
  | 'dps'           // DPS
  | 'mt'            // メインタンク
  | 'st'            // サブタンク
  | 'random'        // ランダム

export interface BurstTiming {
  id: string
  name?: string          // 名前（任意）
  startTime: number      // 開始時刻（ミリ秒）
  endTime: number        // 終了時刻（ミリ秒）
}

export interface TimelineMemo {
  id: string
  time: number           // 表示時刻（ミリ秒）
  text: string           // メモ内容
}

// レイド情報（カスケードメニュー用）
export interface RaidInfo {
  name: string
  bosses: BossInfo[]
}

export interface BossInfo {
  name: string
  file: string
}

// コンテンツ一覧のJSON構造
export interface ContentIndex {
  raids: RaidInfo[]
}
