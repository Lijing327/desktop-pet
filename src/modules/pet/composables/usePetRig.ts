import { computed } from 'vue'
import type { Ref } from 'vue'
import type { PetState } from '@/types'

export interface PartTransform {
  translateX: number
  translateY: number
  rotate: number
  scaleX: number
  scaleY: number
}

export function identityTransform(): PartTransform {
  return { translateX: 0, translateY: 0, rotate: 0, scaleX: 1, scaleY: 1 }
}

export function toCSS(t: PartTransform): string {
  return `translate(${t.translateX}px,${t.translateY}px) rotate(${t.rotate}deg) scale(${t.scaleX},${t.scaleY})`
}

/**
 * 各部件变换管理
 * 当前单图模式：只输出 lookStyle（整体轻微旋转实现朝向感知）
 * 拆层后：为 head/earL/earR/tail 各自输出独立 PartTransform
 */
export function usePetRig(state: Ref<PetState>, lookAngle: Ref<number>) {
  const lookStyle = computed(() => {
    const angle = lookAngle.value
    if (angle === 0) return {}
    return {
      transform: `rotate(${angle}deg)`,
      transformOrigin: 'bottom center',
      transition: 'transform 0.3s ease',
    }
  })

  return { lookStyle }
}
