/**
 * 時間フォーマットユーティリティ
 * 内部データはミリ秒単位、表示は秒単位（小数点1桁）
 */

/**
 * ミリ秒を MM:SS.s 形式にフォーマット
 * @param timeMs - ミリ秒
 * @returns MM:SS.s 形式の文字列（例: "1:23.4"）
 */
export function formatTime(timeMs: number): string {
  const totalSeconds = timeMs / 1000
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`
}

/**
 * MM:SS.s または MM:SS 形式をミリ秒に変換
 * @param timeStr - MM:SS.s 形式の文字列（例: "1:23.4" または "1:23"）
 * @returns ミリ秒
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0
    const secs = parseFloat(parts[1]) || 0
    return (mins * 60 + secs) * 1000
  }
  return parseFloat(timeStr) * 1000 || 0
}

/**
 * ミリ秒を詳細フォーマット（M分S.s秒）
 * @param timeMs - ミリ秒
 * @returns M分S.s秒 形式の文字列（例: "1分23.4秒"）
 */
export function formatTimeDetailed(timeMs: number): string {
  const totalSeconds = timeMs / 1000
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60

  if (mins > 0) {
    return secs > 0 ? `${mins}分${secs.toFixed(1)}秒` : `${mins}分`
  }
  return `${secs.toFixed(1)}秒`
}

/**
 * ミリ秒を秒表示（小数点1桁）
 * @param timeMs - ミリ秒
 * @returns 秒.s 形式の文字列（例: "23.4s"）
 */
export function formatSeconds(timeMs: number): string {
  return `${(timeMs / 1000).toFixed(1)}s`
}

/**
 * ミリ秒を秒表示（小数点3桁、デバッグ用）
 * @param timeMs - ミリ秒
 * @returns 秒.sss 形式の文字列（例: "23.456s"）
 */
export function formatSecondsPrecise(timeMs: number): string {
  return `${(timeMs / 1000).toFixed(3)}s`
}
