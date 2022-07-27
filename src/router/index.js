import { createRouter, createWebHashHistory } from 'vue-router'
import Page1 from '../views/Page1.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Page1
  },
  {
    path: '/download',
    name: 'download',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/Page2.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
