import type { AppSettings as _AppSettings } from '../../electron/shared/types'

export type { AppSettings } from '../../electron/shared/types'
export type { PetState, ReminderType } from '../../electron/shared/types'

/** window.electronAPI 接口定义（与 preload 保持一致）*/
export interface ElectronAPI {
  ping: () => Promise<string>
  openSettings: () => void
  closeSettings: () => void
  showPet: () => void
  hidePet: () => void
  movePetWindowBy: (dx: number, dy: number) => void
  snapPetToEdge: () => Promise<{ x: number; y: number }>
  getPetPosition: () => Promise<{ x: number; y: number }>
  getCursorPos: () => Promise<{ x: number; y: number }>
  setMouseThrough: (enabled: boolean) => Promise<void>
  getSettings: () => Promise<_AppSettings>
  saveSettings: (patch: Partial<_AppSettings>) => Promise<void>
  onPetStateCmd: (cb: (state: import('../../electron/shared/types').PetState) => void) => () => void
  onReminderTrigger: (cb: (type: string) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
