<template>
  <div class="pet-window" @mousedown="startDrag">
    <div class="pet-area" @click="onPetClick" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      <PetLayeredCharacter
        :state="petStore.state"
        :anim-override="mergedAnimOverride"
        :is-hovered="isHovered"
        :is-dragging="isDragging"
        :facing-right="currentFacingRight"
        :enable-idle-layer-rig="enableIdleLayerRig"
      />
    </div>

    <div class="bubble-anchor">
      <BubbleDisplay :visible="bubbleVisible" :text="bubbleText" />
    </div>

    <button class="settings-btn" @click.stop="openSettings" title="打开设置">⚙</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { AppState, ReminderType } from '@/types'
import PetLayeredCharacter from '@/modules/pet/components/PetLayeredCharacter.vue'
import { BubbleDisplay, useBubble } from '@/modules/bubble'
import { usePetStore } from '@/app/stores/pet'
import { useDrag } from '@/app/composables/useDrag'
import { useInteraction } from '@/modules/pet/useInteraction'
import { usePetBehavior } from '@/composables/usePetBehavior'

/** 保持现有 6 秒巡检机制 */
const INACTIVITY_TICK_MS = 6000
/** sleep 退出 wake 过渡时长（300~500ms） */
const WAKE_DURATION = 380
/** annoyed 后短时间降低亲近反馈概率 */
const ANNOYED_COOLDOWN_MS = 9000
/** 刚睡醒后短时间降低再次入睡概率 */
const WAKE_SLEEP_SHIELD_MS = 22000
/** follow 刚完成后短时提升 idle 留驻 */
const FOLLOW_SETTLE_MS = 9000

const petStore = usePetStore()

// idle 拆层渲染开关：layered=拆层，flat=整图
const idleRenderMode = ref<'layered' | 'flat'>('layered')

const {
  visible: bubbleVisible,
  text: bubbleText,
  show: showBubble,
  cleanup: cleanupBubble,
} = useBubble()

const appState = ref<AppState>('idle')
const lastInteractAt = ref(Date.now())

function markInteraction(): void {
  lastInteractAt.value = Date.now()
}

// 短时记忆参数
const annoyedUntil = ref(0)
const wakeSleepShieldUntil = ref(0)
const followSettleUntil = ref(0)

const wakeAnimOverride = ref<string | undefined>(undefined)
let wakeAnimTimer: ReturnType<typeof setTimeout> | null = null

function markAnnoyed(): void {
  annoyedUntil.value = Date.now() + ANNOYED_COOLDOWN_MS
}

function canTriggerProximity(): boolean {
  const now = Date.now()
  if (now >= annoyedUntil.value) return true
  return Math.random() < 0.35
}

const { isDragging, hasMoved, startDrag } = useDrag({
  onDragStart: () => {
    markInteraction()
    petStore.onDragStart()
  },
  onDragEnd: (x, y) => {
    markInteraction()
    petStore.onDragEnd(x, y)
  },
})

const {
  isHovered,
  animOverride: interactionAnimOverride,
  onPetClick,
  onMouseEnter,
  onMouseLeave,
} = useInteraction(petStore, hasMoved, showBubble, markInteraction, {
  canTriggerProximity,
  onAnnoyed: markAnnoyed,
})

// wake 过渡优先级高于普通互动动画
const mergedAnimOverride = computed(() => wakeAnimOverride.value ?? interactionAnimOverride.value)

const stateRef = computed(() => petStore.state)
const { facingRight: behaviorFacingRight } = usePetBehavior(stateRef, () => petStore.onFollowArrived())

const idleLookRight = ref(true)
let idleLookTimer: ReturnType<typeof setInterval> | null = null

watch(
  stateRef,
  (state, prevState) => {
    if (state === 'idle') {
      if (idleLookTimer) clearInterval(idleLookTimer)
      idleLookTimer = setInterval(() => {
        idleLookRight.value = Math.random() > 0.5
      }, 4000 + Math.random() * 5000)
    } else if (idleLookTimer) {
      clearInterval(idleLookTimer)
      idleLookTimer = null
    }

    // sleep -> idle：先 wake 轻过渡，再回正常 idle
    if (prevState === 'sleep' && state === 'idle') {
      wakeSleepShieldUntil.value = Date.now() + WAKE_SLEEP_SHIELD_MS
      if (wakeAnimTimer) clearTimeout(wakeAnimTimer)
      wakeAnimOverride.value = 'anim-wake'
      wakeAnimTimer = setTimeout(() => {
        wakeAnimOverride.value = undefined
        wakeAnimTimer = null
      }, WAKE_DURATION)
    }

    // follow 完成后短时优先回 idle
    if (prevState === 'follow' && state === 'idle') {
      followSettleUntil.value = Date.now() + FOLLOW_SETTLE_MS
    }
  },
  { immediate: true },
)

