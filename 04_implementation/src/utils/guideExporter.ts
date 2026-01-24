/**
 * 攻略ガイドのMarkdownエクスポート機能
 */

import type { Content } from '@/types'
import { formatTime, formatTimeDetailed } from './timeFormat'
import {
  categoryLabels,
  severityLabels,
  mitigationLabels,
  damageTypeLabels
} from './gimmickStyles'

/**
 * タイムライン攻略ガイドをMarkdown形式で生成
 */
export function generateGuideMarkdown(content: Content): string {
  let md = `# ${content.raidName} - ${content.bossName}\n\n`
  md += `**タイムライン長**: ${formatTimeDetailed(content.duration)}\n\n`
  md += `---\n\n`

  // フェーズごとに整理
  for (const phase of content.phases) {
    md += `## ${phase.name}\n\n`
    md += `**時間**: ${formatTime(phase.startTime)} - ${formatTime(phase.endTime)}\n\n`

    const phaseGimmicks = content.gimmicks.filter(g => g.phaseId === phase.id)

    if (phaseGimmicks.length === 0) {
      md += `_ギミックなし_\n\n`
      continue
    }

    // ギミックごとに詳細を出力
    for (const gimmick of phaseGimmicks) {
      md += `### ${formatTime(gimmick.time)} - ${gimmick.name}\n\n`

      // メタデータがある場合はテーブル形式で表示
      if (gimmick.category || gimmick.severity || gimmick.mitigation || gimmick.targets) {
        md += `| 項目 | 内容 |\n`
        md += `|------|------|\n`

        if (gimmick.category) {
          md += `| カテゴリ | ${categoryLabels[gimmick.category]} |\n`
        }
        if (gimmick.damageType) {
          md += `| ダメージ | ${damageTypeLabels[gimmick.damageType]} |\n`
        }
        if (gimmick.severity) {
          md += `| 危険度 | ${severityLabels[gimmick.severity]} |\n`
        }
        if (gimmick.mitigation) {
          md += `| 軽減 | ${mitigationLabels[gimmick.mitigation]} |\n`
        }
        if (gimmick.targets && gimmick.targets.length > 0) {
          md += `| ターゲット | ${gimmick.targets.join(', ')} |\n`
        }

        md += `\n`
      }

      // 説明
      if (gimmick.description) {
        md += `${gimmick.description}\n\n`
      }

      // ギミック要素
      if (gimmick.mechanics && gimmick.mechanics.length > 0) {
        md += `**ギミック要素**: ${gimmick.mechanics.map(m => `\`${m}\``).join(', ')}\n\n`
      }

      // メモ
      if (gimmick.memo) {
        md += `> 💡 **メモ**: ${gimmick.memo}\n\n`
      }

      md += `---\n\n`
    }
  }

  // バーストタイミング
  if (content.burstTimings && content.burstTimings.length > 0) {
    md += `## バーストタイミング\n\n`
    for (const burst of content.burstTimings) {
      const burstName = burst.name || 'バースト'
      md += `- **${formatTime(burst.startTime)}** - ${burstName}\n`
    }
    md += `\n`
  }

  // フッター
  md += `\n---\n\n`
  md += `_このガイドは FF14 Timeline Sync で自動生成されました。_\n`

  return md
}

/**
 * Markdownファイルとしてダウンロード
 */
export function downloadGuideMarkdown(content: Content): void {
  const markdown = generateGuideMarkdown(content)
  const blob = new Blob([markdown], { type: 'text/markdown; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${content.bossName}_攻略ガイド.md`
  a.click()
  URL.revokeObjectURL(url)
}
