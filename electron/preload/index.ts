import { contextBridge, ipcRenderer } from 'electron'
import { Channels } from '../shared/channels'
import type { AppSettings } from '../shared/types'

/** 安全暴露给渲染进程的 API */
const electronAPI = {
  // 连通性测试
  ping: (): Promise<string> => ipcRenderer.invoke(Channels.PING),

  // 窗口控制
  openSettings: (): void => ipcRenderer.send(Channels.OPEN_SETTINGS),
  closeSettings: (): void => ipcRenderer.send(Channels.CLOSE_SETTINGS),
  showPet: (): void => ipcRenderer.send(Channels.SHOW_PET),
  hidePet: (): void => ipcRenderer.send(Channels.HIDE_PET),

  // P1: 拖拽移动（增量，高频 fire-and-forget）
  movePetWindowBy: (dx: number, dy: number): void =>
    ipcRenderer.send(Channels.MOVE_PET_WINDOW_BY, dx, dy),

  // P1: 拖拽结束吸附 + 返回最终坐标
  snapPetToEdge: (): Promise<{ x: number; y: number }> =>
    ipcRenderer.invoke(Channels.SNAP_TO_EDGE),

  // P1: 获取当前窗口坐标
  getPetPosition: (): Promise<{ x: number; y: number }> =>
    ipcRenderer.invoke(Channels.GET_PET_POSITION),

  // 存储
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(Channels.STORE_GET),
  saveSettings: (patch: Partial<AppSettings>): Promise<void> =>
    ipcRenderer.invoke(Channels.STORE_SET, patch),

  // 主进程推送（P3 提醒联动）
  onReminderTrigger: (cb: (type: string) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, type: string): void => cb(type)
    ipcRenderer.on(Channels.REMINDER_TRIGGER, handler)
    return () => ipcRenderer.removeListener(Channels.REMINDER_TRIGGER, handler)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
