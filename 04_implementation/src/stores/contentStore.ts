/**
 * コンテンツ（ボスタイムライン）管理ストア
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Content, Phase, Gimmick, BurstTiming, RaidInfo, ContentIndex, TimelineMemo } from '@/types'
import { useHistoryStore } from './historyStore'
import { generateId } from '@/utils/idGenerator'

export const useContentStore = defineStore('content', () => {
  // State
  const contents = ref<Content[]>([])
  const currentContentId = ref<string | null>(null)
  const raidIndex = ref<RaidInfo[]>([])

  // Getters
  const currentContent = computed(() =>
    contents.value.find(c => c.id === currentContentId.value) ?? null
  )

  const phases = computed(() => currentContent.value?.phases ?? [])
  const gimmicks = computed(() => currentContent.value?.gimmicks ?? [])
  const burstTimings = computed(() => currentContent.value?.burstTimings ?? [])
  const timelineMemos = computed(() => currentContent.value?.timelineMemos ?? [])
  const raidList = computed(() => raidIndex.value)

  // Actions

  // コンテンツ一覧を読み込み
  async function loadContents(): Promise<void> {
    try {
      const indexRes = await fetch('/data/contents/index.json')
      const indexData: ContentIndex = await indexRes.json()
      raidIndex.value = indexData.raids

      // 各ボスのJSONを読み込み
      for (const raid of indexData.raids) {
        for (const boss of raid.bosses) {
          try {
            const res = await fetch(`/data/contents/${boss.file}`)
            const content: Content = await res.json()
            contents.value.push(content)
          } catch (e) {
            console.warn(`Failed to load content: ${boss.file}`, e)
          }
        }
      }
    } catch (e) {
      console.error('Failed to load content index', e)
    }
  }

  // コンテンツを選択
  function selectContent(id: string): void {
    currentContentId.value = id
  }

  // 新規コンテンツ作成
  function createContent(data: Partial<Content>): Content {
    const newContent: Content = {
      id: generateId(),
      raidName: data.raidName ?? '新規レイド',
      bossName: data.bossName ?? '新規ボス',
      duration: data.duration ?? 600000,  // 600秒 = 600000ms
      targets: data.targets ?? ['ボス'],
      phases: [{
        id: generateId(),
        name: 'フェーズ1',
        startTime: 0,
        endTime: data.duration ?? 600000,  // 600秒 = 600000ms
        color: '#60A5FA'
      }],
      gimmicks: [],
      burstTimings: []
    }
    contents.value.push(newContent)
    currentContentId.value = newContent.id
    return newContent
  }

  // コンテンツ更新
  function updateContent(data: Partial<Content>): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    Object.assign(currentContent.value, data)
  }

  // JSONとしてダウンロード
  function saveContent(): void {
    if (!currentContent.value) return
    const dataStr = JSON.stringify(currentContent.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentContent.value.bossName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // フェーズを分割
  function splitPhase(phaseId: string, time: number): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const phaseIndex = currentContent.value.phases.findIndex(p => p.id === phaseId)
    if (phaseIndex === -1) return

    const phase = currentContent.value.phases[phaseIndex]
    if (time <= phase.startTime || time >= phase.endTime) return

    // 元のフェーズを縮小
    const originalEndTime = phase.endTime
    phase.endTime = time

    // 新しいフェーズを作成
    const newPhase: Phase = {
      id: generateId(),
      name: `フェーズ${currentContent.value.phases.length + 1}`,
      startTime: time,
      endTime: originalEndTime,
      color: getNextPhaseColor(currentContent.value.phases.length)
    }

    currentContent.value.phases.splice(phaseIndex + 1, 0, newPhase)
  }

  // フェーズ更新
  function updatePhase(data: Partial<Phase> & { id: string }): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const phase = currentContent.value.phases.find(p => p.id === data.id)
    if (phase) {
      Object.assign(phase, data)
    }
  }

  // フェーズ削除
  function deletePhase(phaseId: string): void {
    if (!currentContent.value) return
    if (currentContent.value.phases.length <= 1) return // 最低1つは必要

    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const index = currentContent.value.phases.findIndex(p => p.id === phaseId)
    if (index === -1) return

    const deletedPhase = currentContent.value.phases[index]

    // 前のフェーズに統合
    if (index > 0) {
      currentContent.value.phases[index - 1].endTime = deletedPhase.endTime
    } else if (currentContent.value.phases.length > 1) {
      currentContent.value.phases[1].startTime = deletedPhase.startTime
    }

    currentContent.value.phases.splice(index, 1)
  }

  // フェーズ移動（後続連動）
  function movePhase(phaseId: string, newStartTime: number): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const index = currentContent.value.phases.findIndex(p => p.id === phaseId)
    if (index === -1 || index === 0) return // 最初のフェーズは移動不可

    const phase = currentContent.value.phases[index]
    const delta = newStartTime - phase.startTime

    // 前のフェーズの終了時刻を調整
    currentContent.value.phases[index - 1].endTime = newStartTime

    // 対象フェーズと後続フェーズをシフト
    for (let i = index; i < currentContent.value.phases.length; i++) {
      currentContent.value.phases[i].startTime += delta
      currentContent.value.phases[i].endTime += delta
    }
  }

  // フェーズ区切り位置のみ移動（前フェーズの終端と対象フェーズの開始位置のみ変更）
  function movePhaseDivider(phaseId: string, newTime: number): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const index = currentContent.value.phases.findIndex(p => p.id === phaseId)
    if (index <= 0) return // 最初のフェーズの開始位置は移動不可

    // 前のフェーズの終了時刻を変更
    currentContent.value.phases[index - 1].endTime = newTime
    // 対象フェーズの開始時刻を変更
    currentContent.value.phases[index].startTime = newTime
  }

  // ギミック追加
  function addGimmick(data: Partial<Gimmick>): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const time = data.time ?? 0
    const phase = currentContent.value.phases.find(
      p => p.startTime <= time && p.endTime > time
    )

    const newGimmick: Gimmick = {
      id: generateId(),
      name: data.name ?? '新規ギミック',
      time,
      castDuration: data.castDuration ?? 3000,  // 3秒 = 3000ms
      phaseId: phase?.id ?? currentContent.value.phases[0]?.id ?? ''
    }

    currentContent.value.gimmicks.push(newGimmick)
  }

  // ギミック更新
  function updateGimmick(data: Partial<Gimmick> & { id: string }): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const gimmick = currentContent.value.gimmicks.find(g => g.id === data.id)
    if (gimmick) {
      Object.assign(gimmick, data)
    }
  }

  // ギミック削除
  function deleteGimmick(gimmickId: string): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const index = currentContent.value.gimmicks.findIndex(g => g.id === gimmickId)
    if (index !== -1) {
      currentContent.value.gimmicks.splice(index, 1)
    }
  }

  // ギミック移動
  function moveGimmick(gimmickId: string, newTime: number): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const gimmick = currentContent.value.gimmicks.find(g => g.id === gimmickId)
    if (gimmick) {
      gimmick.time = newTime
      // フェーズ所属を更新
      const phase = currentContent.value.phases.find(
        p => p.startTime <= newTime && p.endTime > newTime
      )
      if (phase) {
        gimmick.phaseId = phase.id
      }
    }
  }

  // バースト追加
  function addBurst(data: Partial<BurstTiming>): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const newBurst: BurstTiming = {
      id: generateId(),
      name: data.name,
      startTime: data.startTime ?? 0,
      endTime: data.endTime ?? 15000  // 15秒 = 15000ms
    }

    currentContent.value.burstTimings.push(newBurst)
  }

  // バースト更新
  function updateBurst(data: Partial<BurstTiming> & { id: string }): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const burst = currentContent.value.burstTimings.find(b => b.id === data.id)
    if (burst) {
      Object.assign(burst, data)
    }
  }

  // バースト削除
  function deleteBurst(burstId: string): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const index = currentContent.value.burstTimings.findIndex(b => b.id === burstId)
    if (index !== -1) {
      currentContent.value.burstTimings.splice(index, 1)
    }
  }

  // バースト移動
  function moveBurst(burstId: string, newStartTime: number): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const burst = currentContent.value.burstTimings.find(b => b.id === burstId)
    if (burst) {
      const duration = burst.endTime - burst.startTime
      burst.startTime = newStartTime
      burst.endTime = newStartTime + duration
    }
  }

  // バーストリサイズ
  function resizeBurst(burstId: string, newStartTime: number, newEndTime: number): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const burst = currentContent.value.burstTimings.find(b => b.id === burstId)
    if (burst) {
      burst.startTime = newStartTime
      burst.endTime = newEndTime
    }
  }

  // タイムラインメモ追加
  function addTimelineMemo(data: Partial<TimelineMemo>): void {
    if (!currentContent.value) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    if (!currentContent.value.timelineMemos) {
      currentContent.value.timelineMemos = []
    }

    const newMemo: TimelineMemo = {
      id: generateId(),
      time: data.time ?? 0,
      text: data.text ?? ''
    }

    currentContent.value.timelineMemos.push(newMemo)
  }

  // タイムラインメモ更新
  function updateTimelineMemo(data: Partial<TimelineMemo> & { id: string }): void {
    if (!currentContent.value?.timelineMemos) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const memo = currentContent.value.timelineMemos.find(m => m.id === data.id)
    if (memo) {
      Object.assign(memo, data)
    }
  }

  // タイムラインメモ削除
  function deleteTimelineMemo(memoId: string): void {
    if (!currentContent.value?.timelineMemos) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const index = currentContent.value.timelineMemos.findIndex(m => m.id === memoId)
    if (index !== -1) {
      currentContent.value.timelineMemos.splice(index, 1)
    }
  }

  // タイムラインメモ移動
  function moveTimelineMemo(memoId: string, newTime: number): void {
    if (!currentContent.value?.timelineMemos) return
    const historyStore = useHistoryStore()
    historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))

    const memo = currentContent.value.timelineMemos.find(m => m.id === memoId)
    if (memo) {
      memo.time = newTime
    }
  }

  // 状態を復元（Undo/Redo用）
  function restoreState(state: Content): void {
    const index = contents.value.findIndex(c => c.id === state.id)
    if (index !== -1) {
      contents.value[index] = state
    }
  }

  return {
    // State
    contents,
    currentContentId,
    raidIndex,
    // Getters
    currentContent,
    phases,
    gimmicks,
    burstTimings,
    timelineMemos,
    raidList,
    // Actions
    loadContents,
    selectContent,
    createContent,
    updateContent,
    saveContent,
    splitPhase,
    updatePhase,
    deletePhase,
    movePhase,
    movePhaseDivider,
    addGimmick,
    updateGimmick,
    deleteGimmick,
    moveGimmick,
    addBurst,
    updateBurst,
    deleteBurst,
    moveBurst,
    resizeBurst,
    addTimelineMemo,
    updateTimelineMemo,
    deleteTimelineMemo,
    moveTimelineMemo,
    restoreState
  }
})

// フェーズカラーを取得
function getNextPhaseColor(index: number): string {
  const colors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6']
  return colors[index % colors.length]
}
