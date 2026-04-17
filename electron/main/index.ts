import { app, BrowserWindow } from 'electron'
import type { AppSettings } from '../shared/types'
import { WindowManager } from './window-manager'
import { NotificationManager } from './notification-manager'
import { Scheduler } from './scheduler'
import { TrayManager } from './tray-manager'
import { registerIpcHandlers } from './ipc/handlers'
import { appStore } from './store'

// Windows 透明窗口：部分驱动需要此开关才能正确渲染透明区域
app.commandLine.appendSwitch('enable-transparent-visuals')

// ── 实例化各模块（依赖顺序：wm → notifier → scheduler / tray）──────────────
const wm        = new WindowManager()
const notifier  = new NotificationManager(wm)
const scheduler = new Scheduler(notifier)
const trayMgr   = new TrayManager()

/** 将 launchAtStartup 设置同步到系统登录项 */
function applyLoginItem(settings: AppSettings): void {
  app.setLoginItemSettings({
    openAtLogin: settings.app.launchAtStartup,
    name: 'DesktopPet',
  })
}

app.whenReady().then(() => {
  // 创建宠物主窗口
  wm.createPetWindow()

  // 初始化系统托盘
  trayMgr.init(wm, scheduler)

  // 注册所有 IPC 处理器
  registerIpcHandlers(wm, scheduler)

  // 从持久化存储读取配置并启动提醒调度
  const settings = appStore.get('settings')
  scheduler.apply(settings)

  // 同步开机自启状态（可能与系统实际状态不一致）
  applyLoginItem(settings)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      wm.createPetWindow()
    }
  })
})

// Windows / Linux：关闭所有窗口后退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 退出前清理资源
app.on('before-quit', () => {
  scheduler.clear()
  trayMgr.destroy()
})
