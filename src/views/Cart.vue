<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'
import { getFullImageUrl } from '../utils/image'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

const checkoutLoading = ref(false)
const checkoutError = ref('')
const checkoutSuccess = ref(false)

const orderForm = ref({
  customerName: '',
  phoneNumber: '',
  comment: ''
})

const handleCheckout = async () => {
  if (cartStore.isEmpty) return

  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: '/cart' } })
    return
  }

  if (!orderForm.value.customerName || !orderForm.value.phoneNumber) {
    checkoutError.value = 'Укажите имя и телефон для оформления заказа.'
    return
  }

  checkoutLoading.value = true
  checkoutError.value = ''
  checkoutSuccess.value = false

  try {
    await api.post('/api/order/create', {
      customerName: orderForm.value.customerName,
      phoneNumber: orderForm.value.phoneNumber,
      comment: orderForm.value.comment || '',
      items: cartStore.getOrderItems()
    })

    checkoutSuccess.value = true
    cartStore.clearCart()
    orderForm.value = { customerName: '', phoneNumber: '', comment: '' }
  } catch (err) {
    checkoutError.value =
      err.response?.data?.message || 'Не удалось оформить заказ.'
  } finally {
    checkoutLoading.value = false
  }
}
</script>

<template>
  <div class="cart-page">
    <div class="page-header">
      <h1>🛒 Корзина</h1>
      <p v-if="!cartStore.isEmpty">
        {{ cartStore.totalItems }} {{ cartStore.totalItems === 1 ? 'товар' : 'товаров' }}
      </p>
    </div>

    <div v-if="checkoutSuccess" class="success-banner">
      ✅ Заказ успешно оформлен! Спасибо за покупку в ПЛАНЕТА.
    </div>

    <div v-if="cartStore.isEmpty && !checkoutSuccess" class="empty-cart">
      <span class="empty-icon">🛒</span>
      <h2>Корзина пуста</h2>
      <p>Добавьте аксессуары из каталога</p>
      <button @click="router.push('/')" class="btn-primary">Перейти в каталог</button>
    </div>

    <div v-else-if="!checkoutSuccess" class="cart-layout">
      <section class="cart-items">
        <article
          v-for="item in cartStore.items"
          :key="item.productId"
          class="cart-item"
        >
          <img
            :src="getFullImageUrl(item.imageUrl)"
            :alt="item.name"
            class="item-image"
            @click="router.push(`/products/${item.productId}`)"
          />

          <div class="item-info">
            <h3 @click="router.push(`/products/${item.productId}`)">{{ item.name }}</h3>
            <p class="item-price">{{ item.price.toLocaleString() }} сом / шт.</p>
          </div>

          <div class="qty-control">
            <button @click="cartStore.updateQuantity(item.productId, item.quantity - 1)">−</button>
            <span>{{ item.quantity }}</span>
            <button @click="cartStore.updateQuantity(item.productId, item.quantity + 1)">+</button>
          </div>

          <strong class="item-total">
            {{ (item.price * item.quantity).toLocaleString() }} сом
          </strong>

          <button
            @click="cartStore.removeItem(item.productId)"
            class="btn-remove"
            title="Удалить"
          >
            ✕
          </button>
        </article>

        <button @click="cartStore.clearCart()" class="btn-clear">
          Очистить корзину
        </button>
      </section>

      <aside class="checkout-panel">
        <h2>Оформление заказа</h2>

        <div class="summary-row">
          <span>Товаров</span>
          <strong>{{ cartStore.totalItems }} шт.</strong>
        </div>
        <div class="summary-row total">
          <span>Итого</span>
          <strong>{{ cartStore.totalPrice.toLocaleString() }} сом</strong>
        </div>

        <div v-if="!authStore.isAuthenticated" class="auth-hint">
          Для оформления заказа нужно
          <router-link to="/login">войти</router-link>
          в аккаунт.
        </div>

        <form v-else @submit.prevent="handleCheckout" class="checkout-form">
          <input
            v-model="orderForm.customerName"
            type="text"
            placeholder="Ваше имя *"
            required
          />
          <input
            v-model="orderForm.phoneNumber"
            type="tel"
            placeholder="Телефон * (+996...)"
            required
          />
          <textarea
            v-model="orderForm.comment"
            rows="3"
            placeholder="Комментарий к заказу"
          ></textarea>

          <p v-if="checkoutError" class="error-msg">{{ checkoutError }}</p>

          <button type="submit" class="btn-checkout" :disabled="checkoutLoading">
            {{ checkoutLoading ? 'Оформление...' : '✅ Оформить заказ' }}
          </button>
        </form>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.cart-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 28px;
}

.page-header p {
  margin: 0 0 24px;
  color: var(--planet-muted);
}

.success-banner {
  background: #f0fdf4;
  color: #166534;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
  margin-bottom: 20px;
  font-weight: 500;
}

.empty-cart {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: var(--planet-radius);
  box-shadow: var(--planet-shadow);
  border: 1px solid var(--planet-border);
}

.empty-icon {
  font-size: 56px;
}

.empty-cart h2 {
  margin: 12px 0 6px;
}

.empty-cart p {
  color: var(--planet-muted);
  margin: 0 0 24px;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto auto;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid var(--planet-border);
  box-shadow: var(--planet-shadow);
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
  background: #faf5ff;
  border-radius: 10px;
  cursor: pointer;
}

.item-info h3 {
  margin: 0 0 4px;
  font-size: 15px;
  cursor: pointer;
}

.item-info h3:hover {
  color: var(--planet-primary);
}

.item-price {
  margin: 0;
  font-size: 13px;
  color: var(--planet-muted);
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  border-radius: 10px;
  padding: 4px;
}

.qty-control button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--planet-border);
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

.qty-control span {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
}

.item-total {
  color: #059669;
  font-size: 15px;
  white-space: nowrap;
}

.btn-remove {
  background: #fef2f2;
  color: #dc2626;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-clear {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: var(--planet-muted);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  margin-top: 4px;
}

.checkout-panel {
  background: white;
  border: 1px solid var(--planet-border);
  border-radius: var(--planet-radius);
  padding: 24px;
  box-shadow: var(--planet-shadow);
  position: sticky;
  top: 90px;
}

.checkout-panel h2 {
  margin: 0 0 20px;
  font-size: 18px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
  color: var(--planet-muted);
  border-bottom: 1px solid var(--planet-border);
}

.summary-row.total {
  border-bottom: none;
  padding-top: 16px;
  font-size: 18px;
  color: #111827;
}

.summary-row.total strong {
  color: #059669;
  font-size: 22px;
}

.auth-hint {
  margin-top: 20px;
  padding: 14px;
  background: #faf5ff;
  border-radius: 10px;
  font-size: 14px;
  color: #4b5563;
}

.auth-hint a {
  color: var(--planet-primary);
  font-weight: 600;
}

.checkout-form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkout-form input,
.checkout-form textarea {
  padding: 11px 14px;
  border: 1px solid var(--planet-border);
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
}

.checkout-form input:focus,
.checkout-form textarea:focus {
  outline: none;
  border-color: var(--planet-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.error-msg {
  color: #dc2626;
  font-size: 13px;
  margin: 0;
}

.btn-checkout {
  background: linear-gradient(135deg, #1e1b4b, #4c1d95);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 4px;
}

.btn-checkout:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 70px 1fr;
    grid-template-rows: auto auto;
  }

  .qty-control,
  .item-total,
  .btn-remove {
    grid-column: 2;
  }

  .checkout-panel {
    position: static;
  }
}
</style>
