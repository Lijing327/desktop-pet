import Store from 'electron-store'
import type { AppSettings } from '../shared/types'
import { DEFAULT_SETTINGS } from '../shared/types'

/**
 * 全局唯一 electron-store 实例
 * index.ts / handlers.ts / scheduler 均从此处导入，避免多实例读写竞争
 */
export const appStore = new Store<{ settings: AppSettings }>({
  defaults: { settings: DEFAULT_SETTINGS },
})
