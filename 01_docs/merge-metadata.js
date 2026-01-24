/**
 * 既存のメタデータを新しいミリ秒精度のJSONにマージするスクリプト
 */
const fs = require('fs');

const oldFile = '../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json';
const newFile = '../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層_new.json';
const outputFile = '../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json';

console.log('=== メタデータマージ処理 ===\n');

const oldData = JSON.parse(fs.readFileSync(oldFile, 'utf-8'));
const newData = JSON.parse(fs.readFileSync(newFile, 'utf-8'));

console.log(`旧データ: ${oldData.gimmicks.length} ギミック`);
console.log(`新データ: ${newData.gimmicks.length} ギミック\n`);

// 名前ベースでマッチング（時間は異なるため）
const mergedGimmicks = newData.gimmicks.map((newGimmick, index) => {
  // 同じ名前の旧ギミックを探す
  const oldGimmick = oldData.gimmicks.find(old => old.name === newGimmick.name);

  if (oldGimmick && oldGimmick.category) {
    console.log(`✓ マージ: ${newGimmick.name} (${index + 1}/${newData.gimmicks.length})`);
    return {
      ...newGimmick,
      category: oldGimmick.category,
      damageType: oldGimmick.damageType,
      severity: oldGimmick.severity,
      mitigation: oldGimmick.mitigation,
      targets: oldGimmick.targets,
      description: oldGimmick.description,
      mechanics: oldGimmick.mechanics,
      memo: oldGimmick.memo
    };
  } else {
    return newGimmick;
  }
});

// マージされたデータを構築
const mergedData = {
  ...newData,
  bossName: '3層（ザ・タイラント）', // index.jsonに合わせる
  gimmicks: mergedGimmicks
};

// バックアップを作成
fs.writeFileSync(
  '../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層_backup.json',
  JSON.stringify(oldData, null, 2),
  'utf-8'
);

// 新しいデータを出力
fs.writeFileSync(outputFile, JSON.stringify(mergedData, null, 2), 'utf-8');

console.log(`\n=== 完了 ===`);
console.log(`バックアップ: 3層_backup.json`);
console.log(`出力: ${outputFile}`);

// メタデータ付きギミックの数をカウント
const withMetadata = mergedGimmicks.filter(g => g.category).length;
console.log(`\nメタデータ付きギミック: ${withMetadata}/${mergedGimmicks.length}`);
