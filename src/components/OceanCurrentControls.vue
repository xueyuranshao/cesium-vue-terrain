<template>
  <aside class="current-controls">
    <header class="panel-header">
      <strong>洋流参数控制</strong>
      <span class="panel-subtitle">{{ model.particlesTextureSize ** 2 }} 个粒子</span>
    </header>

    <label class="control-field">
      <span>粒子数量</span>
      <div class="range-row">
        <input
          :value="model.particlesTextureSize"
          type="range"
          min="32"
          max="400"
          step="1"
          @input="updateOption('particlesTextureSize', Number(($event.target as HTMLInputElement).value))"
        />
        <input
          :value="model.particlesTextureSize"
          type="number"
          min="32"
          max="400"
          step="1"
          @input="updateOption('particlesTextureSize', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </label>

    <label class="control-field">
      <span>粒子高度</span>
      <div class="range-row">
        <input
          :value="model.particleHeight"
          type="range"
          min="0"
          max="40000"
          step="100"
          @input="updateOption('particleHeight', Number(($event.target as HTMLInputElement).value))"
        />
        <input
          :value="model.particleHeight"
          type="number"
          min="0"
          max="40000"
          step="100"
          @input="updateOption('particleHeight', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </label>

    <label class="control-field">
      <span>流线宽度</span>
      <div class="range-row">
        <input
          :value="model.lineWidth"
          type="range"
          min="0.5"
          max="12"
          step="0.1"
          @input="updateOption('lineWidth', Number(($event.target as HTMLInputElement).value))"
        />
        <input
          :value="model.lineWidth"
          type="number"
          min="0.5"
          max="12"
          step="0.1"
          @input="updateOption('lineWidth', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </label>

    <section class="control-field">
      <span>拖尾长度范围</span>
      <div class="dual-row">
        <label>
          最小值
          <input
            :value="model.lineLength.min"
            type="number"
            min="10"
            max="600"
            step="5"
            @input="updateLineLength('min', Number(($event.target as HTMLInputElement).value))"
          />
        </label>
        <label>
          最大值
          <input
            :value="model.lineLength.max"
            type="number"
            min="20"
            max="1000"
            step="5"
            @input="updateLineLength('max', Number(($event.target as HTMLInputElement).value))"
          />
        </label>
      </div>
    </section>

    <label class="control-field">
      <span>流动速度</span>
      <div class="range-row">
        <input
          :value="model.speedFactor"
          type="range"
          min="0.1"
          max="8"
          step="0.1"
          @input="updateOption('speedFactor', Number(($event.target as HTMLInputElement).value))"
        />
        <input
          :value="model.speedFactor"
          type="number"
          min="0.1"
          max="8"
          step="0.1"
          @input="updateOption('speedFactor', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </label>

    <label class="control-field">
      <span>粒子重置率</span>
      <div class="range-row">
        <input
          :value="model.dropRate"
          type="range"
          min="0"
          max="0.04"
          step="0.001"
          @input="updateOption('dropRate', Number(($event.target as HTMLInputElement).value))"
        />
        <input
          :value="model.dropRate"
          type="number"
          min="0"
          max="0.04"
          step="0.001"
          @input="updateOption('dropRate', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
    </label>

    <label class="control-field checkbox-field">
      <input
        :checked="model.flipY"
        type="checkbox"
        @change="updateOption('flipY', ($event.target as HTMLInputElement).checked)"
      />
      <span>Y 轴翻转</span>
    </label>
  </aside>
</template>

<script setup lang="ts">
import type { OceanCurrentOptions } from './oceanCurrentOptions'

defineOptions({
  name: 'OceanCurrentControls',
})

const model = defineModel<OceanCurrentOptions>({ required: true })

function updateOption<K extends keyof OceanCurrentOptions>(key: K, value: OceanCurrentOptions[K]) {
  model.value = {
    ...model.value,
    [key]: value,
  }
}

function updateLineLength(key: 'min' | 'max', value: number) {
  model.value = {
    ...model.value,
    lineLength: {
      ...model.value.lineLength,
      [key]: value,
    },
  }
}
</script>

<style scoped>
.current-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 320px;
  max-height: calc(100vh - 32px);
  overflow: auto;
  border-radius: 10px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.64);
  color: #fff;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.22);
}

.panel-subtitle {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.control-field {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
}

.range-row,
.dual-row {
  display: grid;
  grid-template-columns: 1fr 104px;
  gap: 12px;
  align-items: center;
}

.dual-row label {
  display: grid;
  gap: 6px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

input[type='range'] {
  width: 100%;
  accent-color: #9be7ff;
}

input[type='number'] {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 6px;
  padding: 7px 9px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font: inherit;
}

input[type='number']:focus {
  border-color: rgba(155, 231, 255, 0.78);
  outline: none;
  box-shadow: 0 0 0 2px rgba(155, 231, 255, 0.18);
}

.checkbox-field {
  grid-template-columns: auto 1fr;
  align-items: center;
}

.checkbox-field input {
  accent-color: #9be7ff;
}

@media (max-width: 760px) {
  .current-controls {
    top: auto;
    right: 12px;
    bottom: 12px;
    left: 12px;
    width: auto;
    max-height: 42vh;
  }
}
</style>




