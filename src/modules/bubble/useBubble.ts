import { ref } from 'vue'
import { quoteService } from '@/modules/quotes'
import type { QuoteCategory } from '@/modules/quotes'

export interface ShowOptions {
  /** 直接指定文案（优先级最高）*/
  text?: string
  /** 指定单一分类随机取句 */
  category?: QuoteCategory
  /** 从多个分类中随机选一个再取句（当 category 未设置时生效）*/
  categories?: QuoteCategory[]
  /** 气泡显示时长（ms），默认 3200 */
  duration?: number
}

/**
 * 气泡控制 composable
 *
 * 职责：文案选取 + 可见性管理 + 自动关闭
 * 与 UI 无关，可被任意组件/composable 调用
 */
export function useBubble(defaultDuration = 3200) {
  const visible = ref(false)
  const text = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  function show(opts: ShowOptions = {}): void {
    // 文案优先级：text > category > categories > 默认 fun/comfort
    if (opts.text) {
      text.value = opts.text
    } else if (opts.category) {
      text.value = quoteService.pick(opts.category)
    } else if (opts.categories?.length) {
      text.value = quoteService.pickFrom(opts.categories)
    } else {
      text.value = quoteService.pickFrom(['fun', 'comfort'])
    }

    visible.value = true

    // 重置自动关闭计时
    if (timer) clearTimeout(timer)
    timer = setTimeout(hide, opts.duration ?? defaultDuration)
  }

  function hide(): void {
    visible.value = false
  }

  /** 清理（组件卸载时调用）*/
  function cleanup(): void {
    if (timer) { clearTimeout(timer); timer = null }
    visible.value = false
  }

  return { visible, text, show, hide, cleanup }
}
