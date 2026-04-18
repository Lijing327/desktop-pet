import type { AppSettings } from '../shared/types'
import type { NotificationManager } from './notification-manager'
import type { AppStateManager } from './state-manager'

/**
 * 提醒调度器（MVP）
 * 支持：
 * 1. 番茄钟（工作 -> 休息 -> 工作循环）
 * 2. 喝水提醒（固定间隔）
 * 3. 久坐提醒（固定间隔）
 */
export class Scheduler {
  private _timers = new Map<string, ReturnType<typeof setTimeout>>()
  private _paused = false
  private _currentSettings: AppSettings | null = null
  private _pomodoroPhase: 'work' | 'break' = 'work'

  constructor(
    private readonly notifier: NotificationManager,
    private readonly stateManager: AppStateManager,
  ) {}

  apply(settings: AppSettings): void {
    this._currentSettings = settings
    this.clear()
    if (!this._paused) this._schedule(settings)
  }

  pause(): void {
    this._paused = true
    this.clear()
    this.stateManager.setState('idle')
  }

  resume(): void {
    this._paused = false
    if (this._currentSettings) this._schedule(this._currentSettings)
  }

  get isPaused(): boolean {
    return this._paused
  }

  clear(): void {
    this._timers.forEach((timer) => clearTimeout(timer))
    this._timers.clear()
  }

  private _schedule(settings: AppSettings): void {
    const reminders = settings.reminders

    if (reminders.pomodoroEnabled) {
      this._pomodoroPhase = 'work'
      this._schedulePomodoroCycle(reminders.pomodoroWorkMinutes, reminders.pomodoroBreakMinutes)
    } else {
      this.stateManager.setState('idle')
    }

    if (reminders.waterEnabled && reminders.waterIntervalMinutes > 0) {
      this._scheduleRecurring('water', reminders.waterIntervalMinutes, () => {
        this.notifier.fire('water')
        this.stateManager.setReminding(1200)
      })
    }

    if (reminders.sedentaryEnabled && reminders.sedentaryIntervalMinutes > 0) {
      this._scheduleRecurring('sedentary', reminders.sedentaryIntervalMinutes, () => {
        this.notifier.fire('sedentary')
        this.stateManager.setReminding(1200)
      })
    }
  }

  private _scheduleRecurring(key: string, intervalMinutes: number, callback: () => void): void {
    const ms = intervalMinutes * 60 * 1000
    const tick = (): void => {
      callback()
      if (this._paused) return
      const timer = setTimeout(tick, ms)
      this._timers.set(key, timer)
    }
    const timer = setTimeout(tick, ms)
    this._timers.set(key, timer)
  }

  private _schedulePomodoroCycle(workMinutes: number, breakMinutes: number): void {
    const scheduleWork = (): void => {
      this._pomodoroPhase = 'work'
      this.stateManager.setState('working')
      const timer = setTimeout(() => {
        this.notifier.fire('pomodoroWorkEnd')
        this.stateManager.setReminding(1400, 'resting')
        if (!this._paused) scheduleBreak()
      }, Math.max(1, workMinutes) * 60 * 1000)
      this._timers.set('pomodoro', timer)
    }

    const scheduleBreak = (): void => {
      this._pomodoroPhase = 'break'
      this.stateManager.setState('resting')
      const timer = setTimeout(() => {
        this.notifier.fire('pomodoroBreakEnd')
        this.stateManager.setReminding(1400, 'working')
        if (!this._paused) scheduleWork()
      }, Math.max(1, breakMinutes) * 60 * 1000)
      this._timers.set('pomodoro', timer)
    }

    scheduleWork()
  }
}
