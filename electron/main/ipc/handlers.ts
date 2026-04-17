import { ipcMain, app } from 'electron'
import { Channels } from '../../shared/channels'
import type { WindowManager } from '../window-manager'
import type { Scheduler } from '../scheduler'
import type { AppSettings } from '../../shared/types'
import { appStore } from '../store'

/**
 * 注册全部 IPC 处理器
 *
 * @param wm        窗口管理器
 * @param scheduler 提醒调度器（STORE_SET 时同步配置）
 */
export function registerIpcHandlers(wm: WindowManager, scheduler: Scheduler): void {
  // 连通性测试
  ipcMain.handle(Channels.PING, () => 'pong')

  // ── 窗口控制 ────────────────────────────────────────────────────────────
  ipcMain.on(Channels.OPEN_SETTINGS, () => wm.createSettingsWindow())
  ipcMain.on(Channels.CLOSE_SETTINGS, () => wm.getSettingsWindow()?.close())
  ipcMain.on(Channels.SHOW_PET, () => wm.showPet())
  ipcMain.on(Channels.HIDE_PET, () => wm.hidePet())
  ipcMain.on(Channels.MOVE_PET_WINDOW, (_e, x: number, y: number) => wm.movePet(x, y))

  // P1: 拖拽增量移动（高频 fire-and-forget）
  ipcMain.on(Channels.MOVE_PET_WINDOW_BY, (_e, dx: number, dy: number) => {
    wm.movePetBy(dx, dy)
  })

  // P1: 拖拽结束边缘吸附
  ipcMain.handle(Channels.SNAP_TO_EDGE, () => wm.snapPetToEdge())

  // P1: 获取当前窗口位置
  ipcMain.handle(Channels.GET_PET_POSITION, () => wm.getPetPosition())

  // ── 本地存储 ────────────────────────────────────────────────────────────
  ipcMain.handle(Channels.STORE_GET, () => appStore.get('settings'))

  ipcMain.handle(Channels.STORE_SET, (_e, patch: Partial<AppSettings>) => {
    const current = appStore.get('settings')
    const updated: AppSettings = { ...current, ...patch }
    appStore.set('settings', updated)

    // 设置变更后立即同步到调度器
    scheduler.apply(updated)

    // 开机自启变更时同步到系统登录项
    if (patch.app?.launchAtStartup !== undefined) {
      app.setLoginItemSettings({ openAtLogin: patch.app.launchAtStartup, name: 'DesktopPet' })
    }
  })
}
