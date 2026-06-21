<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api/axios'

const orders = ref([])
const loading = ref(true)
const errorMsg = ref('')
const expandedOrderId = ref(null)

const stats = computed(() => {
  const total = orders.value.length
  const newCount = orders.value.filter((o) => !o.isProcessed).length
  const processed = orders.value.filter((o) => o.isProcessed).length
  const revenue = orders.value.reduce(
    (sum, o) => sum + Number(o.totalPrice || 0),
    0
  )
  return { total, newCount, processed, revenue }
})

const fetchOrders = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const response = await api.get('/api/order/admin/all-orders')
    orders.value = response.data
  } catch (err) {
    errorMsg.value =
      'Не удалось загрузить заказы. Нужна роль Admin или Manager.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const toggleExpand = (orderId) => {
  expandedOrderId.value = expandedOrderId.value === orderId ? null : orderId
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="orders-page">
    <div class="page-header">
      <div>
        <h1>📋 Заказы</h1>
        <p>Панель управления заказами магазина ПЛАНЕТА</p>
      </div>
      <button @click="fetchOrders" class="btn-refresh" :disabled="loading">
        {{ loading ? '...' : '🔄 Обновить' }}
      </button>
    </div>

    <div v-if="!loading && !errorMsg" class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Всего заказов</span>
        <strong class="stat-value">{{ stats.total }}</strong>
      </div>
      <div class="stat-card stat-new">
        <span class="stat-label">Новые</span>
        <strong class="stat-value">{{ stats.newCount }}</strong>
      </div>
      <div class="stat-card stat-done">
        <span class="stat-label">Обработаны</span>
        <strong class="stat-value">{{ stats.processed }}</strong>
      </div>
      <div class="stat-card stat-revenue">
        <span class="stat-label">Сумма</span>
        <strong class="stat-value">{{ stats.revenue.toLocaleString() }} сом</strong>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка заказов...</p>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <div v-if="!loading && !errorMsg">
      <div v-if="orders.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <h3>Заказов пока нет</h3>
        <p>Когда клиенты оформят заказы, они появятся здесь</p>
      </div>

      <div v-else class="orders-list">
        <article
          v-for="order in orders"
          :key="order.id"
          class="order-card"
          :class="{ expanded: expandedOrderId === order.id }"
        >
          <div class="order-main" @click="toggleExpand(order.id)">
            <div class="order-id">
              <span class="id-label">Заказ</span>
              <strong>#{{ order.id }}</strong>
            </div>

            <div class="order-info">
              <span class="client-name">{{ order.userName }}</span>
              <span class="client-phone">{{ order.phoneNumber }}</span>
            </div>

            <div class="order-date">{{ formatDate(order.orderDate) }}</div>

            <div class="order-price">
              {{ Number(order.totalPrice).toLocaleString() }} сом
            </div>

            <span
              :class="['status-badge', order.isProcessed ? 'processed' : 'new']"
            >
              {{ order.isProcessed ? 'Обработан' : 'Новый' }}
            </span>

            <span class="expand-icon">
              {{ expandedOrderId === order.id ? '▲' : '▼' }}
            </span>
          </div>

          <div v-if="expandedOrderId === order.id" class="order-details">
            <p v-if="order.comment" class="order-comment">
              <strong>Комментарий:</strong> {{ order.comment }}
            </p>

            <table v-if="order.items?.length" class="items-table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id">
                  <td>{{ item.productName }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ Number(item.priceAtPurchase).toLocaleString() }} сом</td>
                  <td>
                    {{
                      (
                        Number(item.priceAtPurchase) * item.quantity
                      ).toLocaleString()
                    }}
                    сом
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: var(--planet-muted);
}

.btn-refresh {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border: 1px solid var(--planet-border);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: var(--planet-shadow);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--planet-muted);
  font-weight: 500;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  color: #111827;
}

.stat-new .stat-value {
  color: #d97706;
}

.stat-done .stat-value {
  color: #059669;
}

.stat-revenue .stat-value {
  font-size: 18px;
  color: var(--planet-primary);
}

.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: var(--planet-radius);
  box-shadow: var(--planet-shadow);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #ede9fe;
  border-top-color: var(--planet-primary);
  border-radius: 50%;
  margin: 0 auto 12px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #fecaca;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: var(--planet-radius);
  box-shadow: var(--planet-shadow);
  border: 1px solid var(--planet-border);
}

.empty-icon {
  font-size: 48px;
}

.empty-state h3 {
  margin: 12px 0 6px;
}

.empty-state p {
  margin: 0;
  color: var(--planet-muted);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: white;
  border: 1px solid var(--planet-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--planet-shadow);
  transition: 0.2s;
}

.order-card.expanded {
  border-color: #c4b5fd;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
}

.order-main {
  display: grid;
  grid-template-columns: 80px 1fr 140px 120px 100px 24px;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: 0.15s;
}

.order-main:hover {
  background: #fafafa;
}

.id-label {
  display: block;
  font-size: 11px;
  color: var(--planet-muted);
}

.order-id strong {
  font-size: 18px;
  color: var(--planet-primary);
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.client-name {
  font-weight: 600;
  font-size: 15px;
}

.client-phone {
  font-size: 13px;
  color: var(--planet-muted);
}

.order-date {
  font-size: 13px;
  color: var(--planet-muted);
}

.order-price {
  font-weight: 700;
  font-size: 15px;
  color: #059669;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.status-badge.new {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.processed {
  background: #dcfce7;
  color: #166534;
}

.expand-icon {
  color: var(--planet-muted);
  font-size: 12px;
}

.order-details {
  padding: 0 20px 18px;
  border-top: 1px solid var(--planet-border);
  background: #fafafa;
}

.order-comment {
  margin: 14px 0;
  font-size: 14px;
  color: #4b5563;
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--planet-border);
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.items-table th,
.items-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--planet-border);
}

.items-table th {
  background: #f5f3ff;
  color: #4b5563;
  font-weight: 600;
  font-size: 13px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .order-main {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .order-date,
  .expand-icon {
    display: none;
  }
}
</style>
