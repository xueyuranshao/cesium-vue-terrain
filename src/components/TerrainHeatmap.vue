<template>
  <div class="page">
    <div ref="cesiumContainer" class="cesium-container"></div>
    <div class="toolbar">
      <button class="toolbar-button" @click="toggleHeatmap">
        {{ heatmapEnabled ? '清除地形热力' : '加载地形热力' }}
      </button>
      <button class="toolbar-button" @click="toggleOceanCurrent">
        {{ oceanCurrentEnabled ? '清除洋流' : '加载洋流' }}
      </button>
    </div>
    <OceanCurrentLayer
      :viewer="cesiumViewer"
      :enabled="oceanCurrentEnabled"
      :options="oceanCurrentOptions"
      @pick="oceanCurrentPickInfo = $event"
    />
    <OceanCurrentControls v-if="oceanCurrentEnabled" v-model="oceanCurrentOptions" />
    <OceanCurrentLegend v-if="oceanCurrentEnabled" />
    <OceanCurrentInfo
      v-if="oceanCurrentEnabled"
      :info="oceanCurrentPickInfo"
      @close="oceanCurrentPickInfo = null"
    />
    <Legend v-if="heatmapEnabled" :items="legendItems" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import * as Cesium from 'cesium'
import Legend from './Legend.vue'
import OceanCurrentLayer from './OceanCurrentLayer.vue'
import OceanCurrentControls from './OceanCurrentControls.vue'
import OceanCurrentLegend from './OceanCurrentLegend.vue'
import OceanCurrentInfo from './OceanCurrentInfo.vue'
import { defaultOceanCurrentOptions, type OceanCurrentOptions, type OceanCurrentPickInfo } from './oceanCurrentOptions'

defineOptions({
  name: 'TerrainHeatmap',
})

type ElevationLevel = {
  max: number
  color: string
}

type LegendItem = {
  label: string
  color: string
}

const cesiumContainer = ref<HTMLDivElement | null>(null)
const heatmapEnabled = ref(false)
const oceanCurrentEnabled = ref(false)
const cesiumViewer = shallowRef<Cesium.Viewer | null>(null)
const oceanCurrentOptions = ref<OceanCurrentOptions>({
  ...defaultOceanCurrentOptions,
  lineLength: { ...defaultOceanCurrentOptions.lineLength },
})
const oceanCurrentPickInfo = ref<OceanCurrentPickInfo | null>(null)

let viewer: Cesium.Viewer | undefined
let removeCameraChangedListener: (() => void) | undefined
let rampOnlyMaterial: Cesium.Material | undefined
let contourMaterial: Cesium.Material | undefined
let contourModeActive: boolean | undefined
let terrainReadyPromise: Promise<void> | undefined

const CONTOUR_ENABLE_HEIGHT = 10000

// Focus the ramp on low-to-mid elevations so Taishan-area terrain can reach warm colors.
const ELEVATION_MIN = -500
const ELEVATION_MAX = 3000
const TRANSITION_BAND_METERS = 40
const COLOR_RAMP_WIDTH = 1024

const ELEVATION_LEVELS: ElevationLevel[] = [
  { max: 0, color: '#0A2EFF' },
  { max: 25, color: '#123BFF' },
  { max: 55, color: '#1A4CFF' },
  { max: 90, color: '#235EFF' },
  { max: 135, color: '#2B72FF' },
  { max: 190, color: '#3387FF' },
  { max: 260, color: '#399DF8' },
  { max: 350, color: '#3DB4EC' },
  { max: 470, color: '#40C8D6' },
  { max: 620, color: '#4FD7B1' },
  { max: 780, color: '#72DE84' },
  { max: 960, color: '#A5E05A' },
  { max: 1180, color: '#D2DE3E' },
  { max: 1450, color: '#F4D538' },
  { max: 1750, color: '#FFC12F' },
  { max: 2100, color: '#FFA12A' },
  { max: 2450, color: '#FF7A25' },
  { max: 2750, color: '#EE5327' },
  { max: 3000, color: '#D63334' },
]

const legendItems: LegendItem[] = ELEVATION_LEVELS.map((level, index) => {
  const min = index === 0 ? ELEVATION_MIN : ELEVATION_LEVELS[index - 1].max
  return {
    label: `${min} ~ ${level.max} 米`,
    color: level.color,
  }
})

Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMzAyOWRkMC0yZTYzLTQ4MGUtYjZjOS01OGYxMWNiYjdkZTUiLCJpZCI6MjYwMDksImlhdCI6MTY4MTI4NTU0OH0.wqUTCipHUKtYVebMivbdMOKAMG7rryaA2qkRn7DskAw'

