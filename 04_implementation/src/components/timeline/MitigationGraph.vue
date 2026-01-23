<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUIStore } from '@/stores'
import { useMitigationAggregation } from '@/composables/useMitigationAggregation'

const uiStore = useUIStore()
const { mitigationData, maxPhysicalMitigation, maxMagicalMitigation } = useMitigationAggregation()

const props = defineProps<{
  width: number
}>()

// ツールチップ表示
const showTooltip = ref(false)
const tooltipPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const tooltipData = ref<{ physical: number; magical: number; time: number; invincible: boolean }>({ physical: 0, magical: 0, time: 0, invincible: false })

// グラフの高さ（2種類のグラフを表示）
const graphHeight = 30
const totalHeight = graphHeight * 2 + 4 // 物理+魔法+間隔

// グラフのスケール上限（物理と魔法で統一）
const maxScale = computed(() => {
  const max = Math.max(maxPhysicalMitigation.value, maxMagicalMitigation.value, 10)
  // 10の倍数に切り上げ
  return Math.ceil(max / 10) * 10
})

// 補助線の位置（10%ごと）
const gridLines = computed(() => {
  const lines: number[] = []
  for (let i = 10; i <= maxScale.value; i += 10) {
    lines.push(i)
  }
  return lines
})

// 物理軽減のパスを生成
const physicalPath = computed(() => {
  if (mitigationData.value.length === 0) return ''

  const points: string[] = []

  // 開始点（左下）
  points.push(`M 0 ${graphHeight}`)

  // データポイント
  for (const data of mitigationData.value) {
    const x = uiStore.timeToPixel(data.time)
    const y = graphHeight - (data.physicalMitigation / maxScale.value) * graphHeight
    points.push(`L ${x} ${y}`)
  }

  // 終了点（右下→左下で閉じる）
  const lastX = uiStore.timeToPixel(mitigationData.value[mitigationData.value.length - 1].time)
  points.push(`L ${lastX} ${graphHeight}`)
  points.push('Z')

  return points.join(' ')
})

// 魔法軽減のパスを生成
const magicalPath = computed(() => {
  if (mitigationData.value.length === 0) return ''

  const points: string[] = []
  const offsetY = graphHeight + 2 // 物理グラフの下に配置

  // 開始点（左下）
  points.push(`M 0 ${offsetY + graphHeight}`)

  // データポイント
  for (const data of mitigationData.value) {
    const x = uiStore.timeToPixel(data.time)
    const y = offsetY + graphHeight - (data.magicalMitigation / maxScale.value) * graphHeight
    points.push(`L ${x} ${y}`)
  }

  // 終了点（右下→左下で閉じる）
  const lastX = uiStore.timeToPixel(mitigationData.value[mitigationData.value.length - 1].time)
  points.push(`L ${lastX} ${offsetY + graphHeight}`)
  points.push('Z')

  return points.join(' ')
})

// 無敵時間帯のハイライトパス
const invinciblePaths = computed(() => {
  const paths: { start: number; end: number }[] = []
  let currentStart: number | null = null

  for (let i = 0; i < mitigationData.value.length; i++) {
    const data = mitigationData.value[i]

    if (data.isInvincible) {
      if (currentStart === null) {
        currentStart = data.time
      }
    } else {
      if (currentStart !== null) {
        paths.push({ start: currentStart, end: mitigationData.value[i - 1].time })
        currentStart = null
      }
    }
  }

  // 最後まで無敵の場合
  if (currentStart !== null && mitigationData.value.length > 0) {
    paths.push({ start: currentStart, end: mitigationData.value[mitigationData.value.length - 1].time })
  }

  return paths
})

// マウスハンドラー
function handleMouseMove(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const x = e.clientX - rect.left

  // X座標から時間を計算
  const time = Math.round(uiStore.pixelToTime(x))

  // その時間の軽減率を取得
  const data = mitigationData.value.find(d => d.time === time)
  if (data) {
    showTooltip.value = true
    tooltipPosition.value = { x: e.clientX, y: e.clientY }
    tooltipData.value = {
      physical: data.physicalMitigation,
      magical: data.magicalMitigation,
      time,
      invincible: data.isInvincible
    }
  }
}

