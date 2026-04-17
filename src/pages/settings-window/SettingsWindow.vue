<template>
  <div class="settings-window">
    <header class="header">
      <h1>设置</h1>
      <span class="version">v0.1.0 MVP</span>
    </header>

    <main class="content" v-if="settings">
      <!-- 提醒设置 -->
      <section class="section">
        <h2>提醒</h2>

        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.reminders.waterEnabled" @change="save" />
            喝水提醒
          </label>
          <div v-if="settings.reminders.waterEnabled" class="sub-field">
            每
            <input
              type="number"
              v-model.number="settings.reminders.waterIntervalMinutes"
              min="15"
              max="240"
              @change="save"
            />
            分钟提醒一次
          </div>
        </div>

        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.reminders.offWorkEnabled" @change="save" />
            下班提醒
          </label>
          <div v-if="settings.reminders.offWorkEnabled" class="sub-field">
            下班时间
            <input type="time" v-model="settings.reminders.offWorkTime" @change="save" />
          </div>
        </div>

        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.reminders.lunchBreakEnabled" @change="save" />
            午休提醒
          </label>
          <div v-if="settings.reminders.lunchBreakEnabled" class="sub-field">
            午休时间
            <input type="time" v-model="settings.reminders.lunchBreakTime" @change="save" />
          </div>
        </div>
      </section>

      <!-- 互动设置 -->
      <section class="section">
        <h2>互动</h2>
        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.interaction.bubbleEnabled" @change="save" />
            显示文案气泡
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

      <!-- 应用设置 -->
      <section class="section">
        <h2>应用</h2>
        <div class="field">
          <label>
            <input type="checkbox" v-model="settings.app.launchAtStartup" @change="save" />
            开机自启（P4 实现）
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
            关闭时最小化到托盘（P3 实现）
          </label>
        </div>
      </section>
    </main>

    <div v-else class="loading">加载中…</div>

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

async function save(): Promise<void> {
  if (settings.value) {
    await window.electronAPI.saveSettings(settings.value)
  }
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 15px;
}

.field label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.field input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.sub-field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #3a3a3c;
}

.sub-field input[type='number'] {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid #c7c7cc;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.sub-field input[type='time'] {
  padding: 4px 6px;
  border: 1px solid #c7c7cc;
  border-radius: 6px;
  font-size: 13px;
}

select {
  padding: 4px 8px;
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
