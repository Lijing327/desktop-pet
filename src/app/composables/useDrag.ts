import { ref } from 'vue'

interface DragOptions {
  /** 超过位移阈值并正式进入拖拽时触发 */
  onDragStart?: () => void
  /** 拖拽结束回调，传最终屏幕坐标 */
  onDragEnd?: (x: number, y: number) => void
  /** 触发拖拽的最小位移阈值 */
  threshold?: number
}

export function useDrag(options: DragOptions = {}) {
  /** true 表示已经进入“真实拖拽中” */
  const isDragging = ref(false)
  /** 本次 mousedown -> mouseup 是否越过拖拽阈值 */
  const hasMoved = ref(false)

  function startDrag(e: MouseEvent): void {
    if (e.button !== 0) return
    e.preventDefault()

    hasMoved.value = false
    isDragging.value = false

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
        isDragging.value = true
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
