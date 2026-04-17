import { ipcMain, app, screen } from 'electron'
import { Channels } from '../../shared/channels'
import type { WindowManager } from '../window-manager'
import type { Scheduler } from '../scheduler'
import type { AppSettings } from '../../shared/types'
import { appStore } from '../store'

export function registerIpcHandlers(wm: WindowManager, scheduler: Scheduler): void {
  // 连通性测试
  ipcMain.handle(Channels.PING, () => 'pong')

  // ── 窗口控制 ────────────────────────────────────────────────────────────
  ipcMain.on(Channels.OPEN_SETTINGS, () => wm.createSettingsWindow())
  ipcMain.on(Channels.CLOSE_SETTINGS, () => wm.getSettingsWindow()?.close())
  ipcMain.on(Channels.SHOW_PET, () => wm.showPet())
  ipcMain.on(Channels.HIDE_PET, () => wm.hidePet())
  ipcMain.on(Channels.MOVE_PET_WINDOW, (_e, x: number, y: number) => wm.movePet(x, y))

  ipcMain.on(Channels.MOVE_PET_WINDOW_BY, (_e, dx: number, dy: number) => {
    wm.movePetBy(dx, dy)
  })

  ipcMain.handle(Channels.SNAP_TO_EDGE, () => wm.snapPetToEdge())
  ipcMain.handle(Channels.GET_PET_POSITION, () => wm.getPetPosition())

  // 鼠标穿透开关
  ipcMain.handle(Channels.SET_MOUSE_THROUGH, (_e, enabled: boolean) => {
    wm.setMouseThrough(enabled)
    const settings = appStore.get('settings')
    appStore.set('settings', { ...settings, mouseThrough: enabled })
  })

  // 获取全局鼠标位置（follow / wait 状态使用）
  ipcMain.handle(Channels.GET_CURSOR_POS, () => screen.getCursorScreenPoint())

  // ── 本地存储 ────────────────────────────────────────────────────────────
  ipcMain.handle(Channels.STORE_GET, () => appStore.get('settings'))

  ipcMain.handle(Channels.STORE_SET, (_e, patch: Partial<AppSettings>) => {
    const current = appStore.get('settings')
    const updated: AppSettings = { ...current, ...patch }
    appStore.set('settings', updated)
    scheduler.apply(updated)

    if (patch.app?.launchAtStartup !== undefined) {
      app.setLoginItemSettings({ openAtLogin: patch.app.launchAtStartup, name: 'DesktopPet' })
    }
  })
}
