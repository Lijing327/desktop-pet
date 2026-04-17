/** 文案分类 */
export type QuoteCategory = 'work' | 'comfort' | 'fun' | 'dblclick' | 'reminder'

/**
 * 触发场景 → 文案分类映射
 * 结构上支持扩展：按角色、按时间段、按状态选取不同分类
 */
export const TRIGGER_CATEGORY_MAP: Record<string, QuoteCategory[]> = {
  click:   ['fun', 'comfort'],
  dblclick: ['dblclick'],
  remind:  ['reminder'],
  auto:    ['work', 'comfort'],  // 自发 idle 气泡（P3 接入）
}
