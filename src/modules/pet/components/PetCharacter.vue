<template>
  <div class="pet-wrap" :class="[animClass, { 'pet-hovered': isHovered }]">
    <!-- 宠物主体 SVG — 100×110 坐标系 -->
    <svg class="pet-svg" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
      <!-- 耳朵 -->
      <polygon points="14,44 23,10 37,42" fill="#FFB7D5" />
      <polygon points="19,43 24,18 35,41" fill="#FF8EC4" />
      <polygon points="63,42 77,10 86,44" fill="#FFB7D5" />
      <polygon points="65,41 76,18 81,43" fill="#FF8EC4" />

      <!-- 身体 -->
      <ellipse cx="50" cy="97" rx="27" ry="19" fill="#FFB7D5" />

      <!-- 头部 -->
      <circle cx="50" cy="56" r="36" fill="#FFB7D5" />

      <!-- 腮红 -->
      <ellipse cx="26" cy="63" rx="8" ry="5.5" fill="#FF8EC4" opacity="0.38" />
      <ellipse cx="74" cy="63" rx="8" ry="5.5" fill="#FF8EC4" opacity="0.38" />

      <!-- 眼睛：正常（idle / remind） -->
      <g v-if="faceType === 'normal' || faceType === 'wide'">
        <circle cx="37" cy="51" :r="faceType === 'wide' ? 9 : 7.5" fill="white" />
        <circle cx="63" cy="51" :r="faceType === 'wide' ? 9 : 7.5" fill="white" />
        <template v-if="!isBlinking">
          <circle cx="38.5" cy="52" :r="faceType === 'wide' ? 5.5 : 5" fill="#2a1a1a" />
          <circle cx="64.5" cy="52" :r="faceType === 'wide' ? 5.5 : 5" fill="#2a1a1a" />
          <circle cx="40.5" cy="50" r="1.5" fill="white" />
          <circle cx="66.5" cy="50" r="1.5" fill="white" />
        </template>
        <!-- 眨眼遮挡 -->
        <template v-else>
          <rect x="29.5" y="47" width="15" height="9" rx="4.5" fill="#FFB7D5" />
          <rect x="55.5" y="47" width="15" height="9" rx="4.5" fill="#FFB7D5" />
        </template>
      </g>

      <!-- 眼睛：开心弧形（walk / happy） -->
      <g v-if="faceType === 'happy'">
        <path d="M 30 56 Q 37 46 44 56" stroke="#2a1a1a" stroke-width="2.8"
          fill="none" stroke-linecap="round" />
        <path d="M 56 56 Q 63 46 70 56" stroke="#2a1a1a" stroke-width="2.8"
          fill="none" stroke-linecap="round" />
      </g>

      <!-- 眼睛：睡觉横线 -->
      <g v-if="faceType === 'sleep'">
        <line x1="30" y1="52" x2="44" y2="52" stroke="#2a1a1a" stroke-width="2.5"
          stroke-linecap="round" />
        <line x1="56" y1="52" x2="70" y2="52" stroke="#2a1a1a" stroke-width="2.5"
          stroke-linecap="round" />
      </g>

      <!-- 鼻子 -->
      <ellipse cx="50" cy="63" rx="3" ry="2.2" fill="#FF8EC4" />

      <!-- 嘴：idle 小笑 -->
      <path v-if="state === 'idle'"
        d="M 44 70 Q 50 75 56 70"
        stroke="#C4648A" stroke-width="1.8" fill="none" stroke-linecap="round" />

      <!-- 嘴：walk / happy 大笑 -->
      <path v-if="state === 'walk' || state === 'happy'"
        d="M 40 69 Q 50 79 60 69"
        stroke="#C4648A" stroke-width="2" fill="#FFC5D9" stroke-linecap="round" />

      <!-- 嘴：sleep 微弧 -->
      <path v-if="state === 'sleep'"
        d="M 45 70 Q 50 74 55 70"
        stroke="#C4648A" stroke-width="1.5" fill="none" stroke-linecap="round" />

      <!-- 嘴：remind 担心 -->
      <path v-if="state === 'remind'"
        d="M 43 73 Q 50 70 57 73"
        stroke="#C4648A" stroke-width="1.8" fill="none" stroke-linecap="round" />

      <!-- 愁眉（remind 状态） -->
      <g v-if="state === 'remind'">
        <path d="M 31 41 Q 37 37 43 41" stroke="#C4648A" stroke-width="1.8"
          fill="none" stroke-linecap="round" />
        <path d="M 57 41 Q 63 37 69 41" stroke="#C4648A" stroke-width="1.8"
          fill="none" stroke-linecap="round" />
      </g>

      <!-- 尾巴 -->
      <path d="M 74 106 Q 99 95 93 111 Q 87 122 73 116" fill="#FFB7D5" />
    </svg>

    <!-- ZZZ 浮动（sleep） -->
    <Transition name="pet-fade">
      <div v-if="state === 'sleep'" class="zzz-wrap" aria-hidden="true">
        <span class="z z1">z</span>
        <span class="z z2">z</span>
        <span class="z z3">Z</span>
      </div>
    </Transition>

    <!-- 星星特效（happy） -->
    <Transition name="pet-fade">
      <div v-if="state === 'happy'" class="sparkles-wrap" aria-hidden="true">
        <span class="spark s1">✦</span>
        <span class="spark s2">✦</span>
        <span class="spark s3">✦</span>
      </div>
    </Transition>

    <!-- 感叹号（remind） -->
    <Transition name="pet-fade">
      <div v-if="state === 'remind'" class="exclaim-wrap" aria-hidden="true">
        <span class="exclaim">!</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { PetState } from '@/types'

