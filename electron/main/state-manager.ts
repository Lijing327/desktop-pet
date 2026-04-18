import type { AppState } from '../shared/types'

type Listener = (state: AppState) => void

/**
 * 基础状态系统管理器（MVP）
 * 职责：
 * 1. 统一维护当前产品状态
 * 2. 提供 reminding 临时态并自动回落
 * 3. 通过订阅机制通知主进程其它模块
 */
export class AppStateManager {
  private _state: AppState = 'idle'
  private _previous: AppState = 'idle'
  private _remindingTimer: ReturnType<typeof setTimeout> | null = null
  private _listeners = new Set<Listener>()

  get state(): AppState {
    return this._state
  }

  setState(next: AppState): void {
    if (this._state === next) return
    if (next !== 'reminding') this._previous = next
    this._state = next
    this._emit()
  }

  /** 进入短暂提醒态，结束后自动回落到指定状态或上一个状态 */
  setReminding(durationMs = 1600, fallback?: AppState): void {
    if (this._remindingTimer) clearTimeout(this._remindingTimer)
    const target = fallback ?? this._previous ?? 'idle'
    this._state = 'reminding'
    this._emit()
    this._remindingTimer = setTimeout(() => {
      this._state = target
      this._emit()
      this._remindingTimer = null
    }, durationMs)
  }

  onChange(listener: Listener): () => void {
    this._listeners.add(listener)
    return () => this._listeners.delete(listener)
  }

  dispose(): void {
    if (this._remindingTimer) clearTimeout(this._remindingTimer)
    this._listeners.clear()
  }

  private _emit(): void {
    this._listeners.forEach((listener) => listener(this._state))
  }
}
