import { ref } from 'vue'

interface DragOptions {
  /** 超过移动阈值、拖拽正式开始时的回调 */
  onDragStart?: () => void
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
    let dragStartFired = false

    const onMove = (ev: MouseEvent): void => {
      const dx = ev.screenX - lastX
      const dy = ev.screenY - lastY
      totalDist += Math.abs(dx) + Math.abs(dy)

      if (totalDist > threshold && !hasMoved.value) {
        hasMoved.value = true
        if (!dragStartFired) {
          dragStartFired = true
          options.onDragStart?.()
        }
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
        const pos = await window.electronAPI.snapPetToEdge()
        options.onDragEnd?.(pos.x, pos.y)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { isDragging, hasMoved, startDrag }
}
