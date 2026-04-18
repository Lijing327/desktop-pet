/** IPC 通道常量：主进程、预加载、渲染层统一使用 */
export const Channels = {
  // 系统
  PING: 'ping',

  // 窗口控制
  OPEN_SETTINGS: 'window:open-settings',
  CLOSE_SETTINGS: 'window:close-settings',
  SHOW_PET: 'window:show-pet',
  HIDE_PET: 'window:hide-pet',
  MOVE_PET_WINDOW: 'window:move-pet',
  MOVE_PET_WINDOW_BY: 'window:move-pet-by',
  SNAP_TO_EDGE: 'window:snap-edge',
  GET_PET_POSITION: 'window:get-pet-pos',
  SET_MOUSE_THROUGH: 'window:mouse-through',

  // 鼠标
  GET_CURSOR_POS: 'cursor:get-pos',

  // 宠物动画状态命令（兼容现有渲染状态机）
  PET_STATE_CMD: 'pet:state-cmd',

  // 产品基础状态系统
  APP_STATE_SET: 'app:state-set',
  APP_STATE_GET: 'app:state-get',
  APP_STATE_CHANGED: 'app:state-changed',

  // 本地配置
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',

  // 提醒
  REMINDER_TRIGGER: 'reminder:trigger',
  REMINDER_UPDATE: 'reminder:update',
} as const

export type ChannelKey = keyof typeof Channels
