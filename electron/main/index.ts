import { app, BrowserWindow } from 'electron'
import { WindowManager } from './window-manager'
import { registerIpcHandlers } from './ipc/handlers'

// Windows 透明窗口需要关闭沙盒，否则部分系统透明会失效
app.commandLine.appendSwitch('enable-transparent-visuals')

const windowManager = new WindowManager()

app.whenReady().then(() => {
  windowManager.createPetWindow()
  registerIpcHandlers(windowManager)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createPetWindow()
    }
  })
})

// Windows / Linux：关闭全部窗口后退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
