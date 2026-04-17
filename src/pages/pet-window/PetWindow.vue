<template>
  <div class="pet-window" @mousedown="startDrag">

    <!-- 宠物区域：hover / 单击 / 双击 均绑定在这里 -->
    <div
      class="pet-area"
      @click="onPetClick"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <PetLayeredCharacter
        :state="petStore.state"
        :anim-override="animOverride"
        :is-hovered="isHovered"
        :facing-right="currentFacingRight"
      />
    </div>

    <!-- 气泡定位锚点：在宠物头顶上方 -->
    <div class="bubble-anchor">
      <BubbleDisplay :visible="bubbleVisible" :text="bubbleText" />
    </div>

    <!-- 设置入口：平时隐藏，hover 窗口时淡入 -->
    <button class="settings-btn" @click.stop="openSettings" title="打开设置">⚙</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import PetLayeredCharacter from '@/modules/pet/components/PetLayeredCharacter.vue'
import { BubbleDisplay, useBubble } from '@/modules/bubble'
import { usePetStore } from '@/app/stores/pet'
import { useDrag } from '@/app/composables/useDrag'
import { useInteraction } from '@/modules/pet/useInteraction'
import { usePetBehavior } from '@/composables/usePetBehavior'

// ── 状态 & 业务 ───────────────────────────────────────────────────────────
const petStore = usePetStore()

// ── 气泡 ──────────────────────────────────────────────────────────────────
const {
  visible: bubbleVisible,
  text: bubbleText,
  show: showBubble,
  cleanup: cleanupBubble,
} = useBubble()

// ── 拖拽 ──────────────────────────────────────────────────────────────────
const { hasMoved, startDrag } = useDrag({
  onDragStart: () => petStore.onDragStart(),
  onDragEnd: (x, y) => petStore.onDragEnd(x, y),
})

// ── 互动（单击/双击/hover）────────────────────────────────────────────────
const { isHovered, animOverride, onPetClick, onMouseEnter, onMouseLeave } =
  useInteraction(petStore, hasMoved, showBubble)

// ── follow 移动 + wait 注视 ───────────────────────────────────────────────
const stateRef = computed(() => petStore.state)
const { facingRight: behaviorFacingRight } = usePetBehavior(stateRef, () => petStore.onFollowArrived())

// ── idle 随机看向方向 ─────────────────────────────────────────────────────
const idleLookRight = ref(true)
let idleLookTimer: ReturnType<typeof setInterval> | null = null

watch(stateRef, (s) => {
  if (s === 'idle') {
    idleLookTimer = setInterval(() => {
      idleLookRight.value = Math.random() > 0.5
    }, 4000 + Math.random() * 5000)
  } else {
    if (idleLookTimer) { clearInterval(idleLookTimer); idleLookTimer = null }
  }
}, { immediate: true })

// ── 综合朝向：各状态使用不同来源 ─────────────────────────────────────────
const currentFacingRight = computed(() => {
  const s = petStore.state
  if (s === 'follow' || s === 'wait') return behaviorFacingRight.value
  if (s === 'idle') return idleLookRight.value
  return true
})

// ── 工具 ──────────────────────────────────────────────────────────────────
function openSettings(): void {
  window.electronAPI.openSettings()
}

// ── 生命周期 ──────────────────────────────────────────────────────────────
let unlistenRemind: (() => void) | null = null
let unlistenStateCmd: (() => void) | null = null

onMounted(async () => {
  await petStore.init()

  // 提醒联动：主进程推送 → 状态切换 + 气泡文案
  unlistenRemind = window.electronAPI.onReminderTrigger((type) => {
    petStore.handleRemind()
    const msgMap: Record<string, string> = {
      water:      '该喝水了，再卷也得补水 💧',
      offWork:    '快到下班时间了，再坚持一下！',
      lunchBreak: '午休时间到，休息一会儿吧',
    }
    showBubble({ text: msgMap[type] ?? undefined, category: 'reminder' })
  })

  // 托盘状态命令：直接切换状态机
  unlistenStateCmd = window.electronAPI.onPetStateCmd((state) => {
    petStore.command(state)
  })
})

onUnmounted(() => {
  unlistenRemind?.()
  unlistenStateCmd?.()
  if (idleLookTimer) clearInterval(idleLookTimer)
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

/* 气泡定位：宠物头顶上方约 152px 处 */
.bubble-anchor {
  position: absolute;
  bottom: 152px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

/* 设置按钮：平时几乎透明，hover 窗口后淡入 */
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
