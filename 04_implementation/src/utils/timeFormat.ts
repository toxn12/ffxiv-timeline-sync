/**
 * 時間フォーマットユーティリティ
 */

/**
 * 秒を MM:SS 形式にフォーマット
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * MM:SS 形式を秒に変換
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0
    const secs = parseInt(parts[1], 10) || 0
    return mins * 60 + secs
  }
  return parseInt(timeStr, 10) || 0
}

/**
 * 秒を詳細フォーマット（M分S秒）
 */
export function formatTimeDetailed(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins > 0) {
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分`
  }
  return `${secs}秒`
}
