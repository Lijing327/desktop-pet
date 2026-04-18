import type {
  AppSettings as _AppSettings,
  AppState,
  PetState,
  ReminderType,
} from '../../electron/shared/types'

export type { AppSettings, AppState, PetState, ReminderType } from '../../electron/shared/types'

/** window.electronAPI 接口定义（与 preload 保持一致） */
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
  saveSettings: (patch: Partial<_AppSettings>) => Promise<_AppSettings>
  getAppState: () => Promise<AppState>
  setAppState: (state: AppState) => Promise<AppState>
  onPetStateCmd: (cb: (state: PetState) => void) => () => void
  onReminderTrigger: (cb: (type: ReminderType) => void) => () => void
  onAppStateChanged: (cb: (state: AppState) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
