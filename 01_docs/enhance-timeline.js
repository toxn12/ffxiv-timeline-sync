#!/usr/bin/env node
/**
 * 既存のタイムラインJSONに攻略情報（メタデータ）を付与するスクリプト
 * 使用方法: node enhance-timeline.js <input-json> <output-json>
 */

const fs = require('fs');

// コマンドライン引数
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('使用方法: node enhance-timeline.js <input-json> <output-json>');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

// JSONファイル読み込み
console.log(`読み込み中: ${inputFile}`);
const data = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// ギミック名パターンマッチングによるメタデータ付与
const gimmickPatterns = [
  // 全体攻撃
  {
    pattern: /キング・オブ・アルカディア/,
    metadata: {
      category: 'raidwide',
      damageType: 'physical',
      severity: 'high',
      mitigation: 'required',
      targets: ['all'],
      description: '全体物理攻撃。牽制が非常に有効。軽減必須。',
      mechanics: ['全体攻撃']
    }
  },
  {
    pattern: /ザ・ミールストーム/,
    metadata: {
      category: 'raidwide',
      damageType: 'magical',
      severity: 'fatal',
      mitigation: 'required',
      targets: ['all'],
      description: '全員のHPを1にする攻撃。ヒーラーの回復漏れに注意。',
      mechanics: ['HP強制変更']
    }
  },

  // タンクバスター
  {
    pattern: /ウェポンジェネレート：バスター|ウェポンバスター/,
    metadata: {
      category: 'tankbuster',
      damageType: 'physical',
      severity: 'high',
      mitigation: 'required',
      targets: ['mt', 'st'],
      description: 'ヘイト1位・2位への強攻撃。STは常にスタンス維持。',
      mechanics: ['タンクバスター']
    }
  },

  // 複合ギミック
  {
    pattern: /トロフィーウェポンズ/,
    metadata: {
      category: 'mechanic',
      damageType: 'mixed',
      severity: 'medium',
      mitigation: 'optional',
      targets: ['all'],
      description: 'ボス向きを基準に8方向散開、頭割り処理が必要。',
      mechanics: ['散開', '頭割り']
    }
  },
  {
    pattern: /アルティメット・トロフィーウェポンズ/,
    metadata: {
      category: 'mechanic',
      damageType: 'mixed',
      severity: 'high',
      mitigation: 'recommended',
      targets: ['all'],
      description: '強化版トロフィーウェポンズ。複合処理が必要。',
      mechanics: ['散開', '頭割り', '範囲回避']
    }
  },
  {
    pattern: /コメットレイン/,
    metadata: {
      category: 'mechanic',
      damageType: 'magical',
      severity: 'medium',
      mitigation: 'optional',
      targets: ['all'],
      description: '円形攻撃捨て後、散開または頭割り処理（2回目は逆パターン）。',
      mechanics: ['範囲攻撃', '散開', '頭割り']
    }
  },
  {
    pattern: /ウェポンジェネレート：ドミネーション|ダンス・オブ・ドミネーション/,
    metadata: {
      category: 'mechanic',
      damageType: 'magical',
      severity: 'medium',
      mitigation: 'optional',
      targets: ['all'],
      description: 'フィールド6本の直線範囲回避＋2人頭割り。',
      mechanics: ['範囲回避', '頭割り']
    }
  },
  {
    pattern: /メテオレイン/,
    metadata: {
      category: 'mechanic',
      damageType: 'magical',
      severity: 'high',
      mitigation: 'recommended',
      targets: ['all'],
      description: '隕石設置＋頭割り＋外周隕石処理の複合ギミック。',
      mechanics: ['隕石', '頭割り', '範囲回避']
    }
  },
  {
    pattern: /チャンピオンズ?メテオ/,
    metadata: {
      category: 'mechanic',
      damageType: 'magical',
      severity: 'high',
      mitigation: 'recommended',
      targets: ['all'],
      description: 'フィールド分断＋塔踏み＋線処理の複合処理。',
      mechanics: ['塔踏み', '線処理', 'フィールド分断']
    }
  },
  {
    pattern: /メテオスタンピード/,
    metadata: {
      category: 'mechanic',
      damageType: 'magical',
      severity: 'high',
      mitigation: 'recommended',
      targets: ['all'],
      description: '距離減衰＋塔踏み＋線処理＋頭割りの複合ギミック。',
      mechanics: ['距離減衰', '塔踏み', '線処理', '頭割り']
    }
  },
  {
    pattern: /ハートブレイクキック/,
    metadata: {
      category: 'stack',
      damageType: 'physical',
      severity: 'fatal',
      mitigation: 'invuln',
      targets: ['all'],
      description: '3回連続頭割り。回数を重ねるたび着弾回数と与ダメージが増加。2・3回目はタンク無敵必須。',
      mechanics: ['頭割り', '連続攻撃']
    }
  },

  // その他の攻撃
  {
    pattern: /ウェポンアサルト/,
    metadata: {
      category: 'mechanic',
      damageType: 'physical',
      severity: 'medium',
      mitigation: 'optional',
      targets: ['tanks'],
      description: '範囲攻撃または連続攻撃。',
      mechanics: ['範囲攻撃']
    }
  },
  {
    pattern: /ザ・ハリケーン/,
    metadata: {
      category: 'raidwide',
      damageType: 'magical',
      severity: 'medium',
      mitigation: 'optional',
      targets: ['all'],
      description: '全体魔法攻撃。',
      mechanics: ['全体攻撃']
    }
  },
  {
    pattern: /ヘビーメテオ|ヘビーコメット/,
    metadata: {
      category: 'proximity',
      damageType: 'magical',
      severity: 'medium',
      mitigation: 'optional',
      targets: ['all'],
      description: '距離減衰攻撃。離れて受ける。',
      mechanics: ['距離減衰']
    }
  },
  {
    pattern: /プチコメット|コメット(?!レイン)/,
    metadata: {
      category: 'mechanic',
      damageType: 'magical',
      severity: 'low',
      mitigation: 'none',
      targets: ['all'],
      description: '隕石設置または小範囲攻撃。',
      mechanics: ['範囲攻撃']
    }
  }
];

