import { app, BrowserWindow } from 'electron'
import type { AppSettings } from '../shared/types'
import { Channels } from '../shared/channels'
import { NotificationManager } from './notification-manager'
import { registerIpcHandlers } from './ipc/handlers'
import { Scheduler } from './scheduler'
import { appStore } from './store'
import { AppStateManager } from './state-manager'
import { TrayManager } from './tray-manager'
import { WindowManager } from './window-manager'

// Windows 透明窗口兼容开关
app.commandLine.appendSwitch('enable-transparent-visuals')

const wm = new WindowManager()
const appStateManager = new AppStateManager()
const notifier = new NotificationManager(wm)
const scheduler = new Scheduler(notifier, appStateManager)
const trayMgr = new TrayManager()

/** 同步 launchAtStartup 到系统登录项 */
function applyLoginItem(settings: AppSettings): void {
  app.setLoginItemSettings({
    openAtLogin: settings.app.launchAtStartup,
    name: 'DesktopPet',
  })
}

app.whenReady().then(() => {
  wm.createPetWindow()
  trayMgr.init(wm, scheduler, appStateManager)
  registerIpcHandlers(wm, scheduler, appStateManager)

  const settings = appStore.get('settings')
  scheduler.apply(settings)
  applyLoginItem(settings)

  // 状态变化统一广播给渲染层（后续可扩展状态可视化）
  appStateManager.onChange((state) => {
    const win = wm.getPetWindow()
    if (!win || win.isDestroyed()) return
    win.webContents.send(Channels.APP_STATE_CHANGED, state)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) wm.createPetWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  scheduler.clear()
  trayMgr.destroy()
  appStateManager.dispose()
})
