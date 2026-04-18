import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PetStateMachine } from '@/modules/pet/state-machine'
import type { PetState } from '@/types'

export const usePetStore = defineStore('pet', () => {
  const machine = new PetStateMachine()
  const state = ref<PetState>(machine.state)
  const position = ref({ x: 0, y: 0 })

  // 同步状态机到 reactive 状态
  const unsubscribe = machine.onChange((s) => {
    state.value = s
  })

  async function init(): Promise<void> {
    const settings = await window.electronAPI.getSettings()
    if (settings.petPosition.x !== -1) {
      position.value = settings.petPosition
    }
  }

  /** 外部命令切换（托盘 / IPC） */
  function command(to: PetState): void {
    machine.command(to)
  }

  /** 用户点击宠物 */
  function handleClick(): void {
    machine.triggerClick()
  }

  /** 鼠标靠近时触发短反馈 */
  function handleProximity(): void {
    machine.triggerProximity()
  }

  /** 提醒通知触发 */
  function handleRemind(): void {
    machine.triggerRemind()
  }

  /** follow 到达目标 */
  function onFollowArrived(): void {
    machine.onFollowArrived()
  }

  /** 根据无交互时长推进行为节奏 */
  function tickInactivity(inactiveMs: number): void {
    machine.maybeSleepByInactivity(inactiveMs)
  }

  /** 拖拽开始 */
  function onDragStart(): void {
    machine.onDragStart()
  }

  /** 拖拽结束并持久化位置 */
  async function onDragEnd(x: number, y: number): Promise<void> {
    machine.onDragEnd()
    position.value = { x, y }
    const settings = await window.electronAPI.getSettings()
    await window.electronAPI.saveSettings({ ...settings, petPosition: { x, y } })
  }

  // 兼容旧调用
  async function savePosition(x: number, y: number): Promise<void> {
    await onDragEnd(x, y)
  }

  function $dispose(): void {
    unsubscribe()
    machine.destroy()
  }

  return {
    state,
    position,
    init,
    command,
    handleClick,
    handleProximity,
    handleRemind,
    onFollowArrived,
    tickInactivity,
    onDragStart,
    onDragEnd,
    savePosition,
    $dispose,
  }
})
