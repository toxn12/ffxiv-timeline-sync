const data = require('../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json');

const enhanced = data.gimmicks.filter(g => g.category);

console.log('=== メタデータ付きギミック（最初の10個）===\n');

enhanced.slice(0, 10).forEach(g => {
  console.log(`${g.time}s - ${g.name}`);
  console.log(`  カテゴリ: ${g.category}`);
  console.log(`  ダメージ: ${g.damageType}`);
  console.log(`  危険度: ${g.severity}`);
  console.log(`  軽減: ${g.mitigation}`);
  console.log(`  ターゲット: ${g.targets?.join(', ')}`);
  console.log(`  説明: ${g.description}`);
  console.log('');
});
