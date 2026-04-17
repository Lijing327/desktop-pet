<template>
  <!-- 方向翻转层 -->
  <div class="pet-flip" :class="{ 'flip-left': !isFacingRight }">
    <!-- 状态动画层（CSS keyframe） -->
    <div class="pet-wrap" :class="bodyClass">
      <!-- look-at 轻微旋转层（JS 驱动） -->
      <div class="pet-look" :style="lookStyle">
        <!-- 背景已去除的猫咪图像 -->
        <canvas
          ref="canvasRef"
          class="pet-canvas"
          :class="{ 'pet-hovered': isHovered }"
          :width="DISPLAY_W"
          :height="DISPLAY_H"
        />
        <!-- SVG overlay：眨眼遮盖 -->
        <svg
          class="pet-overlay"
          :width="DISPLAY_W"
          :height="DISPLAY_H"
          :viewBox="`0 0 ${DISPLAY_W} ${DISPLAY_H}`"
          xmlns="http://www.w3.org/2000/svg"
        >
          <template v-if="isBlinking">
            <ellipse
              :cx="META.eyes.left.cx * DISPLAY_W"
              :cy="META.eyes.left.cy * DISPLAY_H"
              :rx="META.eyes.left.rx * DISPLAY_W"
              :ry="META.eyes.left.ry * DISPLAY_H"
              :fill="META.eyes.left.furColor"
            />
            <ellipse
              :cx="META.eyes.right.cx * DISPLAY_W"
              :cy="META.eyes.right.cy * DISPLAY_H"
              :rx="META.eyes.right.rx * DISPLAY_W"
              :ry="META.eyes.right.ry * DISPLAY_H"
              :fill="META.eyes.right.furColor"
            />
          </template>
        </svg>
      </div>

      <!-- ZZZ（sleep） -->
      <Transition name="pet-fade">
        <div v-if="state === 'sleep'" class="zzz-wrap" aria-hidden="true">
          <span class="z z1">z</span>
          <span class="z z2">z</span>
          <span class="z z3">Z</span>
        </div>
      </Transition>

      <!-- 星星特效（follow / react） -->
      <Transition name="pet-fade">
        <div
          v-if="state === 'follow' || state === 'react'"
          class="sparkles-wrap"
          aria-hidden="true"
        >
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { PetState } from '@/types'
import META from '@/assets/pets/golden-tabby/meta.json'
import { usePetBlink } from '../composables/usePetBlink'
import { usePetLookAt } from '../composables/usePetLookAt'
import { usePetIdleMotion } from '../composables/usePetIdleMotion'
import { usePetRig } from '../composables/usePetRig'
import catImgUrl from '@/assets/pets/golden-tabby/base/full.png'

const props = defineProps<{
  state: PetState
  animOverride?: string
  isHovered?: boolean
  facingRight?: boolean
}>()

const DISPLAY_W = META.displaySize.width
const DISPLAY_H = META.displaySize.height

const stateRef      = computed(() => props.state)
const overrideRef   = computed(() => props.animOverride)
const isFacingRight = computed(() => props.facingRight !== false)

const { isBlinking }       = usePetBlink(stateRef)
const { lookAngle }        = usePetLookAt(stateRef, isFacingRight)
const { bodyClass }        = usePetIdleMotion(stateRef, overrideRef)
const { lookStyle }        = usePetRig(stateRef, lookAngle)

// ── canvas 背景去除 ────────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  const img = await loadImage(catImgUrl)
  ctx.drawImage(img, 0, 0, DISPLAY_W, DISPLAY_H)
  removeCheckerBg(ctx, DISPLAY_W, DISPLAY_H, META.bgRemoval.tolerance)
})

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * BFS flood fill 从所有边缘像素出发，把棋盘格背景设为透明
 * tolerance：颜色距离阈值（欧氏距离的平方，tolerance=30 → threshSq=900）
 */
function removeCheckerBg(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tolerance: number,
): void {
  const imageData = ctx.getImageData(0, 0, w, h)
  const { data } = imageData
  const threshSq  = tolerance * tolerance

  // 从 8 个采样点（4 角 + 4 边中点）收集背景色样本
  const sampleCoords = [
    [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
    [w >> 1, 0], [0, h >> 1], [w - 1, h >> 1], [w >> 1, h - 1],
  ]
  const bgColors: Array<[number, number, number]> = sampleCoords.map(([x, y]) => {
    const i = (y * w + x) * 4
    return [data[i], data[i + 1], data[i + 2]]
  })

  function isBg(pi: number): boolean {
    const r = data[pi], g = data[pi + 1], b = data[pi + 2]
    return bgColors.some(([br, bg_, bb]) => {
      const dr = r - br, dg = g - bg_, db = b - bb
      return dr * dr + dg * dg + db * db <= threshSq
    })
  }

  const visited = new Uint8Array(w * h)
  const queue: number[] = []

  // 将所有边缘像素加入队列
  for (let x = 0; x < w; x++) {
    const t = x, bot = (h - 1) * w + x
    if (!visited[t])   { visited[t] = 1;   queue.push(t) }
    if (!visited[bot]) { visited[bot] = 1; queue.push(bot) }
  }
  for (let y = 1; y < h - 1; y++) {
    const l = y * w, r = y * w + w - 1
    if (!visited[l]) { visited[l] = 1; queue.push(l) }
    if (!visited[r]) { visited[r] = 1; queue.push(r) }
  }

  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    const pi  = idx * 4
    if (!isBg(pi)) continue

    data[pi + 3] = 0  // 完全透明

    const x = idx % w
    const y = (idx / w) | 0
    if (x > 0     && !visited[idx - 1]) { visited[idx - 1] = 1; queue.push(idx - 1) }
    if (x < w - 1 && !visited[idx + 1]) { visited[idx + 1] = 1; queue.push(idx + 1) }
    if (y > 0     && !visited[idx - w]) { visited[idx - w] = 1; queue.push(idx - w) }
    if (y < h - 1 && !visited[idx + w]) { visited[idx + w] = 1; queue.push(idx + w) }
  }

  ctx.putImageData(imageData, 0, 0)
}
</script>

