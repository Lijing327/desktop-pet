import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { PetState } from '@/types'

/**
 * 点击反馈动画管理
 * 确保 react 动画在状态切走后仍能完整播放完
 */
export function usePetReactMotion(state: Ref<PetState>, animDuration = 620) {
  const reactClass = ref('')
  let clearTimer: ReturnType<typeof setTimeout> | null = null

  watch(state, (s) => {
    if (s !== 'react') return
    if (clearTimer) clearTimeout(clearTimer)
    reactClass.value = 'anim-bounce'
    clearTimer = setTimeout(() => { reactClass.value = '' }, animDuration)
  })

  return { reactClass }
}
