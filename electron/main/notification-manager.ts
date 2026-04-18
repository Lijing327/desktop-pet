import { Notification } from 'electron'
import { Channels } from '../shared/channels'
import type { ReminderType } from '../shared/types'
import { appStore } from './store'
import type { WindowManager } from './window-manager'

/** 每种提醒类型对应的系统通知文案 */
const NOTIFICATION_COPY: Record<ReminderType, { title: string; body: string }> = {
  pomodoroWorkEnd: { title: '番茄钟结束', body: '工作阶段完成，休息一下。' },
  pomodoroBreakEnd: { title: '休息结束', body: '开始下一轮专注吧。' },
  water: { title: '喝水提醒', body: '起来喝点水，保持状态。' },
  sedentary: { title: '久坐提醒', body: '已久坐一段时间，起身活动一下。' },
}

/**
 * 提醒通知管理器
 * 职责：
 * 1. 发送系统通知
 * 2. 推送提醒事件到渲染层，让宠物进入提醒反馈
 */
export class NotificationManager {
  constructor(private readonly wm: WindowManager) {}

  fire(type: ReminderType): void {
    this._sendSystemNotification(type)
    this._pushToRenderer(type)
  }

  send(title: string, body: string): void {
    if (!Notification.isSupported()) return
    if (!appStore.get('settings').app.enableNotification) return
    try {
      new Notification({ title, body }).show()
    } catch {
      // 降级处理：通知不可用时静默忽略
    }
  }

  private _sendSystemNotification(type: ReminderType): void {
    if (!Notification.isSupported()) return
    if (!appStore.get('settings').app.enableNotification) return
    const copy = NOTIFICATION_COPY[type]
    try {
      new Notification(copy).show()
    } catch {
      // 降级处理：通知不可用时静默忽略
    }
  }

  private _pushToRenderer(type: ReminderType): void {
    const win = this.wm.getPetWindow()
    if (!win || win.isDestroyed()) return
    win.webContents.send(Channels.REMINDER_TRIGGER, type)
  }
}
