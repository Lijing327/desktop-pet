import type { PetState, StateConfig, StateTransition } from './types'

/**
 * 宠物状态机
 *
 * 状态转移规则（权重随机）：
 *   idle  ──6─→ walk
 *         ──3─→ sleep
 *         ──1─→ happy（自发开心）
 *   walk  ──1─→ idle
 *   sleep ──1─→ idle
 *   happy ──1─→ idle（2s 后）
 *   remind──1─→ idle（3s 后）
 */
const CONFIG: Record<PetState, StateConfig> = {
  idle: {
    minDelay: 6_000,
    maxDelay: 18_000,
    transitions: [
      { to: 'walk',  weight: 6 },
      { to: 'sleep', weight: 3 },
      { to: 'happy', weight: 1 },
    ],
  },
  walk: {
    minDelay: 3_000,
    maxDelay: 8_000,
    transitions: [{ to: 'idle', weight: 1 }],
  },
  sleep: {
    minDelay: 8_000,
    maxDelay: 20_000,
    transitions: [{ to: 'idle', weight: 1 }],
  },
  happy: {
    minDelay: 2_000,
    maxDelay: 2_000,
    transitions: [{ to: 'idle', weight: 1 }],
  },
  remind: {
    minDelay: 3_000,
    maxDelay: 3_000,
    transitions: [{ to: 'idle', weight: 1 }],
  },
}

type StateListener = (state: PetState) => void

export class PetStateMachine {
  private _state: PetState = 'idle'
  private _timer: ReturnType<typeof setTimeout> | null = null
  private _listeners = new Set<StateListener>()

  get state(): PetState {
    return this._state
  }

  /** 订阅状态变化，返回取消订阅函数 */
  onChange(fn: StateListener): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  /** 跳转到指定状态并重新调度下一次转换 */
  transition(to: PetState): void {
    this._clearTimer()
    this._state = to
    this._listeners.forEach((fn) => fn(to))
    this._schedule()
  }

  /** 用户点击触发 — 不打断 remind 状态 */
  triggerClick(): void {
    if (this._state === 'remind') return
    this.transition('happy')
  }

  /** 提醒系统触发 */
  triggerRemind(): void {
    this.transition('remind')
  }

  /** 启动自动调度（实例创建后调用一次）*/
  start(): void {
    this._schedule()
  }

  destroy(): void {
    this._clearTimer()
    this._listeners.clear()
  }

  private _schedule(): void {
    const cfg = CONFIG[this._state]
    const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay)
    const next = this._pick(cfg.transitions)
    this._timer = setTimeout(() => this.transition(next), delay)
  }

  private _clearTimer(): void {
    if (this._timer) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  /** 按权重随机选择下一个状态 */
  private _pick(transitions: StateTransition[]): PetState {
    const total = transitions.reduce((s, t) => s + t.weight, 0)
    let r = Math.random() * total
    for (const t of transitions) {
      r -= t.weight
      if (r <= 0) return t.to
    }
    return transitions[0].to
  }
}
