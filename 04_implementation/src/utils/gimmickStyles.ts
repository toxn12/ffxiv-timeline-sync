/**
 * ギミックのスタイリングに関するユーティリティ関数と定数
 */

import type { Gimmick, GimmickCategory, Severity, MitigationLevel, DamageType } from '@/types'

// 危険度別の色分け（Tailwind CSS クラス）
export const severityColors: Record<Severity, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  fatal: 'bg-red-600'
}

// カテゴリ別の色分け（Severityがない場合の代替）
export const categoryColors: Record<GimmickCategory, string> = {
  raidwide: 'bg-purple-500',
  tankbuster: 'bg-blue-600',
  stack: 'bg-green-500',
  spread: 'bg-yellow-500',
  tower: 'bg-cyan-500',
  proximity: 'bg-pink-500',
  mechanic: 'bg-gray-500',
  transition: 'bg-indigo-500',
  enrage: 'bg-red-700',
  other: 'bg-gray-600'
}

// カテゴリ別のアイコン（絵文字）
export const categoryIcons: Record<GimmickCategory, string> = {
  raidwide: '🌊',
  tankbuster: '🛡️',
  stack: '🤝',
  spread: '💨',
  tower: '🗼',
  proximity: '📍',
  mechanic: '⚙️',
  transition: '🔄',
  enrage: '💀',
  other: '❓'
}

// カテゴリの日本語ラベル
export const categoryLabels: Record<GimmickCategory, string> = {
  raidwide: '全体攻撃',
  tankbuster: 'タンクバスター',
  stack: '頭割り',
  spread: '散開',
  tower: '塔踏み',
  proximity: '距離減衰',
  mechanic: '複合ギミック',
  transition: 'フェーズ移行',
  enrage: '時間切れ',
  other: 'その他'
}

// 危険度の日本語ラベル
export const severityLabels: Record<Severity, string> = {
  low: '低',
  medium: '中',
  high: '高',
  fatal: '即死級'
}

// 軽減推奨度の日本語ラベル
export const mitigationLabels: Record<MitigationLevel, string> = {
  none: '不要',
  optional: '任意',
  recommended: '推奨',
  required: '必須',
  invuln: '無敵推奨'
}

// ダメージタイプの日本語ラベル
export const damageTypeLabels: Record<DamageType, string> = {
  physical: '物理',
  magical: '魔法',
  none: 'なし',
  mixed: '混合'
}

// ロールの日本語ラベル
export const roleLabels = {
  all: '全て表示',
  tanks: 'タンク向け',
  healers: 'ヒーラー向け',
  dps: 'DPS向け'
}

/**
 * ギミックの色クラスを取得（Severity優先、なければデフォルト）
 */
export function getGimmickColorClass(gimmick: Gimmick): string {
  // Severity優先
  if (gimmick.severity) {
    return severityColors[gimmick.severity]
  }

  // Severityがない場合はCategory
  if (gimmick.category) {
    return categoryColors[gimmick.category] || 'bg-purple-600'
  }

  // デフォルト（後方互換性）
  return 'bg-purple-600'
}

/**
 * カテゴリのアイコンを取得
 */
export function getCategoryIcon(category?: GimmickCategory): string {
  if (!category) return ''
  return categoryIcons[category] || ''
}

/**
 * 軽減推奨度をレベル数値に変換（盾アイコンの個数用）
 */
export function getMitigationLevel(mitigation?: MitigationLevel): number {
  if (!mitigation) return 0

  const levels: Record<MitigationLevel, number> = {
    none: 0,
    optional: 1,
    recommended: 2,
    required: 3,
    invuln: 4
  }

  return levels[mitigation] || 0
}
