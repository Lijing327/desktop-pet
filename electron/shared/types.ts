/** 主进程与渲染进程共享类型 */

/** 产品基础状态（MVP） */
export type AppState = 'idle' | 'working' | 'resting' | 'sleeping' | 'reminding'

/** 提醒类型（MVP） */
export type ReminderType = 'pomodoroWorkEnd' | 'pomodoroBreakEnd' | 'water' | 'sedentary'

/** 宠物动画状态（兼容现有渲染状态机） */
export type PetState = 'idle' | 'follow' | 'wait' | 'sleep' | 'drag' | 'react' | 'remind'

export interface ReminderSettings {
  pomodoroEnabled: boolean
  pomodoroWorkMinutes: number
  pomodoroBreakMinutes: number
  waterEnabled: boolean
  waterIntervalMinutes: number
  sedentaryEnabled: boolean
  sedentaryIntervalMinutes: number
}

export interface AppSettings {
  petPosition: { x: number; y: number }
  mouseThrough: boolean
  reminders: ReminderSettings
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
  petPosition: { x: -1, y: -1 },
  mouseThrough: false,
  reminders: {
    pomodoroEnabled: false,
    pomodoroWorkMinutes: 25,
    pomodoroBreakMinutes: 5,
    waterEnabled: true,
    waterIntervalMinutes: 60,
    sedentaryEnabled: true,
    sedentaryIntervalMinutes: 60,
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
