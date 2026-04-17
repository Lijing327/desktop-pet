import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/pet',
    },
    {
      path: '/pet',
      component: () => import('@/pages/pet-window/PetWindow.vue'),
    },
    {
      path: '/settings',
      component: () => import('@/pages/settings-window/SettingsWindow.vue'),
    },
  ],
})

export default router