const ARCGIS_WORLD_IMAGERY_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'

// const tdtToken =
//   import.meta.env.VITE_TDT_TOKEN ?? '4d70726a7e94dc03d2c45f02bea49027'

const TAISHAN_VIEW = {
  lon: 117.1008,
  lat: 35.9906,
  height: 20000,
}

const OCEAN_CURRENT_VIEW = {
  lon: 103.7468,
  lat: 0.5258,
  height: 1800000,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeHeight(height: number) {
  return clamp((height - ELEVATION_MIN) / (ELEVATION_MAX - ELEVATION_MIN), 0, 1)
}

function createArcgisImageryProvider() {
  return Cesium.ArcGisMapServerImageryProvider.fromUrl(
    ARCGIS_WORLD_IMAGERY_URL,
  )
}

// function createTdtImgProvider() {
//   return new Cesium.UrlTemplateImageryProvider({
//     url:
//       'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=' +
//       tdtToken,
//     subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
//     tilingScheme: new Cesium.WebMercatorTilingScheme(),
//     minimumLevel: 1,
//     maximumLevel: 18,
//   })
// }

function createColorRampImage() {
  const canvas = document.createElement('canvas')
  canvas.width = COLOR_RAMP_WIDTH
  canvas.height = 1

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create 2D context for elevation color ramp.')
  }

  const gradient = ctx.createLinearGradient(0, 0, COLOR_RAMP_WIDTH, 0)
  gradient.addColorStop(0, ELEVATION_LEVELS[0].color)

  const bandNormalized = TRANSITION_BAND_METERS / (ELEVATION_MAX - ELEVATION_MIN)

  for (let i = 0; i < ELEVATION_LEVELS.length - 1; i += 1) {
    const boundaryHeight = ELEVATION_LEVELS[i].max
    const t = normalizeHeight(boundaryHeight)
    const left = clamp(t - bandNormalized, 0, 1)
    const right = clamp(t + bandNormalized, 0, 1)

    gradient.addColorStop(left, ELEVATION_LEVELS[i].color)
    gradient.addColorStop(right, ELEVATION_LEVELS[i + 1].color)
  }

  gradient.addColorStop(1, ELEVATION_LEVELS[ELEVATION_LEVELS.length - 1].color)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, COLOR_RAMP_WIDTH, 1)

  return canvas.toDataURL('image/png')
}

function getRampOnlyMaterial() {
  if (rampOnlyMaterial) {
    return rampOnlyMaterial
  }

  rampOnlyMaterial = new Cesium.Material({
    fabric: {
      type: 'ElevationRamp',
      uniforms: {
        image: createColorRampImage(),
        minimumHeight: ELEVATION_MIN,
        maximumHeight: ELEVATION_MAX,
      },
    },
  })

  return rampOnlyMaterial
}

function getContourMaterial() {
  if (contourMaterial) {
    return contourMaterial
  }

  contourMaterial = new Cesium.Material({
    fabric: {
      type: 'ElevationColorContour',
      materials: {
        rampMaterial: {
          type: 'ElevationRamp',
          uniforms: {
            image: createColorRampImage(),
            minimumHeight: ELEVATION_MIN,
            maximumHeight: ELEVATION_MAX,
          },
        },
        contourMaterial: {
          type: 'ElevationContour',
          uniforms: {
            spacing: 140.0,
            width: 1.0,
            color: Cesium.Color.WHITE.withAlpha(0.45),
          },
        },
      },
      components: {
        diffuse:
          'mix(rampMaterial.diffuse, contourMaterial.diffuse, contourMaterial.alpha)',
        alpha: 'max(rampMaterial.alpha, contourMaterial.alpha)',
      },
    },
  })

  return contourMaterial
}

function getCameraHeight() {
  if (!viewer) {
    return Number.POSITIVE_INFINITY
  }

  const cartographic = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC)
  return cartographic.height
}

function updateHeatmapMaterialByCameraHeight(force = false) {
  if (!viewer || !heatmapEnabled.value) {
    return
  }

  const useContour = getCameraHeight() <= CONTOUR_ENABLE_HEIGHT
  if (!force && contourModeActive === useContour) {
    return
  }

  viewer.scene.globe.material = useContour
    ? getContourMaterial()
    : getRampOnlyMaterial()
  contourModeActive = useContour
}

