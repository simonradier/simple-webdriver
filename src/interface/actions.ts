export type PointerType = 'mouse' | 'pen' | 'touch'

export interface ActionItem {
  type: string
  duration?: number
  value?: string
  button?: number
  x?: number
  y?: number
  width?: number
  height?: number
  pressure?: number
  tangentialPressure?: number
  tiltX?: number
  tiltY?: number
  twist?: number
  altitudeAngle?: number
  azimuthAngle?: number
  origin?: string | object
  deltaX?: number
  deltaY?: number
}

export interface ActionSequence {
  type: 'none' | 'key' | 'pointer' | 'wheel'
  id: string
  parameters?: {
    pointerType?: PointerType
  }
  actions: ActionItem[]
}
