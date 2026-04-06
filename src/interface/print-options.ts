export interface PrintOptionsDef {
  orientation?: 'portrait' | 'landscape'
  scale?: number
  background?: boolean
  page?: {
    width?: number
    height?: number
  }
  margin?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
  shrinkToFit?: boolean
  pageRanges?: string[]
}
