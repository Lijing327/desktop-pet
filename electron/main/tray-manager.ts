import { Tray, Menu, app } from 'electron'
import type { WindowManager } from './window-manager'
import type { Scheduler } from './scheduler'
import { buildColorIcon } from './utils/icon-builder'

/**
 * 系统托盘管理器
 *
 * 菜单项：显示/隐藏宠物、打开设置、暂停/恢复提醒、退出
 * 状态同步：每次点击"暂停/恢复"后重建菜单，确保 label 与实际状态一致
 */
export class TrayManager {
  private tray: Tray | null = null

  /** 初始化托盘（app ready 后调用）*/
  init(wm: WindowManager, scheduler: Scheduler): void {
    if (this.tray) return  // 防止重复初始化

    // 使用程序生成的纯色图标（P4 阶段替换为真实设计图标）
    const icon = buildColorIcon(16, '#FFB7D5')

    this.tray = new Tray(icon)
    this.tray.setToolTip('桌面宠物 🐱')

    // 双击托盘图标 → 显示宠物
    this.tray.on('double-click', () => wm.showPet())

    this._rebuildMenu(wm, scheduler)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }

  // ── 内部 ────────────────────────────────────────────────────────────────

  /**
   * 重建上下文菜单
   * 每次"暂停/恢复"状态变更后调用，保证 label 与调度器实际状态同步
   */
  private _rebuildMenu(wm: WindowManager, scheduler: Scheduler): void {
    if (!this.tray) return

    const pauseLabel = scheduler.isPaused ? '▶  恢复提醒' : '⏸  暂停提醒'

    const menu = Menu.buildFromTemplate([
      {
        label: '👀  显示宠物',
        click: () => wm.showPet(),
      },
      {
        label: '🙈  隐藏宠物',
        click: () => wm.hidePet(),
      },
      { type: 'separator' },
      {
        label: '⚙  打开设置',
        click: () => wm.createSettingsWindow(),
      },
      { type: 'separator' },
      {
        label: pauseLabel,
        click: () => {
          if (scheduler.isPaused) {
            scheduler.resume()
          } else {
            scheduler.pause()
          }
          // 重建菜单以同步最新状态
          this._rebuildMenu(wm, scheduler)
        },
      },
      { type: 'separator' },
      {
        label: '❌  退出',
        click: () => app.quit(),
      },
    ])

    this.tray.setContextMenu(menu)
  }
}
