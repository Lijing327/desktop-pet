import type { PetState } from '@/types'

/** react / remind 动画持续时间（ms） */
const REACT_DURATION  = 700
const REMIND_DURATION = 3000

type StateListener = (state: PetState) => void

/**
 * 宠物状态机（事件驱动，无自动随机转换）
 *
 * 状态优先级：drag > react > remind > follow/wait > idle/sleep
 *
 * 外部命令（托盘 / IPC）→ command()
 * 用户点击               → triggerClick()
 * 提醒通知               → triggerRemind()
 * follow 到达目标        → onFollowArrived()
 * 拖拽开始/结束          → onDragStart() / onDragEnd()
 */
export class PetStateMachine {
  private _state: PetState = 'idle'
  /** react/remind 结束后回到的状态 */
  private _returnState: PetState = 'idle'
  private _reactTimer: ReturnType<typeof setTimeout> | null = null
  private _remindTimer: ReturnType<typeof setTimeout> | null = null
  private _listeners = new Set<StateListener>()

  get state(): PetState {
    return this._state
  }

  /** 订阅状态变化，返回取消订阅函数 */
  onChange(fn: StateListener): () => void {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  /** 外部命令切换状态（托盘菜单 / IPC 推送） */
  command(to: PetState): void {
    // drag 状态由拖拽逻辑独占，不允许外部命令覆盖
    if (this._state === 'drag') return
    this._transition(to)
  }

  /** 用户点击 */
  triggerClick(): void {
    if (this._state === 'drag') return
    if (this._state === 'react' || this._state === 'remind') return

    // 睡觉状态：点击唤醒
    if (this._state === 'sleep') {
      this._transition('idle')
      return
    }

    // 其他状态：播放 react 动画后回到当前状态
    this._returnState = this._state
    this._clearTimers()
    this._state = 'react'
    this._emit()
    this._reactTimer = setTimeout(() => this._transition(this._returnState), REACT_DURATION)
  }

  /** 提醒通知触发（不打断 drag / sleep / follow / wait） */
  triggerRemind(): void {
    if (['drag', 'sleep', 'follow', 'wait'].includes(this._state)) return
    this._returnState = this._state
    this._clearTimers()
    this._state = 'remind'
    this._emit()
    this._remindTimer = setTimeout(() => this._transition('idle'), REMIND_DURATION)
  }

  /** follow 模式到达目标后由 usePetBehavior 调用 */
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

  destroy(): void {
    this._clearTimers()
    this._listeners.clear()
  }

  private _transition(to: PetState): void {
    this._clearTimers()
    this._state = to
    this._emit()
  }

  private _emit(): void {
    this._listeners.forEach((fn) => fn(this._state))
  }

  private _clearTimers(): void {
    if (this._reactTimer)  { clearTimeout(this._reactTimer);  this._reactTimer  = null }
    if (this._remindTimer) { clearTimeout(this._remindTimer); this._remindTimer = null }
  }
}
