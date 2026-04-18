import { Channels } from './channels'
import type { AppSettings, AppState, PetState, ReminderType } from './types'

/** invoke 通道类型合同 */
export interface IpcInvokeContract {
  [Channels.PING]: { args: []; result: string }
  [Channels.SNAP_TO_EDGE]: { args: []; result: { x: number; y: number } }
  [Channels.GET_PET_POSITION]: { args: []; result: { x: number; y: number } }
  [Channels.GET_CURSOR_POS]: { args: []; result: { x: number; y: number } }
  [Channels.SET_MOUSE_THROUGH]: { args: [boolean]; result: void }
  [Channels.STORE_GET]: { args: []; result: AppSettings }
  [Channels.STORE_SET]: { args: [Partial<AppSettings>]; result: AppSettings }
  [Channels.APP_STATE_GET]: { args: []; result: AppState }
  [Channels.APP_STATE_SET]: { args: [AppState]; result: AppState }
}

/** send 通道类型合同 */
export interface IpcSendContract {
  [Channels.OPEN_SETTINGS]: []
  [Channels.CLOSE_SETTINGS]: []
  [Channels.SHOW_PET]: []
  [Channels.HIDE_PET]: []
  [Channels.MOVE_PET_WINDOW]: [number, number]
  [Channels.MOVE_PET_WINDOW_BY]: [number, number]
}

/** event（主进程->渲染）通道类型合同 */
export interface IpcEventContract {
  [Channels.PET_STATE_CMD]: [PetState]
  [Channels.REMINDER_TRIGGER]: [ReminderType]
  [Channels.APP_STATE_CHANGED]: [AppState]
}