<style scoped>
/* ── 方向翻转 ── */
.pet-flip {
  transition: transform 0.2s ease;
}
.pet-flip.flip-left {
  transform: scaleX(-1);
}

/* ── 动画容器 ── */
.pet-wrap {
  width: 170px;
  height: 170px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  transform-origin: bottom center;
}

/* ── look-at 旋转层 ── */
.pet-look {
  position: relative;
  transform-origin: bottom center;
}

/* ── canvas 主体 ── */
.pet-canvas {
  display: block;
  width: 160px;
  height: 160px;
  filter: drop-shadow(0 6px 16px rgba(180, 100, 20, 0.28));
  transition: filter 0.25s ease;
}

.pet-hovered .pet-canvas,
.pet-canvas.pet-hovered {
  filter: drop-shadow(0 6px 22px rgba(200, 130, 30, 0.55)) brightness(1.06);
}

/* ── SVG overlay 贴合 canvas ── */
.pet-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

/* ══════════ 动画 keyframes ══════════ */
@keyframes breathe {
  0%, 100% { transform: scaleY(1)     scaleX(1); }
  50%       { transform: scaleY(1.025) scaleX(0.983); }
}

@keyframes walk-bob {
  0%, 100% { transform: translateY(0)    rotate(0deg); }
  25%       { transform: translateY(-6px) rotate(-3deg); }
  50%       { transform: translateY(-2px) rotate(0deg); }
  75%       { transform: translateY(-5px) rotate(3deg); }
}

@keyframes sleep-drift {
  0%, 100% { transform: rotate(-4deg) translateY(0); }
  50%       { transform: rotate(-4deg) translateY(3px); }
}

@keyframes pet-bounce {
  0%   { transform: scale(1)    translateY(0); }
  18%  { transform: scale(1.13) translateY(-12px); }
  36%  { transform: scale(0.94) translateY(0); }
  54%  { transform: scale(1.07) translateY(-6px); }
  72%  { transform: scale(0.97) translateY(0); }
  90%  { transform: scale(1.02) translateY(-2px); }
  100% { transform: scale(1)    translateY(0); }
}

@keyframes pet-shake {
  0%, 100%           { transform: translateX(0); }
  15%, 45%, 75%      { transform: translateX(-6px); }
  30%, 60%, 90%      { transform: translateX(6px); }
}

@keyframes pet-excited {
  0%   { transform: scale(1)    rotate(0deg); }
  12%  { transform: scale(1.18) rotate(-13deg); }
  26%  { transform: scale(1.18) rotate(13deg); }
  40%  { transform: scale(1.13) rotate(-8deg); }
  54%  { transform: scale(1.08) rotate(8deg); }
  68%  { transform: scale(1.04) rotate(-3deg); }
  84%  { transform: scale(1.01) rotate(1deg); }
  100% { transform: scale(1)    rotate(0deg); }
}

.anim-breathe { animation: breathe     3.5s  ease-in-out infinite; }
.anim-walk    { animation: walk-bob    0.75s ease-in-out infinite; }
.anim-sleep   { animation: sleep-drift 4s    ease-in-out infinite; }
.anim-bounce  { animation: pet-bounce  0.62s ease-out; }
.anim-shake   { animation: pet-shake   0.45s ease-in-out 2; }
.anim-excited { animation: pet-excited 0.72s ease-out; }

/* ══════════ ZZZ ══════════ */
.zzz-wrap {
  position: absolute;
  top: 6px;
  right: 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}
.z {
  color: #9b9bb8;
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

/* ══════════ 星星 ══════════ */
.sparkles-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.spark {
  position: absolute;
  color: #F5A623;
  animation: sparkle-pop 0.65s ease-out forwards;
}
.s1 { top: 12px; left: 14px;   font-size: 14px; animation-delay: 0s; }
.s2 { top: 6px;  right: 18px;  font-size: 10px; animation-delay: 0.1s; }
.s3 { bottom: 30px; right: 8px; font-size: 12px; animation-delay: 0.2s; }

@keyframes sparkle-pop {
  0%   { opacity: 0; transform: scale(0) rotate(0deg); }
  50%  { opacity: 1; transform: scale(1.3) rotate(20deg); }
  100% { opacity: 0; transform: scale(0.8) rotate(45deg) translateY(-10px); }
}

/* ══════════ 感叹号 ══════════ */
.exclaim-wrap {
  position: absolute;
  top: 0;
  right: 10px;
  pointer-events: none;
}
.exclaim {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #E8760A;
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
