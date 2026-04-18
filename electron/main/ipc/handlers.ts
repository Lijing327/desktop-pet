import { app, ipcMain, screen } from 'electron'
import { Channels } from '../../shared/channels'
import type { IpcInvokeContract, IpcSendContract } from '../../shared/ipc-contract'
import type { AppSettings } from '../../shared/types'
import { appStore } from '../store'
import type { Scheduler } from '../scheduler'
import type { AppStateManager } from '../state-manager'
import type { WindowManager } from '../window-manager'

type InvokeChannel = keyof IpcInvokeContract
type SendChannel = keyof IpcSendContract

/** 类型化 ipcMain.handle 注册 */
function handle<K extends InvokeChannel>(
  channel: K,
  handler: (_: Electron.IpcMainInvokeEvent, ...args: IpcInvokeContract[K]['args']) => IpcInvokeContract[K]['result'] | Promise<IpcInvokeContract[K]['result']>,
): void {
  ipcMain.handle(channel, handler)
}

/** 类型化 ipcMain.on 注册 */
function on<K extends SendChannel>(
  channel: K,
  handler: (_: Electron.IpcMainEvent, ...args: IpcSendContract[K]) => void,
): void {
  ipcMain.on(channel, handler)
}

export function registerIpcHandlers(
  wm: WindowManager,
  scheduler: Scheduler,
  appStateManager: AppStateManager,
): void {
  handle(Channels.PING, () => 'pong')

  // 窗口控制
  on(Channels.OPEN_SETTINGS, () => wm.createSettingsWindow())
  on(Channels.CLOSE_SETTINGS, () => wm.getSettingsWindow()?.close())
  on(Channels.SHOW_PET, () => wm.showPet())
  on(Channels.HIDE_PET, () => wm.hidePet())
  on(Channels.MOVE_PET_WINDOW, (_e, x, y) => wm.movePet(x, y))
  on(Channels.MOVE_PET_WINDOW_BY, (_e, dx, dy) => wm.movePetBy(dx, dy))

  handle(Channels.SNAP_TO_EDGE, () => wm.snapPetToEdge())
  handle(Channels.GET_PET_POSITION, () => wm.getPetPosition())
  handle(Channels.GET_CURSOR_POS, () => screen.getCursorScreenPoint())

  handle(Channels.SET_MOUSE_THROUGH, (_e, enabled) => {
    wm.setMouseThrough(enabled)
    const settings = appStore.get('settings')
    const updated = { ...settings, mouseThrough: enabled }
    appStore.set('settings', updated)
  })

  // 基础状态系统
  handle(Channels.APP_STATE_GET, () => appStateManager.state)
  handle(Channels.APP_STATE_SET, (_e, next) => {
    appStateManager.setState(next)
    return appStateManager.state
  })

  // 配置持久化
  handle(Channels.STORE_GET, () => appStore.get('settings'))

  handle(Channels.STORE_SET, (_e, patch) => {
    const current = appStore.get('settings')
    const updated: AppSettings = {
      ...current,
      ...patch,
      reminders: { ...current.reminders, ...(patch.reminders ?? {}) },
      interaction: { ...current.interaction, ...(patch.interaction ?? {}) },
      app: { ...current.app, ...(patch.app ?? {}) },
    }

    appStore.set('settings', updated)
    scheduler.apply(updated)

    if (patch.app?.launchAtStartup !== undefined) {
      app.setLoginItemSettings({
        openAtLogin: patch.app.launchAtStartup,
        name: 'DesktopPet',
      })
    }

    return updated
  })
}
