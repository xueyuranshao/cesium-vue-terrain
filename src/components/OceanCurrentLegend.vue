<template>
  <aside class="ocean-current-legend" aria-label="洋流速度图例">
    <h3 class="legend-title">洋流速度</h3>
    <div
      class="legend-gradient"
      :style="{ background: `linear-gradient(90deg, ${OCEAN_CURRENT_COLORS.join(', ')})` }"
      aria-hidden="true"
    ></div>
    <div class="legend-scale">
      <span>低</span>
      <span>高</span>
    </div>
    <ul class="legend-list">
      <li v-for="item in OCEAN_CURRENT_LEGEND_ITEMS" :key="item.label" class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: item.color }"></span>
        <span>{{ item.label }}</span>
      </li>
    </ul>
    <p class="legend-note">颜色表示流速强弱，亮色代表更快流速。</p>
  </aside>
</template>

<script setup lang="ts">
import { OCEAN_CURRENT_COLORS, OCEAN_CURRENT_LEGEND_ITEMS } from './oceanCurrentOptions'

defineOptions({
  name: 'OceanCurrentLegend',
})
</script>

<style scoped>
.ocean-current-legend {
  position: absolute;
  right: 16px;
  bottom: 44px;
  z-index: 10;
  width: 320px;
  border-radius: 10px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.64);
  color: #fff;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
}

.legend-title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
}

.legend-gradient {
  height: 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.36);
}

.legend-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
}

.legend-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.legend-item {
  display: grid;
  gap: 4px;
  justify-items: center;
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
}

.legend-swatch {
  width: 28px;
  height: 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.legend-note {
  margin: 10px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  line-height: 1.45;
}

@media (max-width: 760px) {
  .ocean-current-legend {
    right: 12px;
    bottom: calc(42vh + 24px);
    width: auto;
  }
}
</style>