const props = defineProps<{
  state: PetState
  /** 临时覆盖状态机动画（如双击兴奋），undefined 时回归状态机动画 */
  animOverride?: string
  /** hover 时施加发光效果 */
  isHovered?: boolean
}>()

// ── 面部类型 ──────────────────────────────────────────────────────────────
const faceType = computed((): 'normal' | 'happy' | 'sleep' | 'wide' => {
  const map: Record<PetState, 'normal' | 'happy' | 'sleep' | 'wide'> = {
    idle:   'normal',
    walk:   'happy',
    sleep:  'sleep',
    happy:  'happy',
    remind: 'wide',
  }
  return map[props.state]
})

// ── 动画类名（animOverride 优先于状态机映射）────────────────────────────
const STATE_ANIM: Record<PetState, string> = {
  idle:   'anim-breathe',
  walk:   'anim-walk',
  sleep:  'anim-sleep',
  happy:  'anim-bounce',
  remind: 'anim-shake',
}
const animClass = computed(() => props.animOverride ?? STATE_ANIM[props.state])

// ── 眨眼（仅 idle 状态周期触发） ──────────────────────────────────────────
const isBlinking = ref(false)
let blinkTimer: ReturnType<typeof setInterval> | null = null

function scheduleBlink(): void {
  blinkTimer = setInterval(() => {
    if (props.state !== 'idle') return
    isBlinking.value = true
    setTimeout(() => (isBlinking.value = false), 140)
  }, 2800 + Math.random() * 2000)
}

onMounted(scheduleBlink)
onUnmounted(() => {
  if (blinkTimer) clearInterval(blinkTimer)
})

// 切换到非 idle 时立即清除眨眼
watch(() => props.state, (s) => {
  if (s !== 'idle') isBlinking.value = false
})
</script>

<style scoped>
.pet-wrap {
  width: 130px;
  height: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  transform-origin: bottom center;
}

.pet-svg {
  width: 115px;
  height: 126px;
  filter: drop-shadow(0 5px 14px rgba(255, 100, 160, 0.22));
}

/* ══════════ 动画 ══════════ */
@keyframes breathe {
  0%, 100% { transform: scaleY(1) scaleX(1); }
  50%       { transform: scaleY(1.027) scaleX(0.981); }
}

@keyframes walk-bob {
  0%, 100% { transform: translateY(0)   rotate(0deg); }
  25%      { transform: translateY(-6px) rotate(-3.5deg); }
  50%      { transform: translateY(-2px) rotate(0deg); }
  75%      { transform: translateY(-5px) rotate(3.5deg); }
}

