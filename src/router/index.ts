import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HoyView from '@/views/HoyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/entrar',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    { path: '/', name: 'hoy', component: HoyView },
    {
      path: '/historial',
      name: 'historial',
      component: () => import('@/views/HistorialView.vue'),
    },
    {
      path: '/historial/:id',
      name: 'sesion',
      component: () => import('@/views/SesionDetalleView.vue'),
    },
    {
      path: '/ajustes',
      name: 'ajustes',
      component: () => import('@/views/AjustesView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()
  if (!to.meta.public && !auth.user) return { name: 'login' }
  if (to.name === 'login' && auth.user) return { name: 'hoy' }
  return true
})

export default router
