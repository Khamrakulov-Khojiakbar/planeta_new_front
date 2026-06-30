import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Статические импорты основных страниц приложения
import Catalog from '../views/Catalog.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ProductDetails from '../views/ProductDetails.vue'
import CreateProduct from '../views/CreateProduct.vue'
import Cart from '../views/Cart.vue'
import HomePage from '../views/HomePage.vue'
import Contacts from '../views/Contacts.vue'

// Ленивая загрузка для админ-панели
const AdminOrders = () => import('../views/AdminOrders.vue')
const EditProduct = () => import('../views/EditProduct.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'homepage',
      component: HomePage,
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: Catalog,
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: Contacts,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/products/:productId',
      name: 'product-details',
      component: ProductDetails,
    },
    {
      path: '/cart',
      name: 'cart',
      component: Cart,
    },
    {
      path: '/admin/create-product',
      name: 'create-product',
      component: CreateProduct,
      meta: {
        requiresAuth: true,
        allowedRoles: ['Admin', 'Manager']
      }
    },
    {
      path: '/admin/edit-product/:productId',
      name: 'edit-product',
      component: EditProduct,
      meta: {
        requiresAuth: true,
        allowedRoles: ['Admin', 'Manager']
      }
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: AdminOrders,
      meta: {
        requiresAuth: true,
        allowedRoles: ['Admin', 'Manager']
      }
    }
  ],
})

// СОВРЕМЕННАЯ И НАДЕЖНАЯ ЗАЩИТА СТРАНИЦ (Navigation Guard в стиле Vue 3)
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      return { name: 'login' }
    }

    if (to.meta.allowedRoles) {
      const hasAccess = authStore.isAdmin || authStore.isManager

      if (!hasAccess) {
        alert('Доступ запрещен! У вас нет прав менеджера или администратора.')
        return { name: 'catalog' }
      }
    }
  }
})

export default router