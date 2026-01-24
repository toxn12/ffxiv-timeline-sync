const fs = require('fs');
const data = JSON.parse(fs.readFileSync('fflogs-アルカディア零式3層_ザ・タイラント.json', 'utf-8'));

console.log('=== ボスのアビリティとイベント解析 ===\n');

const abilities = new Map();
const eventTypes = new Set();
const events = [];

// データを再帰的に探索してイベントを抽出
function extractEvents(obj, depth = 0) {
  if (depth > 20) return;

  if (obj && typeof obj === 'object') {
    // イベントオブジェクト
    if (obj.timestamp && obj.ability && !obj.sourceIsFriendly) {
      events.push(obj);

      // アビリティ情報を収集
      const abilityKey = obj.ability.guid;
      if (!abilities.has(abilityKey)) {
        abilities.set(abilityKey, {
          name: obj.ability.name,
          guid: obj.ability.guid,
          type: obj.ability.type,
          count: 0
        });
      }
      abilities.get(abilityKey).count++;

      // イベントタイプを収集
      if (obj.type) {
        eventTypes.add(obj.type);
      }
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

console.log(`【収集したイベント数】 ${events.length}`);
console.log(`【ユニークなアビリティ数】 ${abilities.size}`);
console.log(`【イベントタイプ】 ${Array.from(eventTypes).join(', ')}\n`);

// イベントをタイムスタンプでソート
events.sort((a, b) => a.timestamp - b.timestamp);

console.log('【タイムライン（最初の20イベント）】');
events.slice(0, 20).forEach((event, i) => {
  const relTime = ((event.timestamp - data.startTime) / 1000).toFixed(1);
  const duration = event.duration ? (event.duration / 1000).toFixed(1) : '-';
  console.log(`${relTime}s - ${event.type.padEnd(12)} - ${event.ability.name} (cast: ${duration}s)`);
});

console.log('\n【頻出アビリティ TOP 20】');
const sortedAbilities = Array.from(abilities.values())
  .sort((a, b) => b.count - a.count)
  .slice(0, 20);

sortedAbilities.forEach((ability, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${ability.name.padEnd(40)} (${ability.count}回)`);
});

console.log('\n【begincast イベントのみ（キャスト時間付き）- 最初の30個】');
const castEvents = events
  .filter(e => e.type === 'begincast')
  .slice(0, 30);

castEvents.forEach((event, i) => {
  const relTime = ((event.timestamp - data.startTime) / 1000).toFixed(1);
  const duration = event.duration ? (event.duration / 1000).toFixed(1) : '?';
  console.log(`${relTime}s - ${event.ability.name} (cast: ${duration}s)`);
});
