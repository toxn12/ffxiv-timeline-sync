const data = require('../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json');

console.log('=== 新しい3層.jsonの検証 ===\n');
console.log('ギミック数:', data.gimmicks.length);
console.log('duration:', data.duration, 'ms (', (data.duration / 1000).toFixed(2), 's)');
console.log('bossName:', data.bossName);
console.log('');

console.log('最初の5ギミック:\n');
data.gimmicks.slice(0, 5).forEach((g, i) => {
  console.log(`${i + 1}. time: ${g.time}ms (${(g.time / 1000).toFixed(3)}s)`);
  console.log(`   castDuration: ${g.castDuration}ms (${(g.castDuration / 1000).toFixed(1)}s)`);
  console.log(`   name: ${g.name}`);
  console.log(`   category: ${g.category || 'なし'}`);
  console.log('');
});

console.log('メタデータ統計:');
const withCategory = data.gimmicks.filter(g => g.category).length;
const withSeverity = data.gimmicks.filter(g => g.severity).length;
const withMitigation = data.gimmicks.filter(g => g.mitigation).length;
console.log(`  category: ${withCategory}/${data.gimmicks.length}`);
console.log(`  severity: ${withSeverity}/${data.gimmicks.length}`);
console.log(`  mitigation: ${withMitigation}/${data.gimmicks.length}`);
