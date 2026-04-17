import type { NotificationManager } from './notification-manager'
import type { AppSettings, ReminderType } from '../shared/types'

/**
 * 提醒调度器 — P3 阶段实现
 * 支持：周期提醒（喝水）、固定时间提醒（下班/午休）
 */
export class Scheduler {
  private timers = new Map<ReminderType, NodeJS.Timeout>()

  constructor(private readonly notifier: NotificationManager) {}

  /** 根据最新配置重置所有定时器 */
  apply(_settings: AppSettings): void {
    // TODO P3: 实现喝水/下班/午休提醒调度
    this.clear()
  }

  clear(): void {
    this.timers.forEach((t) => clearTimeout(t))
    this.timers.clear()
  }
}
