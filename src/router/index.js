import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    // Redirect /register to /login (registration happens via WorkOS AuthKit)
    path: '/register',
    redirect: '/login'
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallback.vue')
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: () => import('../views/Pricing.vue')
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../views/Terms.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../views/Privacy.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('../views/Schedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: () => import('../views/Contacts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/personas',
    name: 'Personas',
    component: () => import('../views/Personas.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/personas/config',
    name: 'PersonaConfig',
    component: () => import('../views/PersonaConfig.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/personas',
    name: 'PersonaAdmin',
    component: () => import('../views/PersonaAdmin.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/AdminLogin.vue'),
    meta: { requiresAdminGuest: true }
  },
  {
    path: '/admin/login/callback',
    name: 'AdminLoginCallback',
    component: () => import('../views/AdminLoginCallback.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAdminAuth: true }
  },
  {
    path: '/admin/personas/designer',
    name: 'PersonaDesigner',
    component: () => import('../views/PersonaDesigner.vue'),
    meta: { requiresAdminAuth: true }
  },
  {
    path: '/admin/schedule',
    name: 'AdminSchedule',
    component: () => import('../views/AdminSchedule.vue'),
    meta: { requiresAdminAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating to a new page
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const adminToken = localStorage.getItem('adminToken')

  // Admin authentication checks
  if (to.meta.requiresAdminAuth && !adminToken) {
    next('/admin/login')
  } else if (to.meta.requiresAdminGuest && adminToken) {
    next('/admin/dashboard')
  }
  // Regular user authentication checks
  else if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // Special case: /personas should redirect to /contacts for logged-in users
    if (to.path === '/personas') {
      next('/contacts')
    } else {
      next('/dashboard')
    }
  } else {
    next()
  }
})

export default router
