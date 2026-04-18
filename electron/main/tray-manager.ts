import { Tray, Menu, app } from 'electron'
import { Channels } from '../shared/channels'
import type { AppState, PetState } from '../shared/types'
import { appStore } from './store'
import { buildColorIcon } from './utils/icon-builder'
import type { Scheduler } from './scheduler'
import type { AppStateManager } from './state-manager'
import type { WindowManager } from './window-manager'

/**
 * 系统托盘管理器
 * 职责：
 * 1. 构建托盘菜单（窗口、状态、提醒、设置、退出）
 * 2. 派发宠物动作命令到渲染进程
 * 3. 管理鼠标穿透开关
 */
export class TrayManager {
  private tray: Tray | null = null
  private mouseThrough = false
  private currentAppState: AppState = 'idle'

  init(wm: WindowManager, scheduler: Scheduler, appStateManager: AppStateManager): void {
    if (this.tray) return

    this.mouseThrough = appStore.get('settings').mouseThrough ?? false
    this.currentAppState = appStateManager.state
    if (this.mouseThrough) wm.setMouseThrough(true)

    const icon = buildColorIcon(16, '#FFB7D5')
    this.tray = new Tray(icon)
    this.tray.setToolTip('桌面宠物')
    this.tray.on('double-click', () => wm.showPet())

    appStateManager.onChange((state) => {
      this.currentAppState = state
      this._rebuildMenu(wm, scheduler, appStateManager)
    })

    this._rebuildMenu(wm, scheduler, appStateManager)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }

  private _sendPetState(wm: WindowManager, state: PetState): void {
    wm.getPetWindow()?.webContents.send(Channels.PET_STATE_CMD, state)
  }

  private _rebuildMenu(wm: WindowManager, scheduler: Scheduler, appStateManager: AppStateManager): void {
    if (!this.tray) return

    const pauseLabel = scheduler.isPaused ? '恢复提醒' : '暂停提醒'
    const throughLabel = this.mouseThrough ? '关闭鼠标穿透' : '开启鼠标穿透'

    const menu = Menu.buildFromTemplate([
      { label: `当前状态：${this.currentAppState}`, enabled: false },
      { type: 'separator' },
      { label: '显示宠物', click: () => wm.showPet() },
      { label: '隐藏宠物', click: () => wm.hidePet() },
      { type: 'separator' },
      {
        label: '基础状态',
        submenu: [
          { label: 'Idle', click: () => appStateManager.setState('idle') },
          { label: 'Working', click: () => appStateManager.setState('working') },
          { label: 'Resting', click: () => appStateManager.setState('resting') },
          { label: 'Sleeping', click: () => appStateManager.setState('sleeping') },
          { label: 'Reminding', click: () => appStateManager.setReminding(1200) },
        ],
      },
      {
        label: '宠物动作',
        submenu: [
          { label: '待机', click: () => this._sendPetState(wm, 'idle') },
          { label: '跟随', click: () => this._sendPetState(wm, 'follow') },
          { label: '等待', click: () => this._sendPetState(wm, 'wait') },
          { label: '睡觉', click: () => this._sendPetState(wm, 'sleep') },
        ],
      },
      { type: 'separator' },
      {
        label: throughLabel,
        click: () => {
          this.mouseThrough = !this.mouseThrough
          wm.setMouseThrough(this.mouseThrough)
          const settings = appStore.get('settings')
          appStore.set('settings', { ...settings, mouseThrough: this.mouseThrough })
          this._rebuildMenu(wm, scheduler, appStateManager)
        },
      },
      { label: '打开设置', click: () => wm.createSettingsWindow() },
      { type: 'separator' },
      {
        label: pauseLabel,
        click: () => {
          scheduler.isPaused ? scheduler.resume() : scheduler.pause()
          this._rebuildMenu(wm, scheduler, appStateManager)
        },
      },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() },
    ])

    this.tray.setContextMenu(menu)
  }
}
