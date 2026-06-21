<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import api from '../api/axios'
import { getFullImageUrl } from '../utils/image'
import ProductImageManager from '../components/ProductImageManager.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

// Делаем id реактивным вычисляемым свойством, чтобы работал переход между товарами
const productId = computed(() => route.params.productId)

const product = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const activeImage = ref('')
const addedToCart = ref(false)

// Состояния для подходящих товаров
const relatedProducts = ref([])
const relatedLoading = ref(false)

const fetchProductDetails = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const response = await api.get(`/api/products/${productId.value}`)
    product.value = response.data

    if (product.value.mainImageUrl) {
      activeImage.value = product.value.mainImageUrl
    } else if (product.value.imageUrls?.length > 0) {
      activeImage.value = product.value.imageUrls[0]
    } else {
      activeImage.value = ''
    }

    // ВОЗВРАЩАЕМ: Поиск сопутствующих товаров по названию текущего устройства
    await fetchRelatedProducts(product.value.name)
  } catch (err) {
    errorMsg.value = 'Не удалось загрузить товар.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Поиск подходящих аксессуаров/товаров по названию текущего устройства
const fetchRelatedProducts = async (productName) => {
  if (!productName) return
  relatedLoading.value = true
  try {
    // Стучимся на стандартный GET api/products с параметром search
    const response = await api.get('/api/products', {
      params: { search: productName, pageSize: 6 }
    })
    
    // ИСПРАВЛЕНО: Безопасный разбор PagedResult с бэкенда (учитываем разный регистр)
    const items = response.data.items || response.data.Items || response.data || []
    
    // Исключаем сам текущий телефон из списка рекомендаций аксессуаров
    relatedProducts.value = items.filter(p => p.id !== Number(productId.value))
  } catch (err) {
    console.error('Ошибка загрузки подходящих товаров:', err)
    relatedProducts.value = []
  } finally {
    relatedLoading.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('Удалить этот товар из каталога?')) return

  try {
    await api.delete(`/api/products/${productId.value}`)
    router.push('/')
  } catch (err) {
    alert('Ошибка: ' + (err.response?.data?.message || err.message))
  }
}

const handleAddToCart = () => {
  if (!product.value) return
  cartStore.addItem(product.value)
  addedToCart.value = true
  setTimeout(() => {
    addedToCart.value = false
  }, 2500)
}

// Быстрое добавление сопутствующего товара в корзину прямо из ленты рекомендаций
const handleAddRelatedToCart = (item, event) => {
  event.stopPropagation() // Чтобы не срабатывал клик по карточке (переход на страницу)
  cartStore.addItem(item)
  alert(`Товар "${item.name}" добавлен в корзину!`)
}

const onImagesUpdated = async () => {
  await fetchProductDetails()
}

const setActiveImage = (url) => {
  activeImage.value = url
}

const allImages = () => {
  if (!product.value) return []
  const urls = []
  if (product.value.mainImageUrl) urls.push(product.value.mainImageUrl)
  product.value.imageUrls?.forEach((url) => {
    if (!urls.includes(url)) urls.push(url)
  })
  return urls
}

// СЛЕДИМ ЗА ИЗМЕНЕНИЕМ ID: Теперь при переходе на другой товар всё сбросится и перезагрузится заново
watch(productId, () => {
  relatedProducts.value = [] // Чистим старые рекомендации перед загрузкой, чтобы не было мерцания
  fetchProductDetails()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

onMounted(() => {
  fetchProductDetails()
})
</script>

<template>
  <div class="product-page">
    <button @click="router.push('/')" class="btn-back">← Назад в каталог</button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка товара...</p>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <div v-if="addedToCart" class="success-banner">
      ✅ Товар добавлен в корзину!
      <router-link to="/cart" class="cart-link">Перейти в корзину →</router-link>
    </div>

    <div v-if="product && !loading" class="product-layout">
      <div class="gallery-section">
        <div class="main-image-wrap">
          <img
            :src="getFullImageUrl(activeImage)"
            :alt="product.name"
            class="main-image"
          />
          <span v-if="product.isUsed" class="condition-badge used">Б/У</span>
          <span v-else class="condition-badge new">Новый</span>
        </div>

        <div v-if="allImages().length > 1" class="thumbnails">
          <button
            v-for="(url, index) in allImages()"
            :key="index"
            type="button"
            class="thumb-btn"
            :class="{ active: activeImage === url }"
            @click="setActiveImage(url)"
          >
            <img :src="getFullImageUrl(url)" :alt="`Фото ${index + 1}`" />
          </button>
        </div>
      </div>

      <div class="info-section">
        <span class="brand-tag">{{ product.brandName || 'PLANETA' }}</span>
        <h1>{{ product.name }}</h1>
        <p class="category-line">{{ product.categoryName }}</p>

        <div class="price-block">
          <span class="price">{{ Number(product.price).toLocaleString() }}</span>
          <span class="currency">сом</span>
        </div>

        <p class="description">
          {{ product.description || 'Описание для данного товара пока не добавлено.' }}
        </p>

        <div v-if="product.attributes?.length" class="specs-card">
          <h3>Характеристики</h3>
          <div class="specs-grid">
            <div
              v-for="(attr, index) in product.attributes"
              :key="index"
              class="spec-row"
            >
              <span class="spec-name">{{ attr.attributeName }}</span>
              <span class="spec-value">{{ attr.value }}</span>
            </div>
          </div>
        </div>

        <div class="cart-actions">
          <button @click="handleAddToCart" class="btn-add-cart">
            🛒 В корзину
          </button>
          <button @click="router.push('/cart')" class="btn-go-cart">
            Перейти в корзину
          </button>
        </div>

        <div
          v-if="authStore.isAdmin || authStore.isManager"
          class="admin-panel"
        >
          <div class="admin-header">
            <span>🛠️</span>
            <h3>Панель менеджера</h3>
          </div>

          <div class="admin-actions">
            <button
              @click="router.push(`/admin/edit-product/${product.id}`)"
              class="btn-edit"
            >
              ✏️ Редактировать
            </button>
            <button @click="handleDelete" class="btn-delete">
              🗑️ Удалить
            </button>
          </div>

          <ProductImageManager
            :product-id="product.id"
            @updated="onImagesUpdated"
          />
        </div>
      </div>
    </div>

    <div v-if="!loading && product && relatedProducts.length > 0" class="related-section">
      <h2 class="related-heading">С этим устройством так же покупают</h2>
      <p class="related-subheading">Аксессуары и сопутствующие товары, совместимые с {{ product.name }}</p>
      
      <div class="related-grid">
        <div 
          v-for="item in relatedProducts" 
          :key="item.id" 
          class="related-card"
          @click="router.push(`/products/${item.id}`)"
        >
          <div class="related-img-wrap">
            <img 
              :src="getFullImageUrl(item.mainImageUrl || item.imageUrls?.[0])" 
              :alt="item.name" 
              class="related-img"
            />
            <span v-if="item.isUsed" class="related-condition-badge">Б/У</span>
          </div>
          <div class="related-info">
            <span class="related-brand">{{ item.brandName || 'PLANETA' }}</span>
            <h4 class="related-title">{{ item.name }}</h4>
            <div class="related-footer">
              <div class="related-price-block">
                <span class="related-price">{{ Number(item.price).toLocaleString() }}</span>
                <span class="related-currency">сом</span>
              </div>
              <button 
                @click.stop="handleAddRelatedToCart(item, $event)" 
                class="related-add-cart-btn"
                title="Добавить в корзину"
              >
                🛒
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-page {
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 60px;
}

.btn-back {
  background: white;
  border: 1px solid var(--planet-border, #ddd);
  padding: 9px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 20px;
  transition: 0.2s;
}

.btn-back:hover {
  border-color: var(--planet-primary, #1a1a1a);
  color: var(--planet-primary, #1a1a1a);
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: var(--planet-radius, 20px);
  box-shadow: var(--planet-shadow, 0 4px 12px rgba(0,0,0,0.05));
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #ede9fe;
  border-top-color: var(--planet-primary, #1a1a1a);
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
}

.success-banner {
  background: #f0fdf4;
  color: #166534;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
  margin-bottom: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cart-link {
  color: var(--planet-primary, #1a1a1a);
  font-weight: 600;
}

.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--planet-shadow, 0 4px 12px rgba(0,0,0,0.05));
  border: 1px solid var(--planet-border, #f0f0f0);
  margin-bottom: 40px;
}

.main-image-wrap {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  border: 1px solid #f1f5f9;
}

.main-image {
  max-width: 100%;
  max-height: 340px;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.condition-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
}

.condition-badge.new { background: #dcfce7; color: #166534; }
.condition-badge.used { background: #fef3c7; color: #92400e; }

.thumbnails {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.thumb-btn {
  width: 72px;
  height: 72px;
  padding: 4px;
  border: 2px solid var(--planet-border, #ddd);
  border-radius: 10px;
  background: white;
  cursor: pointer;
  overflow: hidden;
  transition: 0.2s;
}

.thumb-btn.active {
  border-color: var(--planet-primary, #1a1a1a);
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.15);
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.brand-tag {
  display: inline-block;
  background: #f5f3ff;
  color: var(--planet-primary, #1a1a1a);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 5px 12px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.info-section h1 {
  margin: 0 0 6px;
  font-size: 28px;
  line-height: 1.25;
  color: #1a1a1a;
}

.category-line {
  margin: 0 0 20px;
  color: var(--planet-muted, #6b6b6b);
  font-size: 14px;
}

.price-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 20px;
}

.price {
  font-size: 36px;
  font-weight: 800;
  color: #059669;
}

.currency {
  font-size: 18px;
  color: var(--planet-muted, #6b6b6b);
}

.description {
  color: #4b5563;
  line-height: 1.7;
  margin: 0 0 24px;
}

.specs-card {
  background: #fafafa;
  border: 1px solid var(--planet-border, #f0f0f0);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 24px;
}

.specs-card h3 {
  margin: 0 0 14px;
  font-size: 15px;
  color: #1a1a1a;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #e5e7eb;
  font-size: 14px;
}

.spec-row:last-child { border-bottom: none; }
.spec-name { color: var(--planet-muted, #6b6b6b); }
.spec-value { font-weight: 600; color: #1a1a1a; }

.cart-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.btn-add-cart {
  flex: 1;
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-add-cart:hover {
  background: #000;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.btn-go-cart {
  flex: 0 0 auto;
  background: #f5f5f5;
  color: #1a1a1a;
  border: 1px solid #ddd;
  padding: 16px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s;
}
.btn-go-cart:hover {
  background: #e0e0e0;
}

.admin-panel {
  margin-top: 28px;
  padding: 20px;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fde68a;
  border-radius: 14px;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.admin-header h3 {
  margin: 0;
  font-size: 15px;
  color: #92400e;
}

.admin-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.btn-edit {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 9px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: 0.2s;
}
.btn-edit:hover { background: #2563eb; }

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 9px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: 0.2s;
}
.btn-delete:hover { background: #dc2626; }

/* СТИЛИ ДЛЯ БЛОКА РЕКОМЕНДАЦИЙ */
.related-section {
  margin-top: 40px;
  background: #ffffff;
  border-radius: 20px;
  padding: 32px;
  border: 1px solid var(--planet-border, #f0f0f0);
  box-shadow: var(--planet-shadow, 0 4px 12px rgba(0,0,0,0.05));
}

.related-heading {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: #1a1a1a;
}

.related-subheading {
  font-size: 14px;
  color: #6b6b6b;
  margin: 0 0 24px 0;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.related-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.related-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  border-color: #ddd;
}

.related-img-wrap {
  position: relative;
  height: 150px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-bottom: 1px solid #f8fafc;
}

.related-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}

.related-condition-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #fef3c7;
  color: #92400e;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.related-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.related-brand {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.related-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  min-height: 36px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.related-price {
  font-size: 15px;
  font-weight: 800;
  color: #059669;
}

.related-currency {
  font-size: 11px;
  color: #6b6b6b;
  margin-left: 2px;
}

.related-add-cart-btn {
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
}

.related-add-cart-btn:hover {
  background: #1a1a1a;
  transform: scale(1.05);
}

@media (max-width: 800px) {
  .product-layout {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .cart-actions {
    flex-direction: column;
  }
  
  .related-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  
  .related-section {
    padding: 20px;
  }
}
</style>