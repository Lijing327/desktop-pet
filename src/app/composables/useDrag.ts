import { ref } from 'vue'

interface DragOptions {
  /** 拖拽结束（区分点击和拖拽后）回调，传入最终屏幕坐标 */
  onDragEnd?: (x: number, y: number) => void
  /** 移动多少像素才算"拖拽"而非"点击" */
  threshold?: number
}

export function useDrag(options: DragOptions = {}) {
  const isDragging = ref(false)
  /** 本次 mousedown → mouseup 是否超过了移动阈值 */
  const hasMoved = ref(false)

  function startDrag(e: MouseEvent): void {
    if (e.button !== 0) return
    e.preventDefault()

    hasMoved.value = false
    isDragging.value = true

    const threshold = options.threshold ?? 5
    let lastX = e.screenX
    let lastY = e.screenY
    let totalDist = 0

    const onMove = (ev: MouseEvent): void => {
      const dx = ev.screenX - lastX
      const dy = ev.screenY - lastY
      totalDist += Math.abs(dx) + Math.abs(dy)

      if (totalDist > threshold) {
        hasMoved.value = true
      }
      if (hasMoved.value) {
        window.electronAPI.movePetWindowBy(dx, dy)
      }

      lastX = ev.screenX
      lastY = ev.screenY
    }

    const onUp = async (): Promise<void> => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      isDragging.value = false

      if (hasMoved.value) {
        // 边缘吸附，拿到最终位置再保存
        const pos = await window.electronAPI.snapPetToEdge()
        options.onDragEnd?.(pos.x, pos.y)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { isDragging, hasMoved, startDrag }
}
