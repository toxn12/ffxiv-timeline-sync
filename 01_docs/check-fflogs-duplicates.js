const fs = require('fs');
const data = JSON.parse(fs.readFileSync('fflogs-アルカディア零式3層_ザ・タイラント.json', 'utf-8'));

console.log('=== FFLogsデータの重複イベント確認 ===\n');

const events = [];

// データを再帰的に探索してイベントを抽出
function extractEvents(obj, depth = 0) {
  if (depth > 20) return;

  if (obj && typeof obj === 'object') {
    // イベントオブジェクト（begincastのみ）
    if (obj.timestamp && obj.ability && !obj.sourceIsFriendly && obj.type === 'begincast') {
      events.push(obj);
    }

    // 配列の再帰処理
    if (Array.isArray(obj)) {
      obj.forEach(item => extractEvents(item, depth + 1));
    } else {
      Object.values(obj).forEach(value => extractEvents(value, depth + 1));
    }
  }
}

extractEvents(data);

// タイムスタンプでソート
events.sort((a, b) => a.timestamp - b.timestamp);

// キング・オブ・アルカディアの最初の3つのイベントを確認
console.log('【キング・オブ・アルカディアの最初の3イベント】');
const kingEvents = events.filter(e => e.ability.name.includes('キング・オブ・アルカディア')).slice(0, 3);
kingEvents.forEach((event, i) => {
  const relTime = ((event.timestamp - data.startTime) / 1000).toFixed(1);
  const duration = event.duration ? (event.duration / 1000).toFixed(1) : '?';
  console.log(`${i + 1}. ${relTime}s - ${event.ability.name} (cast: ${duration}s, sourceID: ${event.sourceID}, targetID: ${event.targetID || 'none'})`);
});

// 最初の20イベントを表示
console.log('\n【最初の20 begincast イベント】');
events.slice(0, 20).forEach((event, i) => {
  const relTime = ((event.timestamp - data.startTime) / 1000).toFixed(1);
  const duration = event.duration ? (event.duration / 1000).toFixed(1) : '?';
  console.log(`${i + 1}. ${relTime}s - ${event.ability.name} (cast: ${duration}s)`);
});
