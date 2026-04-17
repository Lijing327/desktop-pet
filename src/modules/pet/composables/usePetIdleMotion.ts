import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { PetState } from '@/types'

const STATE_ANIM: Record<PetState, string> = {
  idle:   'anim-breathe',
  follow: 'anim-walk',
  wait:   'anim-breathe',
  sleep:  'anim-sleep',
  drag:   'anim-breathe',
  react:  'anim-bounce',
  remind: 'anim-shake',
}

export function usePetIdleMotion(state: Ref<PetState>, animOverride: Ref<string | undefined>) {
  const bodyClass = computed(() => animOverride.value ?? STATE_ANIM[state.value])

  // 随机耳朵抖动（为后续拆层耳朵动画预留接口）
  const earFlick = ref<'left' | 'right' | null>(null)
  let earTimer: ReturnType<typeof setInterval> | null = null

  earTimer = setInterval(() => {
    if (state.value !== 'idle' && state.value !== 'wait') return
    earFlick.value = Math.random() > 0.5 ? 'left' : 'right'
    setTimeout(() => { earFlick.value = null }, 280)
  }, 3500 + Math.random() * 4000)

  onUnmounted(() => { if (earTimer) clearInterval(earTimer) })

  return { bodyClass, earFlick }
}
