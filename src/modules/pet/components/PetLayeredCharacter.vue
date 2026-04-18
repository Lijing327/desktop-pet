<template>
  <div class="pet-flip" :class="{ 'flip-left': !isFacingRight }">
    <div
      class="pet-wrap"
      :class="[bodyClass, { 'is-dragging': isDragging }]"
      :data-idle-layer-ready="idleLayerHook.enabled ? '1' : '0'"
      :data-ear-flick="idleLayerHook.earFlick ?? ''"
    >
      <div class="pet-look" :style="lookStyle">
        <Transition name="state-crossfade" mode="out-in">
          <div
            v-if="idleLayerRenderEnabled"
            key="idle-layered"
            class="idle-layer-stage"
            :class="{ 'pet-hovered': isHovered }"
            :style="{ width: `${DISPLAY_W}px`, height: `${DISPLAY_H}px` }"
          >
            <!-- 舞台级部件 1：tail -->
            <img
              v-if="showTail"
              class="layer part-tail"
              :src="layerAssets.tail"
              alt="tail"
              :style="withDebugOutline(stageStyles.tail)"
              draggable="false"
            />

            <!-- 舞台级部件 2：body -->
            <img
              class="layer part-body"
              :src="layerAssets.body"
              alt="body"
              :style="withDebugOutline(stageStyles.body)"
              draggable="false"
            />

            <!-- 舞台级部件 3：headWrap（头部局部坐标系） -->
            <div class="head-wrap" :style="withDebugOutline(stageStyles.headWrap, 'rgba(64, 224, 208, 0.95)')">
              <img
                class="head-image"
                :src="layerAssets.head"
                alt="head"
                draggable="false"
              />

              <img
                v-if="showEars"
                class="layer part-ear-left"
                :src="layerAssets.earL"
                alt="ear-left"
                :style="withDebugOutline(headLocalStyles.earL)"
                draggable="false"
              />
              <img
                v-if="showEars"
                class="layer part-ear-right"
                :src="layerAssets.earR"
                alt="ear-right"
                :style="withDebugOutline(headLocalStyles.earR)"
                draggable="false"
              />
              <img
                class="layer part-eye-left"
                :src="(RESTORE_BLINK && isBlinking) ? layerAssets.eyeLClose : layerAssets.eyeLOpen"
                alt="eye-left"
                :style="withDebugOutline(headLocalStyles.eyeL)"
                draggable="false"
              />
              <img
                class="layer part-eye-right"
                :src="(RESTORE_BLINK && isBlinking) ? layerAssets.eyeRClose : layerAssets.eyeROpen"
                alt="eye-right"
                :style="withDebugOutline(headLocalStyles.eyeR)"
                draggable="false"
              />

              <template v-if="SHOW_LAYER_DEBUG">
                <span v-if="showEars" class="pivot-dot" :style="headLocalPivotStyles.earL" />
                <span v-if="showEars" class="pivot-dot" :style="headLocalPivotStyles.earR" />
                <span class="pivot-dot" :style="headLocalPivotStyles.eyeL" />
                <span class="pivot-dot" :style="headLocalPivotStyles.eyeR" />
              </template>
            </div>

            <template v-if="SHOW_LAYER_DEBUG">
              <span v-if="showTail" class="pivot-dot" :style="stagePivotStyles.tail" />
              <span class="pivot-dot" :style="stagePivotStyles.body" />
              <span class="pivot-dot" :style="stagePivotStyles.headWrap" />
            </template>
          </div>

          <img
            v-else
            :key="imageRenderKey"
            class="pet-image"
            :class="{ 'pet-hovered': isHovered }"
            :src="currentImage"
            :alt="`桌宠-${state}`"
            :style="{ width: `${DISPLAY_W}px`, height: `${DISPLAY_H}px` }"
            draggable="false"
          />
        </Transition>
      </div>

      <Transition name="pet-fade">
        <div v-if="state === 'sleep'" class="zzz-wrap" aria-hidden="true">
          <span class="z z1">z</span>
          <span class="z z2">z</span>
          <span class="z z3">Z</span>
        </div>
      </Transition>

      <Transition name="pet-fade">
        <div
          v-if="state === 'follow' || state === 'react'"
          class="sparkles-wrap"
          aria-hidden="true"
        >
          <span class="spark s1">*</span>
          <span class="spark s2">*</span>
          <span class="spark s3">*</span>
        </div>
      </Transition>

      <Transition name="pet-fade">
        <div v-if="state === 'remind'" class="exclaim-wrap" aria-hidden="true">
          <span class="exclaim">!</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { PetState } from '@/types'
