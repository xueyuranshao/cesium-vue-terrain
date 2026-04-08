<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import * as Cesium from 'cesium'
import { WindLayer, type WindData, type WindLayerOptions } from 'cesium-wind-layer'
import { OCEAN_CURRENT_COLORS, defaultOceanCurrentOptions, type OceanCurrentOptions } from './oceanCurrentOptions'
import type { OceanCurrentPickInfo } from './oceanCurrentOptions'

defineOptions({
  name: 'OceanCurrentLayer',
})

const props = defineProps<{
  viewer: Cesium.Viewer | null
  enabled: boolean
  options: OceanCurrentOptions
}>()

const emit = defineEmits<{
  pick: [info: OceanCurrentPickInfo | null]
}>()

type RawWindJson = {
  bbox: [number, number, number, number]
  width: number
  height: number
  noDataValue?: number
  u: {
    array: number[]
    min?: number
    max?: number
  }
  v: {
    array: number[]
    min?: number
    max?: number
  }
}

const WIND_DATA_URL = '/json/wind.json'

let windLayer: WindLayer | undefined
let previousLogDepthBuffer: boolean | undefined
let loadToken = 0
let clickHandler: Cesium.ScreenSpaceEventHandler | undefined

function isValidValue(value: number, noDataValue?: number) {
  return Number.isFinite(value) && value !== noDataValue && Math.abs(value) < 1e10
}

function toWindData(raw: RawWindJson): WindData {
  const expectedLength = raw.width * raw.height
  if (raw.u.array.length !== expectedLength || raw.v.array.length !== expectedLength) {
    throw new Error(
      `Invalid wind data length: expected ${expectedLength}, got u=${raw.u.array.length}, v=${raw.v.array.length}`,
    )
  }

  const u = new Float32Array(expectedLength)
  const v = new Float32Array(expectedLength)
  const speed = new Float32Array(expectedLength)

  let uMin = Number.POSITIVE_INFINITY
  let uMax = Number.NEGATIVE_INFINITY
  let vMin = Number.POSITIVE_INFINITY
  let vMax = Number.NEGATIVE_INFINITY
  let speedMin = Number.POSITIVE_INFINITY
  let speedMax = Number.NEGATIVE_INFINITY

  for (let i = 0; i < expectedLength; i += 1) {
    const uu = raw.u.array[i]
    const vv = raw.v.array[i]
    const valid = isValidValue(uu, raw.noDataValue) && isValidValue(vv, raw.noDataValue)

    u[i] = valid ? uu : 0
    v[i] = valid ? vv : 0

    const currentSpeed = valid ? Math.sqrt(uu * uu + vv * vv) : 0
    speed[i] = currentSpeed

    if (valid) {
      uMin = Math.min(uMin, uu)
      uMax = Math.max(uMax, uu)
      vMin = Math.min(vMin, vv)
      vMax = Math.max(vMax, vv)
      speedMin = Math.min(speedMin, currentSpeed)
      speedMax = Math.max(speedMax, currentSpeed)
    }
  }

  const [west, south, east, north] = raw.bbox

  return {
    u: {
      array: u,
      min: raw.u.min ?? uMin,
      max: raw.u.max ?? uMax,
    },
    v: {
      array: v,
      min: raw.v.min ?? vMin,
      max: raw.v.max ?? vMax,
    },
    speed: {
      array: speed,
      min: Number.isFinite(speedMin) ? speedMin : 0,
      max: Number.isFinite(speedMax) ? speedMax : 1,
    },
    width: raw.width,
    height: raw.height,
    bounds: {
      west,
      south,
      east,
      north,
    },
  }
}

async function loadWindData() {
  const response = await fetch(WIND_DATA_URL)
  if (!response.ok) {
    throw new Error(`Failed to load wind data: ${response.status} ${response.statusText}`)
  }

  return toWindData((await response.json()) as RawWindJson)
}

