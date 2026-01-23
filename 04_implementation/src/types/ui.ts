/**
 * UI状態関連の型定義
 */

export type AppMode = 'normal' | 'edit'
export type EditTool = 'select' | 'split' | 'delete' | 'addGimmick' | 'addBurst' | 'addMemo'
export type ObjectType = 'phase' | 'gimmick' | 'burst' | 'skill' | 'member'

export interface UIState {
  // モード
  mode: AppMode

  // 編集ツール（編集モード時）
  selectedTool: EditTool

  // 選択状態
  selectedObjectId: string | null
  selectedObjectType: ObjectType | null

  // 表示設定
  zoomLevel: number            // 1.0 = 100%
  scrollPosition: {
    x: number
    y: number
  }

  // モーダル
  modals: {
    partyManage: boolean
    contentSettings: boolean
    confirm: boolean
  }

  // 確認ダイアログ用
  confirmData: {
    message: string
    onConfirm: () => void
  } | null
}

// 履歴エントリ
export interface HistoryEntry {
  type: 'content' | 'party'
  timestamp: number
  state: unknown
}

// キーボードショートカット
export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  action: () => void
  description: string
}
