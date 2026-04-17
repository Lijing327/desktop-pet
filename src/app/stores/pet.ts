import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PetStateMachine } from '@/modules/pet/state-machine'
import type { PetState } from '@/types'

export const usePetStore = defineStore('pet', () => {
  const machine = new PetStateMachine()
  const state = ref<PetState>(machine.state)
  const position = ref({ x: 0, y: 0 })

  // 同步状态机 → reactive ref
  const unsubscribe = machine.onChange((s) => {
    state.value = s
  })

  async function init(): Promise<void> {
    const settings = await window.electronAPI.getSettings()
    // -1 表示首次启动，保持主进程默认位置
    if (settings.petPosition.x !== -1) {
      position.value = settings.petPosition
    }
    machine.start()
  }

  function handleClick(): void {
    machine.triggerClick()
  }

  function handleRemind(): void {
    machine.triggerRemind()
  }

  async function savePosition(x: number, y: number): Promise<void> {
    position.value = { x, y }
    const settings = await window.electronAPI.getSettings()
    await window.electronAPI.saveSettings({ ...settings, petPosition: { x, y } })
  }

  function $dispose(): void {
    unsubscribe()
    machine.destroy()
  }

  return { state, position, init, handleClick, handleRemind, savePosition, $dispose }
})
