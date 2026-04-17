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
  MOVE_PET_WINDOW_BY: 'window:move-pet-by',
  SNAP_TO_EDGE: 'window:snap-edge',
  GET_PET_POSITION: 'window:get-pet-pos',
  SET_MOUSE_THROUGH: 'window:mouse-through',   // 鼠标穿透开关

  // 鼠标
  GET_CURSOR_POS: 'cursor:get-pos',            // 获取全局鼠标坐标

  // 宠物状态（主进程 → 渲染进程推送）
  PET_STATE_CMD: 'pet:state-cmd',              // 托盘命令 → 渲染进程切换状态

  // 存储
  STORE_GET: 'store:get',
  STORE_SET: 'store:set',

  // 提醒
  REMINDER_TRIGGER: 'reminder:trigger',
  REMINDER_UPDATE: 'reminder:update',
} as const
