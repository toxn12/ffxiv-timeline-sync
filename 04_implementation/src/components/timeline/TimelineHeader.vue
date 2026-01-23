<script setup lang="ts">
import PhaseRow from '@/components/timeline/PhaseRow.vue'
import TimeAxisRow from '@/components/timeline/TimeAxisRow.vue'
import GimmickRow from '@/components/timeline/GimmickRow.vue'
import MemoMarkerRow from '@/components/timeline/MemoMarkerRow.vue'
</script>

<template>
  <div class="sticky top-0 z-10 bg-gray-900">
    <PhaseRow />
    <TimeAxisRow />
    <GimmickRow />
    <MemoMarkerRow />
  </div>
</template>
