import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Статические импорты основных страниц приложения
import Catalog from '../views/Catalog.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ProductDetails from '../views/ProductDetails.vue' 
import CreateProduct from '../views/CreateProduct.vue'
import Cart from '../views/Cart.vue'

// Ленивая загрузка для админ-панели
const AdminOrders = () => import('../views/AdminOrders.vue')
const EditProduct = () => import('../views/EditProduct.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'catalog',
      component: Catalog,
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
      // <-- 2. ДОБАВИЛИ МАРШРУТ РЕДАКТИРОВАНИЯ С ДИНАМИЧЕСКИМ ID
      path: '/admin/edit-product/:productId', 
      name: 'edit-product',
      component: EditProduct,
      meta: { 
        requiresAuth: true, 
        allowedRoles: ['Admin', 'Manager'] // Доступ только для сотрудников
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

  // 1. Если страница требует авторизации
  if (to.meta.requiresAuth) {
    
    // Если пользователь не залогинен — перенаправляем на страницу входа
    if (!authStore.isAuthenticated) {
      return { name: 'login' }
    }

    // 2. Если у страницы настроены ограничения по ролям
    if (to.meta.allowedRoles) {
      // Проверяем, есть ли у залогиненного пользователя нужная роль через геттеры Pinia
      const hasAccess = authStore.isAdmin || authStore.isManager
      
      if (!hasAccess) {
        alert('Доступ запрещен! У вас нет прав менеджера или администратора.')
        return { name: 'catalog' } // Возвращаем пользователя в безопасное место
      }
    }
  }
})

export default router