import META from '@/assets/pets/golden-tabby/meta.json'
import idleImage from '@/assets/pets/golden-tabby/states/idle-sit.png'
import runImage from '@/assets/pets/golden-tabby/states/run-frame.png'
import reactImage from '@/assets/pets/golden-tabby/states/react-tilt.png'
import sleepImage from '@/assets/pets/golden-tabby/states/sleep.png'
import bodyLayer from '@/assets/pets/golden-tabby/layers/body.png'
import headLayer from '@/assets/pets/golden-tabby/layers/head.png'
import tailLayer from '@/assets/pets/golden-tabby/layers/tail.png'
import earLeftLayer from '@/assets/pets/golden-tabby/layers/ear-left.png'
import earRightLayer from '@/assets/pets/golden-tabby/layers/ear-right.png'
import eyeLeftOpenLayer from '@/assets/pets/golden-tabby/layers/eye-left-open.png'
import eyeLeftCloseLayer from '@/assets/pets/golden-tabby/layers/eye-left-close.png'
import eyeRightOpenLayer from '@/assets/pets/golden-tabby/layers/eye-right-open.png'
import eyeRightCloseLayer from '@/assets/pets/golden-tabby/layers/eye-right-close.png'
import { usePetLookAt } from '../composables/usePetLookAt'
import { usePetIdleMotion } from '../composables/usePetIdleMotion'
import { usePetRig } from '../composables/usePetRig'
import { usePetBlink } from '../composables/usePetBlink'

const props = defineProps<{
  state: PetState
  animOverride?: string
  isHovered?: boolean
  facingRight?: boolean
  isDragging?: boolean
  /** 路线B预留：仅在 idle 下启用拆层动画 */
  enableIdleLayerRig?: boolean
}>()

type LayerPartKey = 'body' | 'head' | 'tail' | 'earL' | 'earR' | 'eyeL' | 'eyeR'

interface LayerPlacement {
  x: number
  y: number
  w: number
  h: number
  pivot: { x: number; y: number }
}

const DISPLAY_W = META.displaySize.width
const DISPLAY_H = META.displaySize.height

const stateRef = computed(() => props.state)
const overrideRef = computed(() => props.animOverride)
const isFacingRight = computed(() => props.facingRight !== false)

const { lookAngle } = usePetLookAt(stateRef, isFacingRight)
const { bodyClass, earFlick } = usePetIdleMotion(stateRef, overrideRef)
const { lookStyle } = usePetRig(stateRef, lookAngle)
const { isBlinking } = usePetBlink(
  stateRef,
  META.animation.blinkIntervalMin,
  META.animation.blinkIntervalRandom,
  META.animation.blinkDuration,
)

/** 状态图映射：保持当前状态机兼容 */
const STATE_IMAGE_MAP: Record<PetState, string> = {
  idle: idleImage,
  follow: runImage,
  wait: idleImage,
  sleep: sleepImage,
  drag: idleImage,
  react: reactImage,
  remind: reactImage,
}

