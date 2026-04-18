import { contextBridge, ipcRenderer } from 'electron'
import { Channels } from '../shared/channels'
import type {
  IpcEventContract,
  IpcInvokeContract,
  IpcSendContract,
} from '../shared/ipc-contract'
import type { AppSettings, AppState, PetState, ReminderType } from '../shared/types'

type InvokeChannel = keyof IpcInvokeContract
type SendChannel = keyof IpcSendContract
type EventChannel = keyof IpcEventContract

/** 类型安全 invoke 封装 */
function invoke<K extends InvokeChannel>(
  channel: K,
  ...args: IpcInvokeContract[K]['args']
): Promise<IpcInvokeContract[K]['result']> {
  return ipcRenderer.invoke(channel as string, ...args)
}

/** 类型安全 send 封装 */
function send<K extends SendChannel>(channel: K, ...args: IpcSendContract[K]): void {
  ipcRenderer.send(channel as string, ...args)
}

/** 类型安全事件订阅封装 */
function on<K extends EventChannel>(
  channel: K,
  cb: (...args: IpcEventContract[K]) => void,
): () => void {
  const handler = (_e: Electron.IpcRendererEvent, ...args: IpcEventContract[K]) => cb(...args)
  ipcRenderer.on(channel as string, handler)
  return () => ipcRenderer.removeListener(channel as string, handler)
}

/** 安全暴露给渲染进程的 API */
const electronAPI = {
  ping: (): Promise<string> => invoke(Channels.PING),

  // 窗口控制
  openSettings: (): void => send(Channels.OPEN_SETTINGS),
  closeSettings: (): void => send(Channels.CLOSE_SETTINGS),
  showPet: (): void => send(Channels.SHOW_PET),
  hidePet: (): void => send(Channels.HIDE_PET),
  movePetWindowBy: (dx: number, dy: number): void => send(Channels.MOVE_PET_WINDOW_BY, dx, dy),
  snapPetToEdge: (): Promise<{ x: number; y: number }> => invoke(Channels.SNAP_TO_EDGE),
  getPetPosition: (): Promise<{ x: number; y: number }> => invoke(Channels.GET_PET_POSITION),
  getCursorPos: (): Promise<{ x: number; y: number }> => invoke(Channels.GET_CURSOR_POS),
  setMouseThrough: (enabled: boolean): Promise<void> => invoke(Channels.SET_MOUSE_THROUGH, enabled),

  // 设置与本地持久化
  getSettings: (): Promise<AppSettings> => invoke(Channels.STORE_GET),
  saveSettings: (patch: Partial<AppSettings>): Promise<AppSettings> => invoke(Channels.STORE_SET, patch),

  // 基础状态系统
  getAppState: (): Promise<AppState> => invoke(Channels.APP_STATE_GET),
  setAppState: (state: AppState): Promise<AppState> => invoke(Channels.APP_STATE_SET, state),

  // 主进程推送事件
  onPetStateCmd: (cb: (state: PetState) => void): (() => void) => on(Channels.PET_STATE_CMD, cb),
  onReminderTrigger: (cb: (type: ReminderType) => void): (() => void) =>
    on(Channels.REMINDER_TRIGGER, cb),
  onAppStateChanged: (cb: (state: AppState) => void): (() => void) =>
    on(Channels.APP_STATE_CHANGED, cb),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