@keyframes sleep-drift {
  0%, 100% { transform: rotate(-4deg) translateY(0); }
  50%      { transform: rotate(-4deg) translateY(3px); }
}

@keyframes pet-bounce {
  0%   { transform: scale(1)    translateY(0); }
  18%  { transform: scale(1.14) translateY(-13px); }
  36%  { transform: scale(0.93) translateY(0); }
  54%  { transform: scale(1.08) translateY(-7px); }
  72%  { transform: scale(0.97) translateY(0); }
  90%  { transform: scale(1.03) translateY(-3px); }
  100% { transform: scale(1)    translateY(0); }
}

@keyframes pet-shake {
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-6px); }
  30%, 60%, 90% { transform: translateX(6px); }
}

.anim-breathe  { animation: breathe      3.5s  ease-in-out infinite; }
.anim-walk     { animation: walk-bob     0.75s ease-in-out infinite; }
.anim-sleep    { animation: sleep-drift  4s    ease-in-out infinite; }
.anim-bounce   { animation: pet-bounce   0.62s ease-out; }
.anim-shake    { animation: pet-shake    0.45s ease-in-out 2; }
.anim-excited  { animation: pet-excited  0.72s ease-out; }

@keyframes pet-excited {
  0%   { transform: scale(1)    rotate(0deg); }
  12%  { transform: scale(1.2)  rotate(-14deg); }
  26%  { transform: scale(1.2)  rotate(14deg); }
  40%  { transform: scale(1.15) rotate(-9deg); }
  54%  { transform: scale(1.1)  rotate(9deg); }
  68%  { transform: scale(1.05) rotate(-4deg); }
  84%  { transform: scale(1.02) rotate(2deg); }
  100% { transform: scale(1)    rotate(0deg); }
}

/* ══════════ Hover 发光效果 ══════════ */
.pet-svg {
  transition: filter 0.25s ease;
}

.pet-hovered .pet-svg {
  filter: drop-shadow(0 5px 20px rgba(255, 100, 160, 0.52)) brightness(1.06);
}

/* ══════════ 覆盖层 ══════════ */

/* ZZZ */
.zzz-wrap {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}
.z {
  color: #b0aac8;
  font-weight: 700;
  opacity: 0;
  animation: zzz-float 2.2s ease-in-out infinite;
}
.z1 { font-size: 9px;  animation-delay: 0s; }
.z2 { font-size: 11px; animation-delay: 0.75s; }
.z3 { font-size: 14px; animation-delay: 1.5s; }

@keyframes zzz-float {
  0%   { opacity: 0; transform: translate(0, 0); }
  25%  { opacity: 1; }
  100% { opacity: 0; transform: translate(8px, -16px); }
}

/* 星星 */
.sparkles-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.spark {
  position: absolute;
  color: #FFD700;
  animation: sparkle-pop 0.65s ease-out forwards;
}
.s1 { top: 10px; left: 12px;  font-size: 14px; animation-delay: 0s; }
.s2 { top: 4px;  right: 16px; font-size: 10px; animation-delay: 0.1s; }
.s3 { bottom: 28px; right: 6px; font-size: 12px; animation-delay: 0.2s; }

@keyframes sparkle-pop {
  0%   { opacity: 0; transform: scale(0) rotate(0deg); }
  50%  { opacity: 1; transform: scale(1.3) rotate(20deg); }
  100% { opacity: 0; transform: scale(0.8) rotate(45deg) translateY(-10px); }
}

/* 感叹号 */
.exclaim-wrap {
  position: absolute;
  top: 0;
  right: 12px;
  pointer-events: none;
}
.exclaim {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #FF6B35;
  animation: exclaim-pop 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes exclaim-pop {
  0%   { transform: scale(0);   opacity: 0; }
  60%  { transform: scale(1.3); }
  100% { transform: scale(1);   opacity: 1; }
}

/* ══════════ 过渡 ══════════ */
.pet-fade-enter-active,
.pet-fade-leave-active { transition: opacity 0.25s ease; }
.pet-fade-enter-from,
.pet-fade-leave-to     { opacity: 0; }
</style>
