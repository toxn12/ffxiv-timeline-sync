const data = require('./fflogs-アルカディア零式3層_ザ・タイラント.json');

function findEvents(obj, depth = 0) {
  if (depth > 20) return [];
  let events = [];

  if (obj && typeof obj === 'object') {
    if (obj.timestamp && obj.ability && !obj.sourceIsFriendly && obj.type === 'begincast') {
      events.push(obj);
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => events.push(...findEvents(item, depth + 1)));
    } else {
      Object.values(obj).forEach(value => events.push(...findEvents(value, depth + 1)));
    }
  }

  return events;
}

const events = findEvents(data).sort((a, b) => a.timestamp - b.timestamp);

console.log('=== FFLogsの精密タイムスタンプ確認 ===\n');
console.log('最初の5イベントの詳細:\n');

events.slice(0, 5).forEach((e, i) => {
  const relTime = e.timestamp - data.startTime;
  const relSec = relTime / 1000;
  const duration = e.duration || 0;
  const durSec = duration / 1000;

  console.log(`${i + 1}. ${e.ability.name}`);
  console.log(`   タイムスタンプ: ${e.timestamp} (相対: ${relTime}ms = ${relSec}s)`);
  console.log(`   キャスト時間: ${duration}ms = ${durSec}s`);
  console.log(`   発動時刻: ${relTime + duration}ms = ${(relTime + duration) / 1000}s`);
  console.log('');
});

console.log('\n=== 現在の3層.jsonとの比較 ===\n');
const currentData = require('../04_implementation/public/data/contents/アルカディア・ヘビー級零式/3層.json');
console.log(`FFLogs duration: ${(data.endTime - data.startTime) / 1000}s`);
console.log(`3層.json duration: ${currentData.duration}s`);
console.log(`誤差: ${currentData.duration - (data.endTime - data.startTime) / 1000}s\n`);

console.log('最初の3ギミックの比較:');
events.slice(0, 3).forEach((e, i) => {
  const fflogs = (e.timestamp - data.startTime) / 1000;
  const json = currentData.gimmicks[i].time;
  const diff = Math.abs(json - fflogs);

  console.log(`${i + 1}. ${e.ability.name}`);
  console.log(`   FFLogs: ${fflogs}s`);
  console.log(`   3層.json: ${json}s`);
  console.log(`   誤差: ${diff}s (${diff * 1000}ms)`);
});
