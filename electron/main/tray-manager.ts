import { Tray, Menu, app } from 'electron'
import type { WindowManager } from './window-manager'
import type { Scheduler } from './scheduler'
import { buildColorIcon } from './utils/icon-builder'
import { appStore } from './store'
import { Channels } from '../shared/channels'
import type { PetState } from '../shared/types'

/**
 * 系统托盘管理器
 *
 * 菜单包含：显示/隐藏、状态切换（跟随/等待/睡觉/待机）、
 * 鼠标穿透、打开设置、暂停/恢复提醒、退出
 */
export class TrayManager {
  private tray: Tray | null = null
  private mouseThrough = false

  init(wm: WindowManager, scheduler: Scheduler): void {
    if (this.tray) return

    // 从持久化配置恢复鼠标穿透状态
    this.mouseThrough = appStore.get('settings').mouseThrough ?? false
    if (this.mouseThrough) wm.setMouseThrough(true)

    const icon = buildColorIcon(16, '#FFB7D5')
    this.tray = new Tray(icon)
    this.tray.setToolTip('桌面宠物 🐱')
    this.tray.on('double-click', () => wm.showPet())

    this._rebuildMenu(wm, scheduler)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }

  private _sendState(wm: WindowManager, state: PetState): void {
    wm.getPetWindow()?.webContents.send(Channels.PET_STATE_CMD, state)
  }

  private _rebuildMenu(wm: WindowManager, scheduler: Scheduler): void {
    if (!this.tray) return

    const pauseLabel = scheduler.isPaused ? '▶  恢复提醒' : '⏸  暂停提醒'
    const throughLabel = this.mouseThrough ? '🖱  关闭穿透' : '🖱  开启穿透'

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
        label: '🐾  跟随鼠标',
        click: () => this._sendState(wm, 'follow'),
      },
      {
        label: '👁  等待',
        click: () => this._sendState(wm, 'wait'),
      },
      {
        label: '💤  睡觉',
        click: () => this._sendState(wm, 'sleep'),
      },
      {
        label: '⭐  待机',
        click: () => this._sendState(wm, 'idle'),
      },
      { type: 'separator' },
      {
        label: throughLabel,
        click: () => {
          this.mouseThrough = !this.mouseThrough
          wm.setMouseThrough(this.mouseThrough)
          const settings = appStore.get('settings')
          appStore.set('settings', { ...settings, mouseThrough: this.mouseThrough })
          this._rebuildMenu(wm, scheduler)
        },
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
          scheduler.isPaused ? scheduler.resume() : scheduler.pause()
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
