#!/usr/bin/env node
/**
 * FFLogs XHRデータからボスギミックテンプレートを生成するスクリプト
 * 使用方法: node generate-timeline.js <input-json> <output-json>
 */

const fs = require('fs');
const path = require('path');

// コマンドライン引数
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('使用方法: node generate-timeline.js <input-json> <output-json>');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

// JSONファイル読み込み
console.log(`読み込み中: ${inputFile}`);
const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

// データ抽出
const startTime = rawData.startTime;
const endTime = rawData.endTime;
const duration = endTime - startTime; // ミリ秒単位

console.log(`戦闘時間: ${duration}ms (${(duration / 1000).toFixed(2)}秒 = ${Math.floor(duration / 60000)}分${Math.floor((duration % 60000) / 1000)}秒)`);

// ボス情報取得
const bossSeries = rawData.series.find(s => s.type === 'Boss');
if (!bossSeries) {
  console.error('ボス情報が見つかりません');
  process.exit(1);
}

const bossName = bossSeries.name;
console.log(`ボス名: ${bossName}`);

// キャストイベント抽出
const casts = [];
const abilityMap = new Map(); // ability guid -> ability info

// series.dataを解析
if (bossSeries.data && Array.isArray(bossSeries.data)) {
  bossSeries.data.forEach(eventGroup => {
    if (Array.isArray(eventGroup) && eventGroup.length > 0) {
      eventGroup.forEach(event => {
        if (event && typeof event === 'object' && event.ability) {
          const ability = event.ability;
          const timestamp = Array.isArray(eventGroup[0]) ? eventGroup[0][0] : event.timestamp;
          const castTime = Array.isArray(eventGroup[0]) ? eventGroup[0][1] : 0;

          // ability情報を保存
          if (!abilityMap.has(ability.guid)) {
            abilityMap.set(ability.guid, {
              name: ability.name,
              guid: ability.guid,
              type: ability.type,
              icon: ability.abilityIcon
            });
          }
        }
      });
    }
  });
}

// 別の方法でキャストを抽出（入れ子データ構造）
function extractCasts(data, depth = 0) {
  if (!data || depth > 10) return;

  if (Array.isArray(data)) {
    // [timestamp, duration] 形式
    if (data.length === 2 && typeof data[0] === 'number' && typeof data[1] === 'number') {
      return { timestamp: data[0], duration: data[1] };
    }

    // 配列の各要素を再帰的に処理
    data.forEach(item => extractCasts(item, depth + 1));
  } else if (typeof data === 'object') {
    // イベントオブジェクト（begincastのみを抽出）
    if (data.timestamp && data.ability && !data.sourceIsFriendly && data.type === 'begincast') {
      const relativeTime = data.timestamp - startTime; // ミリ秒
      const castDuration = data.duration || (data.castTime || 3000); // ミリ秒

      casts.push({
        time: relativeTime, // ミリ秒精度（丸めない）
        name: data.ability.name,
        guid: data.ability.guid,
        castDuration: castDuration,
        type: data.type
      });

      // ability情報保存
      if (!abilityMap.has(data.ability.guid)) {
        abilityMap.set(data.ability.guid, {
          name: data.ability.name,
          guid: data.ability.guid,
          icon: data.ability.abilityIcon
        });
      }
    }

    // オブジェクトの各プロパティを再帰的に処理
    Object.values(data).forEach(value => extractCasts(value, depth + 1));
  }
}

console.log('キャストデータを抽出中...');
extractCasts(rawData);

// タイムスタンプでソート
casts.sort((a, b) => a.time - b.time);

console.log(`抽出されたキャスト数: ${casts.length}`);
console.log(`ユニークなアビリティ数: ${abilityMap.size}`);

// ギミック生成（重複スキルをマージ）
const gimmicks = [];
const seenAbilities = new Map(); // abilityごとの出現回数

casts.forEach((cast, index) => {
  // unknown スキルはスキップ
  if (cast.name.startsWith('unknown_')) return;

  // 出現回数をカウント
  const count = seenAbilities.get(cast.guid) || 0;
  seenAbilities.set(cast.guid, count + 1);

  // ギミック名（同じスキルが複数回ある場合は番号付け）
  const abilityCount = count + 1;
  const gimmickName = abilityCount > 1
    ? `${cast.name}(${abilityCount})`
    : cast.name;

  gimmicks.push({
    id: `gimmick-${index + 1}`,
    name: gimmickName,
    time: cast.time,
    castDuration: cast.castDuration || 3000, // デフォルト3000ms
    phaseId: null // 後で設定
  });
});

console.log(`生成されたギミック数: ${gimmicks.length}`);

// フェーズ自動分割（120秒=120000msごと、または特定の大技で区切る）
const phaseInterval = 120000; // ミリ秒
const numPhases = Math.max(3, Math.ceil(duration / phaseInterval));
const phases = [];

for (let i = 0; i < numPhases; i++) {
  const phaseStart = i * phaseInterval;
  const phaseEnd = Math.min((i + 1) * phaseInterval, duration);
  const colors = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

  phases.push({
    id: `phase-${i + 1}`,
    name: `フェーズ${i + 1}`,
    startTime: phaseStart,
    endTime: phaseEnd,
    color: colors[i % colors.length]
  });
}

// 各ギミックにphaseIdを割り当て
gimmicks.forEach(gimmick => {
  const phase = phases.find(p => gimmick.time >= p.startTime && gimmick.time < p.endTime);
  if (phase) {
    gimmick.phaseId = phase.id;
  } else {
    // 最後のフェーズに割り当て
    gimmick.phaseId = phases[phases.length - 1].id;
  }
});

// バーストタイミング生成（0ms、120000ms、240000ms...）
const burstTimings = [];
for (let i = 0; i * 120000 < duration; i++) {
  const burstStart = i * 120000;
  const burstEnd = burstStart + 20000; // 20秒間のバースト

  const burstNames = ['開幕', '2分', '4分', '6分', '8分', '10分'];

  burstTimings.push({
    id: `burst-${i + 1}`,
    name: burstNames[i] || `${i * 2}分`,
    startTime: burstStart,
    endTime: Math.min(burstEnd, duration)
  });
}

// テンプレート生成
const template = {
  id: bossName.toLowerCase().replace(/[・\s]+/g, '-'),
  raidName: 'アルカディア・ヘビー級零式', // 必要に応じて変更
  bossName: bossName, // 注意: index.jsonのnameと一致させる必要があります（例: "3層（ザ・タイラント）"）
  duration: duration,
  targets: ['ボス'],
  phases: phases,
  gimmicks: gimmicks,
  burstTimings: burstTimings
};

// ファイル出力
console.log(`出力中: ${outputFile}`);
fs.writeFileSync(outputFile, JSON.stringify(template, null, 2), 'utf-8');

console.log('\n=== 生成完了 ===');
console.log(`ボス名: ${bossName}`);
console.log(`戦闘時間: ${duration}ms (${(duration / 1000).toFixed(2)}秒)`);
console.log(`フェーズ数: ${phases.length}`);
console.log(`ギミック数: ${gimmicks.length}`);
console.log(`バーストタイミング: ${burstTimings.length}`);
console.log(`\n最初の10個のギミック:`);
gimmicks.slice(0, 10).forEach(g => {
  console.log(`  ${g.time}ms (${(g.time / 1000).toFixed(3)}s) - ${g.name}`);
});
