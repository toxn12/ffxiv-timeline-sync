const fs = require('fs');
const data = JSON.parse(fs.readFileSync('fflogs-アルカディア零式3層_ザ・タイラント.json', 'utf-8'));

console.log('=== FFLogs データ構造解析 ===\n');

console.log('【基本情報】');
console.log(`戦闘開始: ${data.startTime}ms`);
console.log(`戦闘終了: ${data.endTime}ms`);
console.log(`戦闘時間: ${Math.round((data.endTime - data.startTime) / 1000)}秒 (${Math.floor((data.endTime - data.startTime) / 60000)}分${Math.round(((data.endTime - data.startTime) % 60000) / 1000)}秒)`);
console.log('');

console.log('【Series 情報】');
data.series.forEach((s, i) => {
  console.log(`Series ${i + 1}:`);
  console.log(`  名前: ${s.name}`);
  console.log(`  タイプ: ${s.type}`);
  console.log(`  ID: ${s.id}`);
  console.log(`  GUID: ${s.guid}`);
  console.log(`  合計イベント数: ${s.total}`);
  console.log(`  data配列の長さ: ${s.data?.length || 0}`);

  // dataの構造を少し見る
  if (s.data && s.data.length > 0) {
    const firstItem = s.data[0];
    if (Array.isArray(firstItem)) {
      console.log(`  data[0]の形式: 配列 [${firstItem[0]}, ${firstItem[1]}]`);
      if (firstItem.length > 2) {
        console.log(`    さらに入れ子データあり`);
      }
    }
  }
  console.log('');
});

// 詳細なイベント構造を探す
console.log('【イベント詳細構造の探索】');
let sampleEvent = null;

function findDetailedEvent(obj, depth = 0) {
  if (depth > 20 || sampleEvent) return;

  if (obj && typeof obj === 'object') {
    if (obj.timestamp && obj.ability && obj.type) {
      sampleEvent = obj;
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach(item => findDetailedEvent(item, depth + 1));
    } else {
      Object.values(obj).forEach(value => findDetailedEvent(value, depth + 1));
    }
  }
}

findDetailedEvent(data);

if (sampleEvent) {
  console.log('サンプルイベント構造:');
  console.log(JSON.stringify(sampleEvent, null, 2).substring(0, 1000));
}
