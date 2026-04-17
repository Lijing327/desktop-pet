import { Tray, Menu, nativeImage } from 'electron'
import type { WindowManager } from './window-manager'

/**
 * 托盘管理器 — P3 阶段实现
 * 目前仅保留结构，init() 在 P3 接入
 */
export class TrayManager {
  private tray: Tray | null = null

  init(_wm: WindowManager): void {
    // TODO P3: 加载真实图标，创建托盘菜单
    // const icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'))
    // this.tray = new Tray(icon)
    // this.tray.setContextMenu(this._buildMenu(wm))
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
