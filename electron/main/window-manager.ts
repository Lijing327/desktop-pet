import { BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const RENDERER_URL = process.env['ELECTRON_RENDERER_URL']
const SNAP_DIST = 28  // 边缘吸附触发距离（像素）

export class WindowManager {
  private petWindow: BrowserWindow | null = null
  private settingsWindow: BrowserWindow | null = null

  createPetWindow(): BrowserWindow {
    if (this.petWindow && !this.petWindow.isDestroyed()) {
      this.petWindow.show()
      return this.petWindow
    }

    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    this.petWindow = new BrowserWindow({
      width: 200,
      height: 200,
      x: width - 220,
      y: height - 220,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    })

    this.petWindow.on('closed', () => {
      this.petWindow = null
    })

    this._loadPage(this.petWindow, '/pet')
    return this.petWindow
  }

  createSettingsWindow(): BrowserWindow {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus()
      return this.settingsWindow
    }

    this.settingsWindow = new BrowserWindow({
      width: 480,
      height: 600,
      title: '设置',
      resizable: false,
      center: true,
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    })

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow?.show()
    })

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null
    })

    this._loadPage(this.settingsWindow, '/settings')
    return this.settingsWindow
  }

  // ── 宠物窗口控制 ──────────────────────────────────────────────────────────

  getPetWindow(): BrowserWindow | null {
    return this.petWindow
  }

  getSettingsWindow(): BrowserWindow | null {
    return this.settingsWindow
  }

  showPet(): void {
    this.petWindow?.show()
  }

  hidePet(): void {
    this.petWindow?.hide()
  }

  /** 绝对坐标移动 */
  movePet(x: number, y: number): void {
    this.petWindow?.setPosition(Math.round(x), Math.round(y))
  }

  /** 增量移动 — 拖拽时使用，性能更好 */
  movePetBy(dx: number, dy: number): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return
    const [x, y] = this.petWindow.getPosition()
    this.petWindow.setPosition(Math.round(x + dx), Math.round(y + dy))
  }

  /** 获取当前宠物窗口位置 */
  getPetPosition(): { x: number; y: number } {
    if (!this.petWindow || this.petWindow.isDestroyed()) return { x: 0, y: 0 }
    const [x, y] = this.petWindow.getPosition()
    return { x, y }
  }

  /** 拖拽结束后：将宠物吸附到最近屏幕边缘 */
  snapPetToEdge(): { x: number; y: number } {
    if (!this.petWindow || this.petWindow.isDestroyed()) return { x: 0, y: 0 }

    const [x, y] = this.petWindow.getPosition()
    const [w, h] = this.petWindow.getSize()
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    let nx = x
    let ny = y

    if (x < SNAP_DIST) nx = 0
    else if (x + w > width - SNAP_DIST) nx = width - w

    if (y < SNAP_DIST) ny = 0
    else if (y + h > height - SNAP_DIST) ny = height - h

    if (nx !== x || ny !== y) {
      this.petWindow.setPosition(nx, ny)
    }
    return { x: nx, y: ny }
  }

  private _loadPage(win: BrowserWindow, hash: string): void {
    if (is.dev && RENDERER_URL) {
      win.loadURL(`${RENDERER_URL}/#${hash}`)
    } else {
      win.loadFile(join(__dirname, '../renderer/index.html'), { hash })
    }
  }
}
