/** IPC 通道常量 — 主进程与渲染进程共用 */
export const Channels = {
  // 系统
  PING: 'ping',

  // 窗口控制
  OPEN_SETTINGS: 'window:open-settings',
  CLOSE_SETTINGS: 'window:close-settings',
  SHOW_PET: 'window:show-pet',
  HIDE_PET: 'window:hide-pet',
  MOVE_PET_WINDOW: 'window:move-pet',
  MOVE_PET_WINDOW_BY: 'window:move-pet-by',  // P1: 拖拽用增量移动
  SNAP_TO_EDGE: 'window:snap-edge',          // P1: 边缘吸附
  GET_PET_POSITION: 'window:get-pet-pos',    // P1: 获取当前位置

  // 存储
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',

  // 提醒（P3 预留）
  REMINDER_TRIGGER: 'reminder:trigger',
  REMINDER_UPDATE: 'reminder:update',
} as const
