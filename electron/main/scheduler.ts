import type { AppSettings, ReminderType } from '../shared/types'
import type { NotificationManager } from './notification-manager'

/**
 * 提醒调度器
 *
 * 支持三种提醒：
 *   - water：按分钟间隔循环（递归 setTimeout 实现，便于统一 clear）
 *   - offWork：每天固定时间触发一次，自动续期到次日
 *   - lunchBreak：同上，可单独开关
 *
 * 使用方式：
 *   const s = new Scheduler(notifier)
 *   s.apply(settings)      // 加载配置并启动
 *   s.pause() / s.resume() // 暂停/恢复（托盘菜单使用）
 *   s.clear()              // 全部清除（应用退出时调用）
 */
export class Scheduler {
  private _timers = new Map<ReminderType | 'water', ReturnType<typeof setTimeout>>()
  private _paused = false
  private _currentSettings: AppSettings | null = null

  constructor(private readonly notifier: NotificationManager) {}

  // ── 公开 API ────────────────────────────────────────────────────────────

  /** 加载新配置并重建所有调度（旧定时器会先全部清除）*/
  apply(settings: AppSettings): void {
    this._currentSettings = settings
    this.clear()
    if (!this._paused) this._schedule(settings)
  }

  /** 暂停全部提醒（托盘"暂停提醒"）*/
  pause(): void {
    this._paused = true
    this.clear()
  }

  /** 恢复提醒（托盘"恢复提醒"）*/
  resume(): void {
    this._paused = false
    if (this._currentSettings) this._schedule(this._currentSettings)
  }

  get isPaused(): boolean {
    return this._paused
  }

  /** 清除全部计时器（退出前调用）*/
  clear(): void {
    this._timers.forEach((t) => clearTimeout(t))
    this._timers.clear()
  }

  // ── 内部调度 ────────────────────────────────────────────────────────────

  private _schedule(s: AppSettings): void {
    const r = s.reminders

    if (r.waterEnabled && r.waterIntervalMinutes > 0) {
      this._scheduleWater(r.waterIntervalMinutes)
    }
    if (r.offWorkEnabled && r.offWorkTime) {
      this._scheduleTimeOfDay('offWork', r.offWorkTime)
    }
    if (r.lunchBreakEnabled && r.lunchBreakTime) {
      this._scheduleTimeOfDay('lunchBreak', r.lunchBreakTime)
    }
  }

  /** 喝水提醒：递归 setTimeout，首次在 intervalMinutes 后触发 */
  private _scheduleWater(intervalMinutes: number): void {
    const ms = intervalMinutes * 60 * 1000
    const tick = (): void => {
      this.notifier.fire('water')
      if (this._paused) return
      const t = setTimeout(tick, ms)
      this._timers.set('water', t)
    }
    const t = setTimeout(tick, ms)
    this._timers.set('water', t)
  }

  /**
   * 固定时间提醒：计算距下次触发的毫秒数
   * 若今日时间已过，自动延到明日同一时刻
   */
  private _scheduleTimeOfDay(type: 'offWork' | 'lunchBreak', timeStr: string): void {
    const ms = this._msUntilNext(timeStr)
    const t = setTimeout(() => {
      this.notifier.fire(type)
      if (this._paused) return
      // 触发后立即续期到明日（递归调度保证每天都能响应）
      this._scheduleTimeOfDay(type, timeStr)
    }, ms)
    this._timers.set(type, t)
  }

  /** 计算距下一次 HH:MM 的毫秒数（若已过今日则顺延到明日）*/
  private _msUntilNext(timeStr: string): number {
    const [hh, mm] = timeStr.split(':').map(Number)
    const now = new Date()
    const target = new Date(now)
    target.setHours(hh, mm, 0, 0)
    let ms = target.getTime() - now.getTime()
    if (ms <= 0) {
      // 今日时间已过 → 安排到明日
      target.setDate(target.getDate() + 1)
      ms = target.getTime() - now.getTime()
    }
    return ms
  }
}