function getClickLonLat(viewer: Cesium.Viewer, position: Cesium.Cartesian2) {
  const cartesian = viewer.scene.pickPositionSupported
    ? viewer.scene.pickPosition(position)
    : undefined

  const globeCartesian = cartesian ?? viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid)
  if (!globeCartesian) {
    return undefined
  }

  const cartographic = Cesium.Cartographic.fromCartesian(globeCartesian)
  return {
    lon: Cesium.Math.toDegrees(cartographic.longitude),
    lat: Cesium.Math.toDegrees(cartographic.latitude),
  }
}

function setupClickHandler(viewer: Cesium.Viewer) {
  if (clickHandler) {
    clickHandler.destroy()
  }

  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    if (!windLayer || windLayer.isDestroyed()) {
      emit('pick', null)
      return
    }

    const lonLat = getClickLonLat(viewer, event.position)
    if (!lonLat) {
      emit('pick', null)
      return
    }

    const data = windLayer.getDataAtLonLat(lonLat.lon, lonLat.lat)
    if (!data) {
      emit('pick', null)
      return
    }

    emit('pick', {
      lon: lonLat.lon,
      lat: lonLat.lat,
      u: data.interpolated.u,
      v: data.interpolated.v,
      speed: data.interpolated.speed,
    })
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

function removeClickHandler() {
  if (clickHandler) {
    clickHandler.destroy()
    clickHandler = undefined
  }
}

function isWebgl2Viewer(viewer: Cesium.Viewer) {
  const scene = viewer.scene as unknown as {
    context?: { webgl2?: boolean }
    _context?: { webgl2?: boolean }
  }
  return Boolean((scene.context ?? scene._context)?.webgl2)
}

function toWindLayerOptions(maxSpeed: number): Partial<WindLayerOptions> {
  const options = props.options ?? defaultOceanCurrentOptions

  return {
    particlesTextureSize: options.particlesTextureSize,
    particleHeight: options.particleHeight,
    lineWidth: options.lineWidth,
    lineLength: options.lineLength,
    speedFactor: options.speedFactor,
    dropRate: options.dropRate,
    dropRateBump: options.dropRateBump,
    colors: OCEAN_CURRENT_COLORS,
    flipY: options.flipY,
    useViewerBounds: false,
    domain: { min: 0, max: maxSpeed },
    displayRange: { min: 0, max: maxSpeed },
    dynamic: true,
  }
}

async function createLayer(viewer: Cesium.Viewer, token: number) {
  if (!isWebgl2Viewer(viewer)) {
    console.warn('cesium-wind-layer requires a WebGL2 Cesium context.')
    return
  }

  const windData = await loadWindData()
  if (token !== loadToken || !props.enabled || props.viewer !== viewer) {
    return
  }

  previousLogDepthBuffer = viewer.scene.logarithmicDepthBuffer
  viewer.scene.logarithmicDepthBuffer = false

  const maxSpeed = windData.speed?.max ?? 1

  windLayer = new WindLayer(viewer, windData, toWindLayerOptions(maxSpeed))

  windLayer.show = true
  setupClickHandler(viewer)
  viewer.scene.requestRender()
}

function destroyLayer() {
  loadToken += 1
  removeClickHandler()
  emit('pick', null)


  if (windLayer && !windLayer.isDestroyed()) {
    windLayer.destroy()
  }

  windLayer = undefined

  if (props.viewer && previousLogDepthBuffer !== undefined) {
    props.viewer.scene.logarithmicDepthBuffer = previousLogDepthBuffer
  }

  previousLogDepthBuffer = undefined
}

watch(
  () => [props.viewer, props.enabled] as const,
  ([viewer, enabled]) => {
    destroyLayer()

    if (!viewer || !enabled) {
      return
    }

    const token = loadToken
    createLayer(viewer, token).catch((error) => {
      console.error('Failed to initialize ocean current layer:', error)
      destroyLayer()
    })
  },
  { immediate: true },
)

watch(
  () => props.options,
  () => {
    if (!windLayer || windLayer.isDestroyed()) {
      return
    }

    const maxSpeed = windLayer.windData.speed?.max ?? 1
    windLayer.updateOptions(toWindLayerOptions(maxSpeed))
    props.viewer?.scene.requestRender()
  },
  { deep: true },
)
onBeforeUnmount(() => {
  destroyLayer()
})
</script>







