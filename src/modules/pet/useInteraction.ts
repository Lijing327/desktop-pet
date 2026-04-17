import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { usePetStore } from '@/app/stores/pet'
import type { ShowOptions } from '@/modules/bubble'

type PetStore = ReturnType<typeof usePetStore>

/** 双击判定窗口（ms） */
const DBLCLICK_DELAY = 260

/** 双击兴奋动画持续时间（ms），与 anim-excited 保持一致 */
const EXCITED_DURATION = 720

/**
 * 宠物互动 composable
 *
 * 职责：单击/双击区分、hover 状态、动画覆盖
 * 不直接操作 UI，通过回调 showBubble 驱动气泡
 */
export function useInteraction(
  store: PetStore,
  hasMoved: Ref<boolean>,
  showBubble: (opts?: ShowOptions) => void,
) {
  const isHovered = ref(false)
  /** 临时覆盖状态机动画（如双击兴奋）*/
  const animOverride = ref<string | undefined>(undefined)

  let clickTimer: ReturnType<typeof setTimeout> | null = null
  let pendingClicks = 0

  /**
   * 统一的点击入口
   * 在 DBLCLICK_DELAY 窗口内累计点击数，到期后判断单/双击
   */
  function onPetClick(): void {
    // 拖拽结束后浏览器仍会触发 click，通过 hasMoved 过滤
    if (hasMoved.value) return

    pendingClicks++
    if (clickTimer) clearTimeout(clickTimer)

    clickTimer = setTimeout(() => {
      const count = pendingClicks
      pendingClicks = 0
      clickTimer = null
      count >= 2 ? _handleDblClick() : _handleSingleClick()
    }, DBLCLICK_DELAY)
  }

  /** 单击：happy 状态 + fun/comfort 文案 */
  function _handleSingleClick(): void {
    store.handleClick()
    showBubble({ categories: ['fun', 'comfort'] })
  }

  /** 双击：happy 状态 + 兴奋动画 + dblclick 专属文案 */
  function _handleDblClick(): void {
    store.handleClick()
    animOverride.value = 'anim-excited'
    setTimeout(() => { animOverride.value = undefined }, EXCITED_DURATION)
    showBubble({ category: 'dblclick' })
  }

  function onMouseEnter(): void { isHovered.value = true }
  function onMouseLeave(): void { isHovered.value = false }

  onUnmounted(() => {
    if (clickTimer) clearTimeout(clickTimer)
  })

  return { isHovered, animOverride, onPetClick, onMouseEnter, onMouseLeave }
}
