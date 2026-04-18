<template>
  <div class="settings-window">
    <header class="header">
      <h1>设置中心</h1>
      <span class="version">版本 v0.1.0</span>
    </header>

    <main v-if="settings" class="content">
      <section class="section">
        <h2>提醒系统</h2>

        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.reminders.pomodoroEnabled" @change="save" />
            番茄钟提醒
          </label>
        </div>
        <div v-if="settings.reminders.pomodoroEnabled" class="sub-grid">
          <label>
            工作时长（分钟）
            <input
              type="number"
              min="1"
              max="180"
              v-model.number="settings.reminders.pomodoroWorkMinutes"
              @change="save"
            />
          </label>
          <label>
            休息时长（分钟）
            <input
              type="number"
              min="1"
              max="60"
              v-model.number="settings.reminders.pomodoroBreakMinutes"
              @change="save"
            />
          </label>
        </div>

        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.reminders.waterEnabled" @change="save" />
            喝水提醒
          </label>
        </div>
        <div v-if="settings.reminders.waterEnabled" class="sub-grid">
          <label>
            间隔（分钟）
            <input
              type="number"
              min="15"
              max="240"
              v-model.number="settings.reminders.waterIntervalMinutes"
              @change="save"
            />
          </label>
        </div>

        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.reminders.sedentaryEnabled" @change="save" />
            久坐提醒
          </label>
        </div>
        <div v-if="settings.reminders.sedentaryEnabled" class="sub-grid">
          <label>
            间隔（分钟）
            <input
              type="number"
              min="20"
              max="240"
              v-model.number="settings.reminders.sedentaryIntervalMinutes"
              @change="save"
            />
          </label>
        </div>
      </section>

      <section class="section">
        <h2>互动设置</h2>
        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.interaction.bubbleEnabled" @change="save" />
            显示气泡文案
          </label>
        </div>
        <div class="field">
          <span>气泡频率</span>
          <select v-model="settings.interaction.bubbleFrequency" @change="save">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
      </section>

      <section class="section">
        <h2>应用设置</h2>
        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.app.launchAtStartup" @change="save" />
            开机自启
          </label>
        </div>
        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.app.enableNotification" @change="save" />
            系统通知
          </label>
        </div>
        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.app.hideToTray" @change="save" />
            关闭时最小化到托盘
          </label>
        </div>
      </section>
    </main>

    <div v-else class="loading">加载中...</div>

    <footer class="footer">
      <button class="btn-close" @click="close">关闭</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { AppSettings } from '@/types'

const settings = ref<AppSettings | null>(null)

async function load(): Promise<void> {
  settings.value = await window.electronAPI.getSettings()
}

/**
 * 设置改动立即生效：
 * 1. 通过统一 IPC 保存到本地 store
 * 2. 主进程立即重建调度器
 */
async function save(): Promise<void> {
  if (!settings.value) return
  settings.value = await window.electronAPI.saveSettings(settings.value)
}

function close(): void {
  window.electronAPI.closeSettings()
}

onMounted(load)
</script>

<style scoped>
.settings-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f7;
  color: #1d1d1f;
}

.header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 20px 24px 12px;
  background: white;
  border-bottom: 1px solid #e5e5ea;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
}

.version {
  font-size: 12px;
  color: #8e8e93;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.section {
  background: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.section h2 {
  font-size: 13px;
  font-weight: 600;
  color: #6d6d72;
  margin-bottom: 12px;
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 15px;
}

.field label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.sub-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 6px 0 10px;
}

.sub-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #3a3a3c;
}

input[type='number'],
select {
  padding: 6px 8px;
  border: 1px solid #c7c7cc;
  border-radius: 6px;
  font-size: 13px;
  background: white;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e8e93;
}

.footer {
  padding: 12px 24px;
  background: white;
  border-top: 1px solid #e5e5ea;
  display: flex;
  justify-content: flex-end;
}

.btn-close {
  padding: 8px 20px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-close:hover {
  background: #0062cc;
}
</style>
