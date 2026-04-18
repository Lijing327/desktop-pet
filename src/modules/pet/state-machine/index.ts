import type { PetState } from '@/types'

/** react 动画持续时长（ms）：缩短以提升反馈节奏 */
const REACT_DURATION = 420
/** remind 提醒态持续时长（ms） */
const REMIND_DURATION = 3000
/** sleep 最小持续时长（ms），避免刚入睡就被打断 */
const SLEEP_MIN_DURATION = 3800
/** 无交互达到该阈值后开始有概率入睡（ms） */
const SLEEP_IDLE_THRESHOLD = 25000
/** 从起始阈值到最大概率的爬升窗口（ms） */
const SLEEP_IDLE_RAMP = 65000

type StateListener = (state: PetState) => void

/**
 * 桌宠状态机（事件驱动）
 * 优先级：drag > react > remind > follow/wait > idle/sleep
 */
export class PetStateMachine {
  private _state: PetState = 'idle'
  /** react/remind 结束后的回落状态 */
  private _returnState: PetState = 'idle'
  private _reactTimer: ReturnType<typeof setTimeout> | null = null
  private _remindTimer: ReturnType<typeof setTimeout> | null = null
  private _sleepEnteredAt = 0
  private _listeners = new Set<StateListener>()

  get state(): PetState {
    return this._state
  }

  /** 订阅状态变化 */
  onChange(fn: StateListener): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  /** 外部命令切换（托盘 / IPC） */
  command(to: PetState): void {
    if (this._state === 'drag') return
    if (this._state === 'sleep' && to !== 'sleep' && !this._canExitSleep()) return
    this._transition(to)
  }

  /** 用户点击：sleep 唤醒先回 idle；其它状态触发 react */
  triggerClick(): void {
    if (this._state === 'drag') return
    if (this._state === 'react' || this._state === 'remind') return

    if (this._state === 'sleep') {
      if (!this._canExitSleep()) return
      this._transition('idle')
      return
    }

    // follow / wait 的反馈结束后优先回 idle
    this._returnState = (this._state === 'follow' || this._state === 'wait') ? 'idle' : this._state
    this._clearTimers()
    this._state = 'react'
    this._emit()
    this._reactTimer = setTimeout(() => this._transition(this._returnState), REACT_DURATION)
  }

  /** 鼠标靠近触发：优先给短 react 反馈 */
  triggerProximity(): void {
    if (this._state === 'drag' || this._state === 'sleep') return
    if (this._state === 'react' || this._state === 'remind') return
    this._returnState = (this._state === 'follow' || this._state === 'wait') ? 'idle' : this._state
    this._clearTimers()
    this._state = 'react'
    this._emit()
    this._reactTimer = setTimeout(() => this._transition(this._returnState), REACT_DURATION)
  }

  /** 提醒触发：不打断 drag / sleep / follow / wait */
  triggerRemind(): void {
    if (['drag', 'sleep', 'follow', 'wait'].includes(this._state)) return
    this._returnState = this._state
    this._clearTimers()
    this._state = 'remind'
    this._emit()
    this._remindTimer = setTimeout(() => this._transition('idle'), REMIND_DURATION)
  }

  /** follow 到达目标后优先回 idle */
  onFollowArrived(): void {
    if (this._state === 'follow') this._transition('idle')
  }

  /** 拖拽开始 */
  onDragStart(): void {
    this._clearTimers()
    this._state = 'drag'
    this._emit()
  }

  /** 拖拽结束 */
  onDragEnd(): void {
    if (this._state === 'drag') this._transition('idle')
  }

  /**
   * 长时间无交互时尝试入睡：
   * - 仅 idle / wait 尝试
   * - 概率随无交互时长升高
   */
  maybeSleepByInactivity(inactiveMs: number): void {
    if (inactiveMs < SLEEP_IDLE_THRESHOLD) return
    if (this._state !== 'idle' && this._state !== 'wait') return

    const ratio = Math.min(1, (inactiveMs - SLEEP_IDLE_THRESHOLD) / SLEEP_IDLE_RAMP)
    const probability = 0.12 + ratio * 0.68
    if (Math.random() < probability) this._transition('sleep')
  }

  destroy(): void {
    this._clearTimers()
    this._listeners.clear()
  }

  private _transition(to: PetState): void {
    if (this._state === 'sleep' && to !== 'sleep' && !this._canExitSleep()) return
    if (this._state === 'sleep' && to !== 'sleep' && to !== 'idle') to = 'idle'
    this._clearTimers()
    this._state = to
    if (to === 'sleep') this._sleepEnteredAt = Date.now()
    this._emit()
  }

  private _emit(): void {
    this._listeners.forEach((fn) => fn(this._state))
  }

  private _clearTimers(): void {
    if (this._reactTimer) {
      clearTimeout(this._reactTimer)
      this._reactTimer = null
    }
    if (this._remindTimer) {
      clearTimeout(this._remindTimer)
      this._remindTimer = null
    }
  }

  private _canExitSleep(): boolean {
    if (this._state !== 'sleep') return true
    return Date.now() - this._sleepEnteredAt >= SLEEP_MIN_DURATION
  }
}
