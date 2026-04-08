<template>
  <aside v-if="info" class="ocean-current-info">
    <header class="info-header">
      <strong>洋流属性</strong>
      <button type="button" aria-label="关闭洋流属性" @click="$emit('close')">×</button>
    </header>
    <dl>
      <div>
        <dt>经度</dt>
        <dd>{{ info.lon.toFixed(4) }}°</dd>
      </div>
      <div>
        <dt>纬度</dt>
        <dd>{{ info.lat.toFixed(4) }}°</dd>
      </div>
      <div>
        <dt>风速</dt>
        <dd>{{ info.speed.toFixed(2) }} m/s</dd>
      </div>
      <div>
        <dt>U 分量</dt>
        <dd>{{ info.u.toFixed(2) }} m/s</dd>
      </div>
      <div>
        <dt>V 分量</dt>
        <dd>{{ info.v.toFixed(2) }} m/s</dd>
      </div>
    </dl>
  </aside>
</template>

<script setup lang="ts">
import type { OceanCurrentPickInfo } from './oceanCurrentOptions'

defineOptions({
  name: 'OceanCurrentInfo',
})

defineProps<{
  info: OceanCurrentPickInfo | null
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.ocean-current-info {
  position: absolute;
  left: 16px;
  top: 176px;
  z-index: 10;
  width: 260px;
  box-sizing: border-box;
  border-radius: 10px;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.64);
  color: #fff;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(10px);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
}

.info-header button {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

dl {
  display: grid;
  gap: 8px;
  margin: 12px 0 0;
}

dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

dt {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

dd {
  margin: 0;
  color: #9be7ff;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 760px) {
  .ocean-current-info {
    top: auto;
    bottom: calc(42vh + 196px);
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>