/** annoyed 资源可选：缺失时自动回退到 react 图 */
const annoyedAssetMap = import.meta.glob('/src/assets/pets/golden-tabby/states/annoyed.*', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const annoyedImage = Object.values(annoyedAssetMap)[0]
const hasAnnoyedImage = typeof annoyedImage === 'string' && annoyedImage.length > 0

const currentImage = computed(() => {
  if (props.animOverride === 'anim-annoyed' && hasAnnoyedImage) return annoyedImage
  return STATE_IMAGE_MAP[props.state]
})

/** 视觉状态 key：只在核心状态切换时触发过渡，避免 wait/drag 抖动 */
const visualStateKey = computed(() => {
  if (props.state === 'follow') return 'follow'
  if (props.state === 'sleep') return 'sleep'
  if (props.state === 'react' || props.state === 'remind') return 'react'
  return 'idle'
})

const imageRenderKey = computed(() => {
  if (props.animOverride === 'anim-annoyed' && hasAnnoyedImage) return `${visualStateKey.value}-annoyed`
  return `${visualStateKey.value}-default`
})

/**
 * 路线B接口预留：
 * - enabled: 是否启用 idle 拆层
 * - earFlick: 复用既有耳朵轻抖信号
 */
const idleLayerHook = computed(() => ({
  enabled: props.enableIdleLayerRig === true && props.state === 'idle',
  earFlick: earFlick.value,
}))

const layerAssets = {
  body: bodyLayer,
  head: headLayer,
  tail: tailLayer,
  earL: earLeftLayer,
  earR: earRightLayer,
  eyeLOpen: eyeLeftOpenLayer,
  eyeLClose: eyeLeftCloseLayer,
  eyeROpen: eyeRightOpenLayer,
  eyeRClose: eyeRightCloseLayer,
}

const layerConfig = META.idleLayerRig as {
  sourceSize: { width: number; height: number }
  headLocalAdjust?: { x?: number; y?: number }
  earLocalAdjust?: {
    left?: { x?: number; y?: number }
    right?: { x?: number; y?: number }
  }
  eyeLocalAdjust?: {
    left?: { x?: number; y?: number }
    right?: { x?: number; y?: number }
  }
  parts: Record<LayerPartKey, LayerPlacement>
}

/** debug 开关：URL 带 ?petDebug=1 时显示边框和 pivot 点 */
const SHOW_LAYER_DEBUG = (() => {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('petDebug') === '1'
})()

/**
 * 头部局部校准阶段：
 * - 1：仅 body/head/eyes（隐藏 ear + tail）
 * - 2：恢复 ear，tail 继续隐藏
 * - 0：全部显示（正常）
 * 默认阶段 2，便于直接看脸+耳贴合效果
 */
const LOCAL_CALIB_PHASE: number = 2
const showTail = LOCAL_CALIB_PHASE === 0
const showEars = LOCAL_CALIB_PHASE >= 2

/** 角色主包围盒：仅基于 body/head/tail 计算显示缩放 */
const mainBounds = (() => {
  const body = layerConfig.parts.body
  const head = layerConfig.parts.head
  const tail = layerConfig.parts.tail
  const minX = Math.min(body.x, head.x, tail.x)
  const minY = Math.min(body.y, head.y, tail.y)
  const maxX = Math.max(body.x + body.w, head.x + head.w, tail.x + tail.w)
  const maxY = Math.max(body.y + body.h, head.y + head.h, tail.y + tail.h)
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
})()

/** 目标显示占比：角色高度约占窗口 65%~78%，当前取 72% */
const TARGET_HEIGHT_RATIO = 0.72
const TARGET_WIDTH_RATIO = 0.90
const LAYER_SCALE = Math.min(
  (DISPLAY_H * TARGET_HEIGHT_RATIO) / mainBounds.height,
  (DISPLAY_W * TARGET_WIDTH_RATIO) / mainBounds.width,
)

/** 将角色主包围盒放到窗口中下区域 */
const STAGE_OFFSET_X = (DISPLAY_W - mainBounds.width * LAYER_SCALE) * 0.5 - mainBounds.minX * LAYER_SCALE
const STAGE_OFFSET_Y = DISPLAY_H * 0.9 - mainBounds.maxY * LAYER_SCALE

const idleLayerRenderEnabled = computed(() => {
  return idleLayerHook.value.enabled && Boolean(layerConfig && layerConfig.parts)
})

/** 逐步恢复 idle 动画的阶段开关（已按顺序恢复） */
const RESTORE_BLINK = true
const RESTORE_HEAD_SWAY = true
const RESTORE_TAIL_SWING = true
const RESTORE_EAR_FLICK = false

const frameTime = ref(0)
let frameTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  frameTimer = setInterval(() => {
    frameTime.value += 0.1
  }, 16)
})

