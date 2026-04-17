import { ipcMain } from 'electron'
import { Channels } from '../../shared/channels'
import type { WindowManager } from '../window-manager'
import type { AppSettings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/types'
import Store from 'electron-store'

const store = new Store<{ settings: AppSettings }>({
  defaults: { settings: DEFAULT_SETTINGS },
})

export function registerIpcHandlers(wm: WindowManager): void {
  // 连通性测试
  ipcMain.handle(Channels.PING, () => 'pong')

  // 窗口控制
  ipcMain.on(Channels.OPEN_SETTINGS, () => wm.createSettingsWindow())
  ipcMain.on(Channels.CLOSE_SETTINGS, () => wm.getSettingsWindow()?.close())
  ipcMain.on(Channels.SHOW_PET, () => wm.showPet())
  ipcMain.on(Channels.HIDE_PET, () => wm.hidePet())
  ipcMain.on(Channels.MOVE_PET_WINDOW, (_e, x: number, y: number) => wm.movePet(x, y))

  // P1: 增量移动（拖拽高频调用，用 send 不用 invoke）
  ipcMain.on(Channels.MOVE_PET_WINDOW_BY, (_e, dx: number, dy: number) => {
    wm.movePetBy(dx, dy)
  })

  // P1: 边缘吸附（拖拽结束时调用一次）
  ipcMain.handle(Channels.SNAP_TO_EDGE, () => wm.snapPetToEdge())

  // P1: 获取当前位置（用于保存）
  ipcMain.handle(Channels.GET_PET_POSITION, () => wm.getPetPosition())

  // 本地存储
  ipcMain.handle(Channels.STORE_GET, () => store.get('settings'))

  ipcMain.handle(Channels.STORE_SET, (_e, patch: Partial<AppSettings>) => {
    const current = store.get('settings')
    store.set('settings', { ...current, ...patch })
  })
}
