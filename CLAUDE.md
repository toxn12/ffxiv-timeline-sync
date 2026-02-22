# FF14 零式タイムライン管理ツール — Claude Code ガイド

## プロジェクトの目的

FF14 高難易度コンテンツ（零式レイド）の攻略用「軽減表」をWebアプリ化したもの。
スプレッドシートで共有されていた軽減表の課題（スマホ非対応・パフォーマンス・非直感的な時間軸）を解決する。

参考元スプレッドシート: らすとさん（@_ras_to_）のアルカディア・ヘビー級零式 軽減表

---

## 技術スタック

| 技術 | 役割 |
|------|------|
| Vue 3 (Composition API) | UIフレームワーク |
| Pinia | 状態管理 |
| Tailwind CSS | スタイリング |
| Vite | ビルドツール |
| TypeScript | 型安全 |

開発サーバー起動: `cd 04_implementation && npm run dev` → http://localhost:5173

---

## ディレクトリ構造

```
ffxiv-timeline-sync/
├── CLAUDE.md                  ← このファイル（Claude用ガイド）
├── README.md                  ← 実行手順
├── RELEASE_NOTES.md           ← リリース履歴（変更時は必ず更新）
├── 課題管理表.md              ← 未着手・対応中の課題
├── 課題管理表_完了.md         ← 完了済み課題のアーカイブ
├── 03_design/detailed-design.md  ← 詳細設計書（コンポーネント・型定義の参考）
└── 04_implementation/
    ├── src/
    │   ├── App.vue            ← ルート。キーボードショートカット・初期化
    │   ├── components/        ← Vue コンポーネント
    │   │   ├── AppHeader.vue  ← ヘッダー（通常/編集モード切替）
    │   │   ├── Timeline.vue   ← タイムライン全体・スクロール同期
    │   │   ├── header/        ← BossSelector, PartySelector, ZoomControls, EditToolbar
    │   │   ├── timeline/      ← MemberArea, MemberRow, GimmickRow, MitigationGraph ...
    │   │   ├── timeline-items/ ← SkillBar（スキルバーの表示・ドラッグ）
    │   │   ├── modals/        ← PartyManageModal, ContentSettingsModal, ConfirmModal
    │   │   └── ui/            ← ContextMenu, GimmickTooltip, SkillPopup ...
    │   ├── stores/            ← Pinia ストア
    │   ├── composables/       ← Vue composables
    │   ├── types/             ← TypeScript 型定義
    │   └── utils/             ← ユーティリティ関数
    └── public/
        └── data/
            ├── contents/index.json  ← ボス一覧インデックス（起動時に読み込む）
            └── contents/*.json      ← 各ボスのタイムラインデータ（遅延ロード）
```

---

## 重要ファイルのマップ

| 目的 | ファイル |
|------|---------|
| ボスタイムラインデータ管理 | `stores/contentStore.ts` |
| UI状態（ズーム・モード・モーダル） | `stores/uiStore.ts` |
| パーティ・メンバー・スキル配置 | `stores/partyStore.ts` |
| スキルマスターデータ | `stores/skillMasterStore.ts` |
| Undo/Redo 履歴 | `stores/historyStore.ts` |
| コンテンツ型定義 | `types/content.ts` |
| パーティ型定義 | `types/party.ts` |
| スキル型定義 | `types/skill.ts` |
| ドラッグ&ドロップ | `composables/useDragAndDrop.ts` |
| 軽減効果の集計計算 | `composables/useMitigationAggregation.ts` |
| スキルレーン配置ロジック | `composables/useSkillLane.ts` |

---

## 設計の重要な約束事

- **時間はミリ秒精度で統一**（秒ではなく ms。`duration: 600000` = 600秒）
- **ピクセル変換**: `1秒 = 10px × zoomLevel`（デフォルト zoomLevel=2.5 で 1秒=25px）
- **ボスデータは遅延ロード**: 起動時は `index.json` のみ。ボス選択時に初めてJSONをフェッチ
- **パーティデータは localStorage に保存**（オフライン対応、サーバー不要）
- **スキルは4レーン**構成（1メンバーあたり最大4レーン）
- **モードは2つ**: `normal`（閲覧・パーティ編集）/ `edit`（コンテンツ編集）

---

## コンポーネントの2モード

- **通常モード (`normal`)**: パーティ選択・スキル配置・閲覧
- **編集モード (`edit`)**: ボスのギミック・フェーズ・バースト編集（黄色テキストで「ボス名（編集）」から入れる）

---

## よく使うパターン

### 新しいボスデータを追加する
1. `04_implementation/public/data/contents/` に JSON ファイルを作成
2. `04_implementation/public/data/contents/index.json` に追記
3. JSON のフォーマットは `types/content.ts` の `Content` 型を参照

### パーティストアでスキルを操作する
```typescript
partyStore.addSkill({ memberId, skillId, time })
partyStore.moveSkill(skillId, newTime)
partyStore.deleteSkill(skillId)
```

### ローディング表示を出す
```typescript
const uiStore = useUIStore()
uiStore.startLoading('処理中...')
// 処理
uiStore.stopLoading()
```

### Undo/Redo に対応させる
```typescript
const historyStore = useHistoryStore()
historyStore.push('content', JSON.parse(JSON.stringify(currentContent.value)))
// その後に変更を加える
```

---

## 開発ルール

- コミットメッセージは **日本語**
- 新課題は **課題管理表.md** の「未着手・対応中」に追加
- 機能変更・追加時は **RELEASE_NOTES.md** を先頭に追記
- コード変更前に必ず **EnterPlanMode** でプランを提示してから実装
- セキュリティは **OWASP Top 10** 準拠

---

## ショートカット（アプリ内）

| キー | 動作 |
|------|------|
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+S | 保存（モードに応じてコンテンツ/パーティ） |
| Delete / Backspace | 選択オブジェクト削除 |
| V | 選択ツール（編集モード） |
| C | 分割ツール（編集モード） |
| Shift+ホイール | ズーム |
| ホイール | 横スクロール |
