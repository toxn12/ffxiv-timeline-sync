# タイムラインデータ拡張ガイド

## 概要

このドキュメントでは、ギミックデータに攻略情報（メタデータ）を付与する方法と、元に戻す方法について説明します。

---

## 拡張された型定義

### Gimmick 型の拡張フィールド

すべて **オプショナル** なので、既存のデータと完全に互換性があります。

```typescript
export interface Gimmick {
  // 既存フィールド
  id: string
  name: string
  time: number
  castDuration: number
  phaseId: string
  memo?: string

  // 拡張フィールド（すべてオプショナル）
  category?: GimmickCategory        // ギミックの種類
  damageType?: DamageType           // ダメージタイプ
  severity?: Severity               // 危険度
  mitigation?: MitigationLevel      // 軽減推奨度
  targets?: TargetType[]            // ターゲット
  description?: string              // 対処法・説明
  mechanics?: string[]              // ギミック要素
}
```

### 各型の値

#### GimmickCategory（ギミックの種類）
- `raidwide` - 全体攻撃
- `tankbuster` - タンクバスター
- `stack` - 頭割り
- `spread` - 散開
- `tower` - 塔踏み
- `proximity` - 距離減衰
- `mechanic` - 複合ギミック
- `transition` - フェーズ移行
- `enrage` - 時間切れ
- `other` - その他

#### DamageType（ダメージタイプ）
- `physical` - 物理ダメージ
- `magical` - 魔法ダメージ
- `none` - ダメージなし
- `mixed` - 混合

#### Severity（危険度）
- `low` - 低（通常の攻撃）
- `medium` - 中（要注意）
- `high` - 高（危険）
- `fatal` - 即死級

#### MitigationLevel（軽減推奨度）
- `none` - 不要
- `optional` - 任意
- `recommended` - 推奨
- `required` - 必須
- `invuln` - 無敵推奨

#### TargetType（ターゲット）
- `all` - 全員
- `tanks` - タンク
- `healers` - ヒーラー
- `dps` - DPS
- `mt` - メインタンク
- `st` - サブタンク
- `random` - ランダム

---

## 使用方法

### 1. FFLogsデータからタイムライン生成

```bash
node 01_docs/generate-timeline.js <FFLogsのJSONファイル> <出力先JSONファイル>
```

**例**:
```bash
node 01_docs/generate-timeline.js "01_docs/fflogs-data.json" "04_implementation/public/data/contents/レイド名/ボス名.json"
```

### 2. 攻略情報（メタデータ）の付与

```bash
node 01_docs/enhance-timeline.js <入力JSONファイル> <出力JSONファイル>
```

**例**:
```bash
node 01_docs/enhance-timeline.js "04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json" "04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json"
```

**注意**: 同じファイルを指定すると上書きされます。バックアップを取ることを推奨します。

### 3. データの確認

```bash
node 01_docs/check-enhanced.js
```

---

## 元に戻す方法

### 方法1: バックアップから復元

拡張前にバックアップを作成している場合：

```bash
cd "04_implementation/public/data/contents/アルカディア・ヘビー級零式"
cp "3層.backup.json" "3層.json"
```

### 方法2: 型定義を元に戻す

型定義ファイル `src/types/content.ts` をGitで元に戻す：

```bash
cd 04_implementation
git checkout src/types/content.ts
```

### 方法3: メタデータフィールドを削除

以下のスクリプトでメタデータフィールドのみ削除：

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('3層.json', 'utf-8'));

data.gimmicks.forEach(gimmick => {
  delete gimmick.category;
  delete gimmick.damageType;
  delete gimmick.severity;
  delete gimmick.mitigation;
  delete gimmick.targets;
  delete gimmick.description;
  delete gimmick.mechanics;
});

fs.writeFileSync('3層.json', JSON.stringify(data, null, 2), 'utf-8');
```

---

## バックアップ状況

現在、以下のバックアップが作成されています：

- `04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.backup.json`
  - 拡張前のオリジナルデータ

---

## メタデータ付与のカスタマイズ

`01_docs/enhance-timeline.js` のパターンマッチング部分を編集することで、カスタムルールを追加できます。

```javascript
const gimmickPatterns = [
  {
    pattern: /新しいギミック名/,
    metadata: {
      category: 'raidwide',
      damageType: 'magical',
      severity: 'high',
      mitigation: 'required',
      targets: ['all'],
      description: 'ギミックの説明',
      mechanics: ['全体攻撃']
    }
  },
  // ... 他のパターン
];
```

---

## 付与されたメタデータの統計（3層の例）

- **総ギミック数**: 277個
- **メタデータ付与数**: 112個
- **未分類**: 165個

### カテゴリ別集計

| カテゴリ | 数 |
|---------|-----|
| mechanic (複合ギミック) | 73個 |
| raidwide (全体攻撃) | 14個 |
| tankbuster (タンクバスター) | 9個 |
| proximity (距離減衰) | 9個 |
| stack (頭割り) | 7個 |

---

## 今後の活用方法

拡張されたメタデータは、以下のような用途に活用できます：

1. **UI表示の強化**
   - ギミックアイコンの色分け（危険度別）
   - カテゴリごとのフィルタリング
   - ツールチップでの詳細表示

2. **軽減計画の自動提案**
   - 必須軽減タイミングのハイライト
   - 無敵必須箇所の警告

3. **ロール別ビュー**
   - タンク向けギミックのみ表示
   - ヒーラー向け回復タイミング表示

4. **攻略ガイドの自動生成**
   - タイムライン + 説明の出力
   - Markdown形式でのエクスポート

---

## サポート

質問や問題がある場合は、以下を確認してください：

1. バックアップファイルの存在確認
2. 型定義の互換性（すべてオプショナル）
3. 既存データへの影響（なし）