// 各ギミックにメタデータを付与
let enhancedCount = 0;
data.gimmicks.forEach(gimmick => {
  // 既にメタデータがある場合はスキップ
  if (gimmick.category) return;

  // パターンマッチング
  for (const pattern of gimmickPatterns) {
    if (pattern.pattern.test(gimmick.name)) {
      Object.assign(gimmick, pattern.metadata);
      enhancedCount++;
      break;
    }
  }
});

// ファイル出力
console.log(`出力中: ${outputFile}`);
fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n=== メタデータ付与完了 ===');
console.log(`総ギミック数: ${data.gimmicks.length}`);
console.log(`メタデータ付与数: ${enhancedCount}`);
console.log(`未分類: ${data.gimmicks.length - enhancedCount}`);

// 統計情報
const categoryCount = {};
data.gimmicks.forEach(g => {
  if (g.category) {
    categoryCount[g.category] = (categoryCount[g.category] || 0) + 1;
  }
});

console.log('\n【カテゴリ別集計】');
Object.entries(categoryCount)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    console.log(`  ${category.padEnd(15)}: ${count}個`);
  });

// 未分類のギミック一覧
const unclassified = data.gimmicks.filter(g => !g.category);
if (unclassified.length > 0) {
  console.log('\n【未分類のギミック（一部）】');
  const uniqueNames = [...new Set(unclassified.map(g => g.name))];
  uniqueNames.slice(0, 20).forEach(name => {
    console.log(`  - ${name}`);
  });
  if (uniqueNames.length > 20) {
    console.log(`  ... 他 ${uniqueNames.length - 20} 個`);
  }
}