onUnmounted(() => {
  if (frameTimer) clearInterval(frameTimer)
})

function stagePartStyle(part: LayerPartKey): Record<string, string> {
  const conf = layerConfig.parts[part]
  // 舞台定位严格按：left/top/width/height = x/y/w/h * scale
  return {
    left: `${conf.x * LAYER_SCALE + STAGE_OFFSET_X}px`,
    top: `${conf.y * LAYER_SCALE + STAGE_OFFSET_Y}px`,
    width: `${conf.w * LAYER_SCALE}px`,
    height: `${conf.h * LAYER_SCALE}px`,
    transformOrigin: `${conf.pivot.x * 100}% ${conf.pivot.y * 100}%`,
  }
}

/** 头部局部坐标：localX/localY = (part - head) * scale */
function headLocalPartStyle(part: 'earL' | 'earR' | 'eyeL' | 'eyeR'): Record<string, string> {
  const p = layerConfig.parts[part]
  const h = layerConfig.parts.head
  const headAdjust = {
    x: layerConfig.headLocalAdjust?.x ?? 0,
    y: layerConfig.headLocalAdjust?.y ?? 0,
  }
  const earAdjustMap = {
    earL: {
      x: layerConfig.earLocalAdjust?.left?.x ?? 0,
      y: layerConfig.earLocalAdjust?.left?.y ?? 0,
    },
    earR: {
      x: layerConfig.earLocalAdjust?.right?.x ?? 0,
      y: layerConfig.earLocalAdjust?.right?.y ?? 0,
    },
  }
  const eyeAdjustMap = {
    eyeL: {
      x: layerConfig.eyeLocalAdjust?.left?.x ?? 0,
      y: layerConfig.eyeLocalAdjust?.left?.y ?? 0,
    },
    eyeR: {
      x: layerConfig.eyeLocalAdjust?.right?.x ?? 0,
      y: layerConfig.eyeLocalAdjust?.right?.y ?? 0,
    },
  }
  const extra =
    part === 'earL' || part === 'earR'
      ? earAdjustMap[part]
      : eyeAdjustMap[part as 'eyeL' | 'eyeR']

  return {
    // 局部坐标：基于 head 局部坐标系 + 校准偏移
    left: `${(p.x - h.x) * LAYER_SCALE + headAdjust.x + extra.x}px`,
    top: `${(p.y - h.y) * LAYER_SCALE + headAdjust.y + extra.y}px`,
    width: `${p.w * LAYER_SCALE}px`,
    height: `${p.h * LAYER_SCALE}px`,
    transformOrigin: `${p.pivot.x * 100}% ${p.pivot.y * 100}%`,
  }
}

function withDebugOutline(style: Record<string, string>, color = 'rgba(255, 80, 80, 0.95)'): Record<string, string> {
  if (!SHOW_LAYER_DEBUG) return style
  return {
    ...style,
    outline: `1px dashed ${color}`,
    outlineOffset: '-1px',
  }
}

const stagePivotStyles = computed(() => {
  const build = (part: 'tail' | 'body' | 'head') => {
    const p = layerConfig.parts[part]
    const left = p.x * LAYER_SCALE + STAGE_OFFSET_X + p.w * LAYER_SCALE * p.pivot.x
    const top = p.y * LAYER_SCALE + STAGE_OFFSET_Y + p.h * LAYER_SCALE * p.pivot.y
    return { left: `${left}px`, top: `${top}px` }
  }
  return {
    tail: build('tail'),
    body: build('body'),
    headWrap: build('head'),
  }
})

