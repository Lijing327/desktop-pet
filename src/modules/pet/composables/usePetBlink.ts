import { ref, watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { PetState } from '@/types'

export function usePetBlink(
  state: Ref<PetState>,
  intervalMin = 3000,
  intervalRandom = 2500,
  duration = 130,
) {
  const isBlinking = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  timer = setInterval(() => {
    if (state.value !== 'idle' && state.value !== 'wait') return
    isBlinking.value = true
    setTimeout(() => { isBlinking.value = false }, duration)
  }, intervalMin + Math.random() * intervalRandom)

  watch(state, (s) => {
    if (s !== 'idle' && s !== 'wait') isBlinking.value = false
  })

  onUnmounted(() => { if (timer) clearInterval(timer) })

  return { isBlinking }
}
