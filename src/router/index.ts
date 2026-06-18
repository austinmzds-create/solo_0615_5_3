import { createRouter, createWebHistory } from 'vue-router'
import { getSessionUser, getRoleDashboardRoute } from '../utils/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { public: true }
    },
    {
      path: '/leave-approval',
      name: 'LeaveApproval',
      component: () => import('../views/LeaveApproval.vue'),
      meta: { role: 'teacher' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const sessionUser = getSessionUser()

  if (to.meta.public) {
    if (sessionUser) {
      const dashboard = getRoleDashboardRoute(sessionUser.role)
      if (dashboard) {
        next(dashboard)
        return
      }
    }
    next()
    return
  }

  if (!sessionUser) {
    next('/login')
    return
  }

  if (to.meta.role && to.meta.role !== sessionUser.role) {
    const dashboard = getRoleDashboardRoute(sessionUser.role)
    if (dashboard) {
      next(dashboard)
    } else {
      next('/login')
    }
    return
  }

  next()
})

export default router