const currentFacingRight = computed(() => {
  const s = petStore.state
  if (s === 'follow' || s === 'wait') return behaviorFacingRight.value
  if (s === 'idle') return idleLookRight.value
  return true
})

// 仅在 idle 状态启用路线 B 拆层
const enableIdleLayerRig = computed(() => {
  return idleRenderMode.value === 'layered' && petStore.state === 'idle'
})

function openSettings(): void {
  window.electronAPI.openSettings()
}

/**
 * 时间节律：
 * - 夜晚（22:00-06:59）提高 sleep 倾向
 * - 白天（07:00-21:59）提高 follow 活跃度
 */
function getRhythmProfile(now = new Date()): { sleepMultiplier: number; dayFollowChance: number } {
  const hour = now.getHours()
  const isNight = hour >= 22 || hour < 7
  if (isNight) return { sleepMultiplier: 1.45, dayFollowChance: 0 }
  return { sleepMultiplier: 0.72, dayFollowChance: 0.28 }
}

let unlistenRemind: (() => void) | null = null
let unlistenStateCmd: (() => void) | null = null
let unlistenAppState: (() => void) | null = null
let inactivityTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await petStore.init()

  appState.value = await window.electronAPI.getAppState()
  unlistenAppState = window.electronAPI.onAppStateChanged((state) => {
    appState.value = state
  })

  unlistenRemind = window.electronAPI.onReminderTrigger((type: ReminderType) => {
    markInteraction()
    petStore.handleRemind()
    const msgMap: Record<ReminderType, string> = {
      water: '该喝水啦，补充点水分。',
      sedentary: '已经久坐一段时间了，起来活动一下吧。',
      pomodoroWorkEnd: '番茄钟工作阶段结束，休息一下。',
      pomodoroBreakEnd: '休息结束，准备开始下一轮专注。',
    }
    showBubble({ text: msgMap[type], category: 'reminder' })
  })

  unlistenStateCmd = window.electronAPI.onPetStateCmd((state) => {
    markInteraction()
    petStore.command(state)
  })

  inactivityTimer = setInterval(() => {
    const now = Date.now()
    const inactiveMs = now - lastInteractAt.value
    const profile = getRhythmProfile()

    // 与现有 6 秒巡检兼容，叠加“刚醒防回睡”
    let sleepInput = inactiveMs * profile.sleepMultiplier
    if (now < wakeSleepShieldUntil.value) {
      sleepInput = Math.max(0, sleepInput - (wakeSleepShieldUntil.value - now))
    }
    petStore.tickInactivity(sleepInput)

    // 白天提升活跃度，但 follow 刚完成后短时间内优先保持 idle
    const canBoostFollow =
      profile.dayFollowChance > 0 &&
      now >= followSettleUntil.value &&
      !isHovered.value &&
      !isDragging.value &&
      (petStore.state === 'idle' || petStore.state === 'wait') &&
      inactiveMs < 18000

    if (canBoostFollow && Math.random() < profile.dayFollowChance) {
      petStore.command('follow')
    }
  }, INACTIVITY_TICK_MS)
})

onUnmounted(() => {
  unlistenRemind?.()
  unlistenStateCmd?.()
  unlistenAppState?.()
  if (idleLookTimer) clearInterval(idleLookTimer)
  if (inactivityTimer) clearInterval(inactivityTimer)
  if (wakeAnimTimer) clearTimeout(wakeAnimTimer)
  petStore.$dispose()
  cleanupBubble()
})
</script>

<style scoped>
.pet-window {
  width: 200px;
  height: 200px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 6px;
  cursor: grab;
  user-select: none;
}

.pet-window:active {
  cursor: grabbing;
}

.pet-area {
  cursor: pointer;
  transition: filter 0.22s ease;
}

.bubble-anchor {
  position: absolute;
  bottom: 152px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.settings-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  font-size: 13px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
  opacity: 0.06;
  transition: opacity 0.2s, background 0.2s;
}

.pet-window:hover .settings-btn {
  opacity: 0.5;
}

.settings-btn:hover {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.8);
}
</style>
