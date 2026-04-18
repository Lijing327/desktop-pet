import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { usePetStore } from '@/app/stores/pet'
import type { ShowOptions } from '@/modules/bubble'

type PetStore = ReturnType<typeof usePetStore>

/** 双击判定窗口（ms） */
const DBLCLICK_DELAY = 260
/** 双击兴奋动画时长（ms） */
const EXCITED_DURATION = 720
/** 连击统计窗口（ms） */
const BURST_WINDOW = 1200
/** 连击达到阈值后触发 annoyed 反馈 */
const BURST_ANNOYED_THRESHOLD = 4
/** 鼠标停留触发观察动作延时（ms） */
const HOVER_OBSERVE_DELAY = 900
/** 观察动作动画时长（ms） */
const OBSERVE_DURATION = 520
/** annoyed 反馈动画时长（ms） */
const ANNOYED_DURATION = 560

/**
 * 互动层：
 * - 单击：短 react（由状态机处理）
 * - 连击：annoyed 风格动画覆盖（不引入新状态）
 * - 鼠标停留：轻微观察动作（不打断 sleep / drag / remind）
 */
export function useInteraction(
  store: PetStore,
  hasMoved: Ref<boolean>,
  showBubble: (opts?: ShowOptions) => void,
  onInteract?: () => void,
  options?: {
    /** 返回 false 时，跳过本次亲近反馈触发 */
    canTriggerProximity?: () => boolean
    /** 触发 annoyed 后上报给页面层做短时记忆 */
    onAnnoyed?: () => void
  },
) {
  const isHovered = ref(false)
  const animOverride = ref<string | undefined>(undefined)

  let clickTimer: ReturnType<typeof setTimeout> | null = null
  let hoverTimer: ReturnType<typeof setTimeout> | null = null
  let burstResetTimer: ReturnType<typeof setTimeout> | null = null
  let overrideResetTimer: ReturnType<typeof setTimeout> | null = null
  let pendingClicks = 0
  let burstClicks = 0

  function onPetClick(): void {
    if (hasMoved.value) return
    onInteract?.()

    // 连击计数：窗口内持续点击触发 annoyed 风格反馈
    burstClicks += 1
    if (burstResetTimer) clearTimeout(burstResetTimer)
    burstResetTimer = setTimeout(() => {
      burstClicks = 0
      burstResetTimer = null
    }, BURST_WINDOW)

    if (burstClicks >= BURST_ANNOYED_THRESHOLD) {
      _setAnimOverride('anim-annoyed', ANNOYED_DURATION)
      options?.onAnnoyed?.()
      showBubble({ category: 'dblclick' })
    }

    pendingClicks += 1
    if (clickTimer) clearTimeout(clickTimer)

    clickTimer = setTimeout(() => {
      const count = pendingClicks
      pendingClicks = 0
      clickTimer = null
      count >= 2 ? _handleDblClick() : _handleSingleClick()
    }, DBLCLICK_DELAY)
  }

  function _handleSingleClick(): void {
    store.handleClick()
    showBubble({ categories: ['fun', 'comfort'] })
  }

  function _handleDblClick(): void {
    store.handleClick()
    _setAnimOverride('anim-excited', EXCITED_DURATION)
    showBubble({ category: 'dblclick' })
  }

  function onMouseEnter(): void {
    isHovered.value = true
    onInteract?.()
    // 近距离反馈受短时记忆参数控制
    if (options?.canTriggerProximity?.() !== false) {
      store.handleProximity()
    }

    // 停留一段时间后触发“观察动作”
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => {
      if (!isHovered.value) return
      if (store.state === 'sleep' || store.state === 'drag' || store.state === 'remind') return
      _setAnimOverride('anim-observe', OBSERVE_DURATION)
    }, HOVER_OBSERVE_DELAY)
  }

  function onMouseLeave(): void {
    isHovered.value = false
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  }

  function _setAnimOverride(name: string, duration: number): void {
    animOverride.value = name
    if (overrideResetTimer) clearTimeout(overrideResetTimer)
    overrideResetTimer = setTimeout(() => {
      animOverride.value = undefined
      overrideResetTimer = null
    }, duration)
  }

  onUnmounted(() => {
    if (clickTimer) clearTimeout(clickTimer)
    if (hoverTimer) clearTimeout(hoverTimer)
    if (burstResetTimer) clearTimeout(burstResetTimer)
    if (overrideResetTimer) clearTimeout(overrideResetTimer)
  })

  return { isHovered, animOverride, onPetClick, onMouseEnter, onMouseLeave }
}
