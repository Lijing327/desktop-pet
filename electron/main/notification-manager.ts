import { Notification } from 'electron'

/**
 * 系统通知管理器 — P3 阶段实现
 */
export class NotificationManager {
  send(title: string, body: string): void {
    // TODO P3: 接入提醒调度后启用
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  }
}
