import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/types'  // 注册 window.electronAPI 类型

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
