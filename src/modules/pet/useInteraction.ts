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
 * 单击 → triggerClick()（状态机内部处理 sleep唤醒 / react / 无效判断）
 * 双击 → react + excited 动画覆盖
 */
export function useInteraction(
  store: PetStore,
  hasMoved: Ref<boolean>,
  showBubble: (opts?: ShowOptions) => void,
) {
  const isHovered = ref(false)
  const animOverride = ref<string | undefined>(undefined)

  let clickTimer: ReturnType<typeof setTimeout> | null = null
  let pendingClicks = 0

  function onPetClick(): void {
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

  function _handleSingleClick(): void {
    store.handleClick()
    showBubble({ categories: ['fun', 'comfort'] })
  }

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
