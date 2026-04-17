/** 主进程与渲染进程共享的类型定义 */

export interface AppSettings {
  petPosition: { x: number; y: number }
  mouseThrough: boolean
  reminders: {
    waterEnabled: boolean
    waterIntervalMinutes: number
    offWorkEnabled: boolean
    offWorkTime: string       // 'HH:mm' 格式
    lunchBreakEnabled: boolean
    lunchBreakTime: string
  }
  interaction: {
    bubbleEnabled: boolean
    bubbleFrequency: 'low' | 'medium' | 'high'
  }
  app: {
    launchAtStartup: boolean
    enableNotification: boolean
    hideToTray: boolean
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  petPosition: { x: -1, y: -1 },   // -1 表示首次启动用默认位置
  mouseThrough: false,
  reminders: {
    waterEnabled: true,
    waterIntervalMinutes: 60,
    offWorkEnabled: true,
    offWorkTime: '18:00',
    lunchBreakEnabled: false,
    lunchBreakTime: '12:00',
  },
  interaction: {
    bubbleEnabled: true,
    bubbleFrequency: 'medium',
  },
  app: {
    launchAtStartup: false,
    enableNotification: true,
    hideToTray: true,
  },
}

/** 提醒类型（P3 扩展点） */
export type ReminderType = 'water' | 'offWork' | 'lunchBreak'

/** 宠物状态 */
export type PetState = 'idle' | 'follow' | 'wait' | 'sleep' | 'drag' | 'react' | 'remind'
