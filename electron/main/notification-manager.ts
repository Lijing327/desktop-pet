import { Notification } from 'electron'
import { Channels } from '../shared/channels'
import type { WindowManager } from './window-manager'

/** 每种提醒类型对应的系统通知文案 */
const NOTIFICATION_COPY: Record<string, { title: string; body: string }> = {
  water:      { title: '该喝水了 💧', body: '再卷也要补水，保持健康才能继续冲！' },
  offWork:    { title: '快下班了 🎉', body: '今日份打工即将结束，坚持最后一下！' },
  lunchBreak: { title: '午休时间到 😴', body: '休息一会儿，下午精力更充沛！' },
}

export class NotificationManager {
  constructor(private readonly wm: WindowManager) {}

  /**
   * 触发提醒的完整链路：
   *   1. 发送系统级通知（有降级处理）
   *   2. 推送 IPC 到渲染进程，让宠物进入 remind 状态
   */
  fire(type: string): void {
    this._sendSystemNotification(type)
    this._pushToRenderer(type)
  }

  /** 直接发送自定义系统通知 */
  send(title: string, body: string): void {
    if (!Notification.isSupported()) return
    try {
      new Notification({ title, body }).show()
    } catch {
      // 静默降级：系统通知不可用时不影响桌宠提醒
    }
  }

  private _sendSystemNotification(type: string): void {
    if (!Notification.isSupported()) return
    const copy = NOTIFICATION_COPY[type] ?? {
      title: '提醒',
      body: '桌面宠物提醒你注意休息 🐱',
    }
    try {
      new Notification(copy).show()
    } catch {
      // 静默降级
    }
  }

  /** 通过 IPC 推送到宠物窗口渲染进程 */
  private _pushToRenderer(type: string): void {
    const win = this.wm.getPetWindow()
    if (!win || win.isDestroyed()) return
    win.webContents.send(Channels.REMINDER_TRIGGER, type)
  }
}
