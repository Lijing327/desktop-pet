import { computed } from 'vue'
import type { Ref } from 'vue'
import type { PetState } from '@/types'

/**
 * 头部朝向轻微旋转角度
 * wait 状态：更强朝向感（±3°）
 * idle 状态：轻微（±1.5°）
 * 其他状态：0（不叠加，避免干扰走路/睡觉动画）
 */
export function usePetLookAt(state: Ref<PetState>, facingRight: Ref<boolean>) {
  const lookAngle = computed(() => {
    const dir = facingRight.value ? 1 : -1
    if (state.value === 'wait') return dir * 3
    if (state.value === 'idle') return dir * 1.5
    return 0
  })

  return { lookAngle }
}
