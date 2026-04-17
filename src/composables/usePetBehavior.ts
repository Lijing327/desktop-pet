import { ref, watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { PetState } from '@/types'

/** 每帧位移上限（px） */
const MAX_SPEED = 8
/** 到达阈值：距鼠标中心小于此值视为"到达" */
const ARRIVAL_DIST = 60
/** 跟踪轮询间隔（ms） */
const POLL_MS = 33

/**
 * 宠物行为 composable
 *
 * - follow 模式：每 POLL_MS 朝光标移动窗口，到达后回调 onFollowArrived
 * - wait   模式：追踪光标方向，输出 facingRight 供 PetCharacter 翻转
 */
export function usePetBehavior(
  petState: Ref<PetState>,
  onFollowArrived: () => void,
) {
  /** true = 面向右；false = 面向左（scaleX -1） */
  const facingRight = ref(true)

  /** 跟踪当前窗口位置（本地维护，避免频繁 IPC 查询） */
  let windowPos = { x: 0, y: 0 }
  let cursorPos = { x: 0, y: 0 }

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let motionTimer: ReturnType<typeof setInterval> | null = null

  // ── 光标轮询 ──────────────────────────────────────────────────────────────

  async function pollCursor(): Promise<void> {
    cursorPos = await window.electronAPI.getCursorPos()
  }

  function startPoll(): void {
    if (pollTimer) return
    pollCursor()
    pollTimer = setInterval(pollCursor, POLL_MS)
  }

  function stopPoll(): void {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  // ── 朝向更新（follow + wait 共用） ────────────────────────────────────────

  function updateFacing(): void {
    const dx = cursorPos.x - (windowPos.x + 100)
    facingRight.value = dx >= 0
  }

  // ── follow 移动 ───────────────────────────────────────────────────────────

  function motionTick(): void {
    if (petState.value !== 'follow') return

    const dx = cursorPos.x - (windowPos.x + 100)
    const dy = cursorPos.y - (windowPos.y + 100)
    const dist = Math.hypot(dx, dy)

    if (dist <= ARRIVAL_DIST) {
      stopMotion()
      onFollowArrived()
      return
    }

    facingRight.value = dx >= 0

    // 距离越近速度越慢，产生减速感
    const speed = Math.min(MAX_SPEED, dist * 0.12)
    const mx = Math.round((dx / dist) * speed)
    const my = Math.round((dy / dist) * speed)

    window.electronAPI.movePetWindowBy(mx, my)
    windowPos.x += mx
    windowPos.y += my
  }

  function startMotion(): void {
    if (motionTimer) return
    motionTimer = setInterval(motionTick, POLL_MS)
  }

  function stopMotion(): void {
    if (motionTimer) { clearInterval(motionTimer); motionTimer = null }
  }

  // ── wait 朝向更新 ─────────────────────────────────────────────────────────

  // 每次光标轮询后，若处于 wait 模式则更新朝向
  const origPoll = pollCursor
  async function pollWithLookAt(): Promise<void> {
    await origPoll()
    if (petState.value === 'wait') updateFacing()
  }

  // ── 状态监听 ──────────────────────────────────────────────────────────────

  watch(petState, async (s) => {
    if (s === 'follow' || s === 'wait') {
      // 进入 follow/wait 时同步一次窗口位置
      windowPos = await window.electronAPI.getPetPosition()
      // 替换为带 look-at 的 poll
      stopPoll()
      pollTimer = setInterval(pollWithLookAt, POLL_MS)
      pollWithLookAt()

      if (s === 'follow') startMotion()
      else stopMotion()
    } else {
      stopMotion()
      stopPoll()
    }
  })

  onUnmounted(() => {
    stopMotion()
    stopPoll()
  })

  return { facingRight }
}
