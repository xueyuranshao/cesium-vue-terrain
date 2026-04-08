export type OceanCurrentOptions = {
  particlesTextureSize: number
  particleHeight: number
  lineWidth: number
  lineLength: {
    min: number
    max: number
  }
  speedFactor: number
  dropRate: number
  dropRateBump: number
  flipY: boolean
}

export const defaultOceanCurrentOptions: OceanCurrentOptions = {
  particlesTextureSize: 180,
  particleHeight: 10000,
  lineWidth: 4.0,
  lineLength: { min: 100, max: 220 },
  speedFactor: 1.3,
  dropRate: 0.002,
  dropRateBump: 0.006,
  flipY: false,
}

export const OCEAN_CURRENT_COLORS = ['#9be7ff', '#4fd7ff', '#18f0ff', '#78ff8a', '#fff36b']

export const OCEAN_CURRENT_LEGEND_ITEMS = [
  { label: '低速', color: '#9be7ff' },
  { label: '较低', color: '#4fd7ff' },
  { label: '中速', color: '#18f0ff' },
  { label: '较高', color: '#78ff8a' },
  { label: '高速', color: '#fff36b' },
]




export type OceanCurrentPickInfo = {
  lon: number
  lat: number
  u: number
  v: number
  speed: number
}