const headLocalPivotStyles = computed(() => {
  const build = (part: 'earL' | 'earR' | 'eyeL' | 'eyeR') => {
    const p = layerConfig.parts[part]
    const h = layerConfig.parts.head
    const localX = (p.x - h.x) * LAYER_SCALE + p.w * LAYER_SCALE * p.pivot.x
    const localY = (p.y - h.y) * LAYER_SCALE + p.h * LAYER_SCALE * p.pivot.y
    return { left: `${localX}px`, top: `${localY}px` }
  }
  return {
    earL: build('earL'),
    earR: build('earR'),
    eyeL: build('eyeL'),
    eyeR: build('eyeR'),
  }
})

const stageStyles = computed(() => {
  const t = frameTime.value

  const tail = stagePartStyle('tail')
  const body = stagePartStyle('body')
  const headWrap = stagePartStyle('head')

  const tailRotate = RESTORE_TAIL_SWING ? Math.sin(t * 1.55) * 10 : 0
  const headRotate = RESTORE_HEAD_SWAY ? Math.sin(t * 0.62) * 2 + lookAngle.value : 0

  return {
    tail: {
      ...tail,
      transform: `rotate(${tailRotate}deg)`,
    },
    body,
    headWrap: {
      ...headWrap,
      transform: `rotate(${headRotate}deg)`,
    },
  }
})

const headLocalStyles = computed(() => {
  const t = frameTime.value
  const earSignal = idleLayerHook.value.earFlick
  const flickL = RESTORE_EAR_FLICK ? (earSignal === 'left' ? 5.5 : 0) : 0
  const flickR = RESTORE_EAR_FLICK ? (earSignal === 'right' ? -5.5 : 0) : 0

  return {
    earL: {
      ...headLocalPartStyle('earL'),
      transform: `rotate(${flickL + Math.sin(t * 1.8) * (RESTORE_EAR_FLICK ? 1.2 : 0)}deg)`,
    },
    earR: {
      ...headLocalPartStyle('earR'),
      transform: `rotate(${flickR - Math.sin(t * 1.8) * (RESTORE_EAR_FLICK ? 1.2 : 0)}deg)`,
    },
    eyeL: headLocalPartStyle('eyeL'),
    eyeR: headLocalPartStyle('eyeR'),
  }
})

</script>

<style scoped>
.pet-flip {
  transition: transform 0.2s ease;
}

.pet-flip.flip-left {
  transform: scaleX(-1);
}

.pet-wrap {
  width: 170px;
  height: 170px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  transform-origin: bottom center;
  transition: transform 200ms ease;
}

.pet-look {
  position: relative;
  transform-origin: bottom center;
}

.pet-image {
  display: block;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 6px 16px rgba(180, 100, 20, 0.28));
  transition: filter 0.25s ease;
}

.pet-image.pet-hovered {
  filter: drop-shadow(0 6px 22px rgba(200, 130, 30, 0.55)) brightness(1.06);
}

.idle-layer-stage {
  position: relative;
  overflow: hidden;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 6px 16px rgba(180, 100, 20, 0.28));
  transition: filter 0.25s ease;
}

.idle-layer-stage.pet-hovered {
  filter: drop-shadow(0 6px 22px rgba(200, 130, 30, 0.55)) brightness(1.06);
}

.layer {
  position: absolute;
  display: block;
  user-select: none;
  pointer-events: none;
}

.head-wrap {
  position: absolute;
  overflow: visible;
}

.head-image {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: none;
}

.pivot-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e5ff;
  border: 1px solid #003a44;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
}

.pet-wrap.is-dragging {
  transform: scale(1.04) translateY(-5px);
}

