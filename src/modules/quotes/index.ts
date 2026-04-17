import rawQuotes from '@/data/quotes.json'
import type { QuoteCategory } from './types'

export type { QuoteCategory }
export { TRIGGER_CATEGORY_MAP } from './types'

// 运行时类型断言：JSON 数据结构
const pool = rawQuotes as Record<QuoteCategory, string[]>

/** 近期已用文案的最大记录数（防连续重复） */
const MAX_RECENT = 3

class QuoteService {
  private recent = new Map<QuoteCategory, string[]>()

  /**
   * 从指定分类中随机取一句，避免短时间内重复
   */
  pick(category: QuoteCategory): string {
    const list = pool[category] ?? []
    if (!list.length) return '...'

    const used = this.recent.get(category) ?? []
    // 排除最近用过的，若全部用过则重置候选池
    const candidates = list.filter((t) => !used.includes(t))
    const src = candidates.length > 0 ? candidates : list

    const text = src[Math.floor(Math.random() * src.length)]

    // 维护最近 N 条记录（队列）
    const next = [...used, text].slice(-MAX_RECENT)
    this.recent.set(category, next)

    return text
  }

  /**
   * 从多个分类中随机选一个分类，再随机取句子
   * 便于场景化调用（如 click → fun | comfort）
   */
  pickFrom(categories: QuoteCategory[]): string {
    const cat = categories[Math.floor(Math.random() * categories.length)]
    return this.pick(cat)
  }
}

/** 全局单例，跨组件共享去重状态 */
export const quoteService = new QuoteService()
