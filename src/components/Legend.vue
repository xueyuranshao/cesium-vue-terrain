<template>
  <aside class="legend" aria-label="海拔图例">
    <h3 class="legend-title">{{ title }}</h3>
    <ul class="legend-list">
      <li v-for="item in items" :key="item.label" class="legend-item">
        <span
          class="legend-swatch"
          :style="{ backgroundColor: item.color }"
          aria-hidden="true"
        ></span>
        <span class="legend-label">{{ item.label }}</span>
      </li>
    </ul>
  </aside>
</template>

<script setup lang="ts">
type LegendItem = {
  label: string
  color: string
}

withDefaults(
  defineProps<{
    title?: string
    items: LegendItem[]
  }>(),
  {
    title: '海拔高度（米）',
  },
)
</script>

<style scoped>
.legend {
  position: absolute;
  bottom: 44px;
  left: 16px;
  z-index: 10;
  width: 210px;
  max-height: min(70vh, 520px);
  overflow: auto;
  border-radius: 8px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.62);
  color: #fff;
}

.legend-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.legend-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-item + .legend-item {
  margin-top: 4px;
}

.legend-swatch {
  flex: 0 0 22px;
  width: 22px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.legend-label {
  font-size: 13px;
  line-height: 1.2;
}
</style>



