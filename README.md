# Cesium Vue Terrain

基于 Vue 3、TypeScript、Vite 和 Cesium 的地形热力与洋流粒子可视化项目。

## 技术栈

| 类型 | 技术 | 版本 |
| --- | --- | --- |
| 前端框架 | Vue | ^3.5.32 |
| 开发语言 | TypeScript | ~6.0.2 |
| 构建工具 | Vite | ^8.0.4 |
| Vue 构建插件 | @vitejs/plugin-vue | ^6.0.5 |
| 3D GIS 引擎 | Cesium | ^1.123.0 |
| 洋流/风场粒子插件 | cesium-wind-layer | ^0.9.0 |
| Cesium 兼容依赖锁定 | @zip.js/zip.js | 2.7.34 |
| Cesium 静态资源拷贝 | vite-plugin-static-copy | ^3.1.4 |
| Vue 类型检查 | vue-tsc | ^3.2.6 |
| Vue TS 配置 | @vue/tsconfig | ^0.9.1 |
| Node 类型 | @types/node | ^24.12.2 |

## 已实现功能

### 基础地图

- 使用 Cesium 初始化三维地球场景。
- 默认仅加载 ArcGIS 全球影像服务：
  `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`
- 天地图影像加载代码已保留为注释，当前不启用。
- 初始视角为全球视角。
- 已关闭 Cesium 默认 `InfoBox` 和选中指示框 `selectionIndicator`。

### 地形热力

- 点击 `加载地形热力` 后懒加载 Cesium 全球地形。
- 加载地形热力后自动飞行到泰山视角。
- 点击 `清除地形热力` 后清除地形热力材质和图例。
- 地形热力采用蓝到红的海拔分级色带。
- 海拔分级采用低海拔更细、高海拔更疏的分段方式。
- 相机高度小于等于 `10000m` 时叠加等高线；更高视角仅显示热力色带。
- 地形热力图例已组件化为 `Legend.vue`，并与热力开关同步显隐。
- 图例文案已中文化，单位为“米”。

### 洋流粒子

- 点击 `加载洋流` 后启用 `cesium-wind-layer` 洋流粒子层。
- 点击 `清除洋流` 后销毁洋流图层、参数面板、图例和属性弹窗。
- 洋流数据从 `public/json/wind.json` 加载。
- 加载洋流后自动飞行到数据覆盖范围附近。
- 洋流粒子支持参数面板调节：
  - 粒子数量
  - 粒子高度
  - 流线宽度
  - 拖尾长度
  - 流速
  - 衰减率
  - 衰减增强
  - Y 轴翻转
- 洋流粒子默认参数：
  - 粒子数量：`180`
  - 粒子高度：`10000`
  - 流线宽度：`4.0`
  - 拖尾长度：`100 ~ 220`
  - 流速：`1.3`
  - 衰减率：`0.002`
  - 衰减增强：`0.006`
  - Y 轴翻转：`false`
- 洋流颜色使用低速到高速色带：浅蓝、青色、亮青、亮绿、亮黄。
- 洋流图例已组件化为 `OceanCurrentLegend.vue`，并与洋流开关同步显隐。
- 洋流参数面板已组件化为 `OceanCurrentControls.vue`，并与洋流开关同步显隐。
- 支持点击洋流粒子/流场位置获取属性：
  - 经度
  - 纬度
  - 风速
  - U 分量
  - V 分量
- 洋流属性弹窗已组件化为 `OceanCurrentInfo.vue`，显示在左侧。
- 清除洋流或组件卸载时会同步销毁点击事件处理器，避免残留事件。

## 主要目录结构

```text
src/
  App.vue
  main.ts
  components/
    TerrainHeatmap.vue
    Legend.vue
    OceanCurrentLayer.vue
    OceanCurrentControls.vue
    OceanCurrentLegend.vue
    OceanCurrentInfo.vue
    oceanCurrentOptions.ts
public/
  json/
    wind.json
```

## 构建配置

- `vite.config.ts` 通过 `vite-plugin-static-copy` 复制 Cesium 静态资源：
  - `Workers`
  - `Assets`
  - `Widgets`
  - `ThirdParty`
- 通过 `define` 设置：
  `CESIUM_BASE_URL = /cesium`
- 入口文件 `src/main.ts` 引入 Cesium Widgets 样式：
  `cesium/Build/Cesium/Widgets/widgets.css`

## 脚本命令

```bash
npm run dev
npm run build
npm run preview
```

## 当前构建状态

`npm run build` 已通过。

当前仅存在非阻塞构建警告：

- `protobufjs` 内部使用 `eval`。
- 打包后的主 chunk 体积较大。
