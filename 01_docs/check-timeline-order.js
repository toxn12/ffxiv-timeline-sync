const data = require('../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json');

console.log('=== キング・オブ・アルカディア と ウェポンジェネレート の順序確認 ===\n');

// 最初の20個のギミックを表示
const first20 = data.gimmicks.slice(0, 20);
first20.forEach((g, i) => {
  console.log(`${i + 1}. ${g.time}s - ${g.name}`);
});

console.log('\n=== キング・オブ・アルカディアを含むギミック ===\n');
const kingGimmicks = data.gimmicks.filter(g => g.name.includes('キング・オブ・アルカディア'));
kingGimmicks.forEach(g => {
  console.log(`${g.time}s - ${g.name}`);
});

console.log('\n=== ウェポンジェネレートを含むギミック（最初の10個） ===\n');
const weaponGimmicks = data.gimmicks.filter(g => g.name.includes('ウェポンジェネレート')).slice(0, 10);
weaponGimmicks.forEach(g => {
  console.log(`${g.time}s - ${g.name}`);
});