function applyHeatmap(enabled: boolean) {
  if (!viewer) {
    return
  }

  heatmapEnabled.value = enabled

  if (enabled) {
    updateHeatmapMaterialByCameraHeight(true)
  } else {
    viewer.scene.globe.material = undefined
    contourModeActive = undefined
  }

  viewer.scene.globe.enableLighting = !enabled
}

function flyToTaishanView() {
  if (!viewer) {
    return
  }

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      TAISHAN_VIEW.lon,
      TAISHAN_VIEW.lat,
      TAISHAN_VIEW.height,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-30.0),
      roll: 0.0,
    },
    duration: 1.5,
  })
}

function flyToOceanCurrentView() {
  if (!viewer) {
    return
  }

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      OCEAN_CURRENT_VIEW.lon,
      OCEAN_CURRENT_VIEW.lat,
      OCEAN_CURRENT_VIEW.height,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-90.0),
      roll: 0.0,
    },
    duration: 1.5,
  })
}

async function toggleHeatmap() {
  if (!viewer) {
    return
  }

  if (heatmapEnabled.value) {
    applyHeatmap(false)
    return
  }

  await initTerrain()
  applyHeatmap(true)
  flyToTaishanView()
}

function toggleOceanCurrent() {
  oceanCurrentEnabled.value = !oceanCurrentEnabled.value

  if (oceanCurrentEnabled.value) {
    flyToOceanCurrentView()
  }
}

async function loadArcgisImagery() {
  if (!viewer) {
    return
  }

  const imgProvider = await createArcgisImageryProvider()
  imgProvider.errorEvent.addEventListener((error) => {
    console.error('ArcGIS imagery layer error:', error)
  })

  const layers = viewer.imageryLayers
  layers.removeAll()
  layers.addImageryProvider(imgProvider, 0)
}

// function loadTdtImagery() {
//   if (!viewer) {
//     return
//   }
//
//   const imgProvider = createTdtImgProvider()
//   imgProvider.errorEvent.addEventListener((error) => {
//     console.error('TDT img layer error:', error)
//   })
//
//   const layers = viewer.imageryLayers
//   layers.removeAll()
//   layers.addImageryProvider(imgProvider, 0)
// }

async function initTerrain() {
  if (!viewer) {
    return
  }

  if (!terrainReadyPromise) {
    terrainReadyPromise = Cesium.createWorldTerrainAsync().then((terrainProvider) => {
      if (!viewer) {
        return
      }

      viewer.terrainProvider = terrainProvider
      viewer.scene.globe.showSkirts = true
      viewer.scene.globe.maximumScreenSpaceError = 0.2
      viewer.scene.globe.depthTestAgainstTerrain = true
    })
  }

  await terrainReadyPromise
}

onMounted(async () => {
  if (!cesiumContainer.value) {
    return
  }

  viewer = new Cesium.Viewer(cesiumContainer.value, {
    baseLayerPicker: false,
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    contextOptions: {
      requestWebgl1: false,
    },
  });

  cesiumViewer.value = viewer

  ;(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'

  viewer.scene.renderError.addEventListener((_, error) => {
    console.error('Cesium render error:', error)
  })

  viewer.camera.percentageChanged = 0.02
  removeCameraChangedListener = viewer.camera.changed.addEventListener(() => {
    updateHeatmapMaterialByCameraHeight(false)
  })

  await loadArcgisImagery()

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(105.0, 35.0, 24000000),
  })
})

onBeforeUnmount(() => {

  if (removeCameraChangedListener) {
    removeCameraChangedListener()
    removeCameraChangedListener = undefined
  }

  if (viewer) {
    viewer.destroy()
    viewer = undefined
    cesiumViewer.value = null
  }

  rampOnlyMaterial = undefined
  contourMaterial = undefined
  contourModeActive = undefined
  terrainReadyPromise = undefined
})
</script>

<style scoped>
.page {
  position: relative;
  width: 100%;
  height: 100%;
}

.cesium-container {
  width: 100%;
  height: 100%;
}

.toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar-button {
  border: 0;
  border-radius: 6px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.toolbar-button:hover {
  background: rgba(0, 0, 0, 0.8);
}
</style>