function handleMouseLeave() {
  showTooltip.value = false
}
</script>

<template>
  <div>
    <svg
      :width="width"
      :height="totalHeight"
      class="absolute top-0 left-0 cursor-crosshair"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <!-- 物理軽減グラフの補助線 -->
      <g v-for="percentage in gridLines" :key="`physical-${percentage}`">
        <line
          :x1="0"
          :y1="graphHeight - (percentage / maxScale) * graphHeight"
          :x2="width"
          :y2="graphHeight - (percentage / maxScale) * graphHeight"
          stroke="rgba(255, 255, 255, 0.1)"
          stroke-width="1"
          stroke-dasharray="2,2"
        />
        <text
          :x="width - 30"
          :y="graphHeight - (percentage / maxScale) * graphHeight - 2"
          fill="#60A5FA"
          font-size="9"
          opacity="0.7"
        >
          {{ percentage }}%
        </text>
      </g>

      <!-- 魔法軽減グラフの補助線 -->
      <g v-for="percentage in gridLines" :key="`magical-${percentage}`">
        <line
          :x1="0"
          :y1="graphHeight + 2 + graphHeight - (percentage / maxScale) * graphHeight"
          :x2="width"
          :y2="graphHeight + 2 + graphHeight - (percentage / maxScale) * graphHeight"
          stroke="rgba(255, 255, 255, 0.1)"
          stroke-width="1"
          stroke-dasharray="2,2"
        />
        <text
          :x="width - 30"
          :y="graphHeight + 2 + graphHeight - (percentage / maxScale) * graphHeight - 2"
          fill="#C084FC"
          font-size="9"
          opacity="0.7"
        >
          {{ percentage }}%
        </text>
      </g>

      <!-- 物理軽減グラフ（青系） -->
      <path
        :d="physicalPath"
        fill="rgba(59, 130, 246, 0.3)"
        stroke="rgba(59, 130, 246, 0.6)"
        stroke-width="1"
      />

      <!-- 魔法軽減グラフ（紫系） -->
      <path
        :d="magicalPath"
        fill="rgba(168, 85, 247, 0.3)"
        stroke="rgba(168, 85, 247, 0.6)"
        stroke-width="1"
      />

      <!-- 無敵時間帯のハイライト（全体に金色の帯） -->
      <rect
        v-for="(path, index) in invinciblePaths"
        :key="`invincible-${index}`"
        :x="uiStore.timeToPixel(path.start)"
        :y="0"
        :width="uiStore.timeToPixel(path.end - path.start)"
        :height="totalHeight"
        fill="rgba(234, 179, 8, 0.2)"
        stroke="rgba(234, 179, 8, 0.8)"
        stroke-width="2"
      />

      <!-- ラベル -->
      <text x="4" y="12" fill="#60A5FA" font-size="10" font-weight="bold">物理</text>
      <text x="4" :y="graphHeight + 14" fill="#C084FC" font-size="10" font-weight="bold">魔法</text>
    </svg>

    <!-- ツールチップ -->
    <Teleport to="body">
      <div
        v-if="showTooltip"
        class="fixed z-50 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white pointer-events-none"
        :style="{
          left: `${tooltipPosition.x + 10}px`,
          top: `${tooltipPosition.y + 10}px`
        }"
      >
        <div class="font-semibold mb-1">{{ Math.floor(tooltipData.time / 60) }}:{{ String(tooltipData.time % 60).padStart(2, '0') }}</div>
        <template v-if="tooltipData.invincible">
          <div class="text-yellow-400 font-bold">⭐ 無敵</div>
        </template>
        <template v-else>
          <div class="text-blue-400">物理軽減: {{ tooltipData.physical }}%</div>
          <div class="text-purple-400">魔法軽減: {{ tooltipData.magical }}%</div>
        </template>
      </div>
    </Teleport>
  </div>
</template>
