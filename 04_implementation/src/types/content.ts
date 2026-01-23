/**
 * コンテンツ（ボスタイムライン）関連の型定義
 */

export interface Content {
  id: string
  raidName: string       // レイド名（例: "アルカディア・ヘビー級零式"）
  bossName: string       // ボス名（例: "1層"）
  duration: number       // タイムライン長（秒）
  targets: string[]      // ターゲット一覧（例: ["ボス", "雑魚A"]）
  phases: Phase[]
  gimmicks: Gimmick[]
  burstTimings: BurstTiming[]
  timelineMemos?: TimelineMemo[]  // タイムライン上のメモ
}

export interface Phase {
  id: string
  name: string           // フェーズ名
  startTime: number      // 開始時刻（秒）
  endTime: number        // 終了時刻（秒）
  color: string          // 表示色
}

export interface Gimmick {
  id: string
  name: string           // ギミック名
  time: number           // 発動時刻（秒）
  castDuration: number   // 詠唱時間（秒）
  phaseId: string        // 所属フェーズID
  memo?: string          // メモ（任意）
}

export interface BurstTiming {
  id: string
  name?: string          // 名前（任意）
  startTime: number      // 開始時刻（秒）
  endTime: number        // 終了時刻（秒）
}

export interface TimelineMemo {
  id: string
  time: number           // 表示時刻（秒）
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
