import type { PetState } from '@/types'

export type { PetState }

export interface StateTransition {
  to: PetState
  /** 相对权重 */
  weight: number
}

export interface StateConfig {
  /** 最短停留时间（ms）*/
  minDelay: number
  /** 最长停留时间（ms）*/
  maxDelay: number
  transitions: StateTransition[]
}
