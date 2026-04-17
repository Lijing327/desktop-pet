<template>
  <Transition name="bubble">
    <div v-if="visible" class="bubble-box" role="status" aria-live="polite">
      {{ text }}
      <span class="tail" aria-hidden="true" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  text: string
}>()
</script>

<style scoped>
.bubble-box {
  position: relative;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 14px;
  padding: 7px 14px;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
  max-width: 160px;
  text-align: center;
  word-break: break-all;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.11);
  pointer-events: none;
  backdrop-filter: blur(6px);
  white-space: normal;
}

/* 气泡小尾巴（朝下，指向宠物）*/
.tail {
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  display: block;
  width: 0;
  height: 0;
  border: 7px solid transparent;
  border-bottom: none;
  border-top-color: rgba(255, 255, 255, 0.96);
}

/* ── 进出场动画 ── */
.bubble-enter-active,
.bubble-leave-active {
  transition: opacity 0.26s ease, transform 0.26s ease;
}
.bubble-enter-from,
.bubble-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.94);
}
</style>