@keyframes breathe {
  0%, 100% { transform: scaleY(1) scaleX(1); }
  50% { transform: scaleY(1.022) scaleX(0.986); }
}

@keyframes walk-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(-2.6deg); }
  50% { transform: translateY(-1px) rotate(0deg); }
  75% { transform: translateY(-4px) rotate(2.6deg); }
}

@keyframes sleep-breathe {
  0%, 100% { transform: rotate(-2.5deg) scale(1); }
  50% { transform: rotate(-2.5deg) scale(0.985); }
}

@keyframes react-pop {
  0% { transform: scale(1); }
  25% { transform: scale(1.08); }
  55% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes pet-shake {
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-6px); }
  30%, 60%, 90% { transform: translateX(6px); }
}

@keyframes pet-excited {
  0% { transform: scale(1) rotate(0deg); }
  16% { transform: scale(1.15) rotate(-8deg); }
  36% { transform: scale(1.11) rotate(8deg); }
  56% { transform: scale(1.06) rotate(-4deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes wake-pop {
  0% { transform: scale(0.94) translateY(4px); }
  50% { transform: scale(1.05) translateY(-2px); }
  100% { transform: scale(1) translateY(0); }
}

@keyframes annoyed-jitter {
  0% { transform: scale(1) translateX(0); }
  16% { transform: scale(1.04) translateX(-5px) rotate(-2deg); }
  32% { transform: scale(0.98) translateX(5px) rotate(2deg); }
  48% { transform: scale(1.03) translateX(-4px) rotate(-1deg); }
  64% { transform: scale(0.99) translateX(4px) rotate(1deg); }
  100% { transform: scale(1) translateX(0); }
}

@keyframes observe-peek {
  0% { transform: rotate(0deg) translateX(0); }
  35% { transform: rotate(-2.2deg) translateX(-2px); }
  70% { transform: rotate(2deg) translateX(2px); }
  100% { transform: rotate(0deg) translateX(0); }
}

.anim-breathe { animation: breathe 3.6s ease-in-out infinite; }
.anim-walk { animation: walk-bob 0.72s ease-in-out infinite; }
.anim-sleep { animation: sleep-breathe 4.8s ease-in-out infinite; }
.anim-bounce { animation: react-pop 0.48s ease-out; }
.anim-shake { animation: pet-shake 0.45s ease-in-out 2; }
.anim-excited { animation: pet-excited 0.72s ease-out; }
.anim-annoyed { animation: annoyed-jitter 0.56s ease-out; }
.anim-observe { animation: observe-peek 0.52s ease-in-out; }
.anim-wake { animation: wake-pop 0.42s ease-out; }

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

.z1 { font-size: 9px; animation-delay: 0s; }
.z2 { font-size: 11px; animation-delay: 0.75s; }
.z3 { font-size: 14px; animation-delay: 1.5s; }

@keyframes zzz-float {
  0% { opacity: 0; transform: translate(0, 0); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: translate(8px, -16px); }
}

.sparkles-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.spark {
  position: absolute;
  color: #f5a623;
  animation: sparkle-pop 0.65s ease-out forwards;
}

.s1 { top: 12px; left: 14px; font-size: 14px; animation-delay: 0s; }
.s2 { top: 6px; right: 18px; font-size: 10px; animation-delay: 0.1s; }
.s3 { bottom: 30px; right: 8px; font-size: 12px; animation-delay: 0.2s; }

@keyframes sparkle-pop {
  0% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.3) rotate(20deg); }
  100% { opacity: 0; transform: scale(0.8) rotate(45deg) translateY(-10px); }
}

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
  color: #e8760a;
  animation: exclaim-pop 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes exclaim-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.pet-fade-enter-active,
.pet-fade-leave-active {
  transition: opacity 0.25s ease;
}

.pet-fade-enter-from,
.pet-fade-leave-to {
  opacity: 0;
}

.state-crossfade-enter-active,
.state-crossfade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.state-crossfade-enter-from,
.state-crossfade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
