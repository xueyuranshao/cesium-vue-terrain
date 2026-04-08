import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const cesiumBaseUrl = 'cesium'

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Workers', dest: cesiumBaseUrl },
        { src: 'node_modules/cesium/Build/Cesium/Assets', dest: cesiumBaseUrl },
        { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: cesiumBaseUrl },
        { src: 'node_modules/cesium/Build/Cesium/ThirdParty', dest: cesiumBaseUrl },
      ],
    }),
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
  },
})
