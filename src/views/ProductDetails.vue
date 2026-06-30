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

const productId = computed(() => route.params.productId)

const product = ref(null)
const loading = ref(true)
const errorMsg = ref('')
const activeImage = ref('')
const addedToCart = ref(false)

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

    await fetchRelatedProducts(product.value.name)
  } catch (err) {
    errorMsg.value = 'Не удалось загрузить товар.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const fetchRelatedProducts = async (productName) => {
  if (!productName) return
  relatedLoading.value = true
  try {
    const response = await api.get('/api/products', {
      params: { search: productName, pageSize: 6 }
    })
    const items = response.data.items || response.data.Items || response.data || []
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
  setTimeout(() => { addedToCart.value = false }, 2500)
}

const handleAddRelatedToCart = (item, event) => {
  event.stopPropagation()
  cartStore.addItem(item)
  alert(`Товар "${item.name}" добавлен в корзину!`)
}

const onImagesUpdated = async () => { await fetchProductDetails() }
const setActiveImage = (url) => { activeImage.value = url }

const allImages = () => {
  if (!product.value) return []
  const urls = []
  if (product.value.mainImageUrl) urls.push(product.value.mainImageUrl)
  product.value.imageUrls?.forEach((url) => {
    if (!urls.includes(url)) urls.push(url)
  })
  return urls
}

watch(productId, () => {
  relatedProducts.value = []
  fetchProductDetails()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

onMounted(() => { fetchProductDetails() })

const formatPrice = (p) => Number(p).toLocaleString('ru-RU')
</script>

<template>
  <div class="product-page">
    <button @click="router.push('/catalog')" class="btn-back">← Назад в каталог</button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка товара...</p>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <transition name="fade-slide">
      <div v-if="addedToCart" class="success-banner">
        <span class="success-check">✓</span>
        Товар добавлен в корзину!
        <router-link to="/cart" class="cart-link">Перейти в корзину →</router-link>
      </div>
    </transition>

    <div v-if="product && !loading" class="product-layout">

      <!-- ═══════════ ГАЛЕРЕЯ ═══════════ -->
      <div class="gallery-section">
        <div class="main-image-wrap">
          <img :src="getFullImageUrl(activeImage)" :alt="product.name" class="main-image" />
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

      <!-- ═══════════ ИНФОРМАЦИЯ ═══════════ -->
      <div class="info-section">
        <span class="brand-tag">{{ product.brandName || 'PLANETA' }}</span>
        <h1>{{ product.name }}</h1>
        <p class="category-line">{{ product.categoryName }}</p>

        <div class="price-block">
          <span class="price">{{ formatPrice(product.price) }}</span>
          <span class="currency">сом</span>
        </div>

        <div class="cart-actions">
          <button @click="handleAddToCart" class="btn-add-cart">🛒 В корзину</button>
          <button @click="router.push('/cart')" class="btn-go-cart">Перейти в корзину</button>
        </div>

        <!-- ХАРАКТЕРИСТИКИ — сразу после цены/кнопок -->
        <div v-if="product.attributes?.length" class="specs-card">
          <h3>Характеристики</h3>
          <div class="specs-grid">
            <div v-for="(attr, index) in product.attributes" :key="index" class="spec-row">
              <span class="spec-name">{{ attr.attributeName }}</span>
              <span class="spec-value">{{ attr.value }}</span>
            </div>
          </div>
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
            <button @click="router.push(`/admin/edit-product/${product.id}`)" class="btn-edit">
              ✏️ Редактировать
            </button>
            <button @click="handleDelete" class="btn-delete">
              🗑️ Удалить
            </button>
          </div>

          <ProductImageManager :product-id="product.id" @updated="onImagesUpdated" />
        </div>
      </div>

      <!-- ═══════════ ОПИСАНИЕ — на всю ширину, внизу ═══════════ -->
      <div class="description-section">
        <h3 class="description-heading">Описание</h3>
        <p class="description">
          {{ product.description || 'Описание для данного товара пока не добавлено.' }}
        </p>
      </div>

    </div>

    <!-- ═══════════ РЕКОМЕНДАЦИИ ═══════════ -->
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
                <span class="related-price">{{ formatPrice(item.price) }}</span>
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── НАЗАД ── */
.btn-back {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  padding: 9px 18px;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  color: #374151;
  margin-bottom: 24px;
  transition: .2s;
}
.btn-back:hover { border-color: #111; color: #111; }

/* ── СОСТОЯНИЯ ── */
.loading-state {
  text-align: center;
  padding: 100px 20px;
  background: #fff;
  border-radius: 24px;
  border: 1px solid #f0f0f0;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid #f1f5f9;
  border-top-color: #111;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 14px 18px;
  border-radius: 16px;
  border: 1px solid #fecaca;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
}

.success-banner {
  background: #0f172a;
  color: #fff;
  padding: 14px 20px;
  border-radius: 16px;
  margin-bottom: 24px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.success-check {
  background: #22c55e;
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.cart-link { color: #fff; font-weight: 800; text-decoration: underline; margin-left: auto; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: .25s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── ОСНОВНАЯ СЕТКА ── */
.product-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  background: #fff;
  border-radius: 28px;
  padding: 36px;
  border: 1.5px solid #f0f4f8;
  margin-bottom: 40px;
}

/* ── ГАЛЕРЕЯ ── */
.main-image-wrap {
  position: relative;
  background: #f9fafb;
  border-radius: 20px;
  padding: 28px;
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
  top: 16px; left: 16px;
  font-size: 11px;
  font-weight: 800;
  padding: 5px 12px;
  border-radius: 40px;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.condition-badge.new { background: #111; color: #fff; }
.condition-badge.used { background: #fef3c7; color: #92400e; }

.thumbnails { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.thumb-btn {
  width: 70px; height: 70px;
  padding: 3px;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: .2s;
}
.thumb-btn.active { border-color: #111; box-shadow: 0 0 0 3px rgba(17,17,17,.08); }
.thumb-btn img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }

/* ── ИНФОБЛОК ── */
.brand-tag {
  display: inline-block;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .6px;
  padding: 5px 13px;
  border-radius: 40px;
  margin-bottom: 12px;
}
.info-section h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.25;
  color: #0f172a;
}
.category-line { margin: 0 0 20px; color: #94a3b8; font-size: 13px; }

.price-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 24px;
}
.price { font-size: 34px; font-weight: 900; color: #0f172a; }
.currency { font-size: 16px; color: #94a3b8; font-weight: 600; }

/* ── КНОПКИ ── */
.cart-actions { display: flex; gap: 10px; margin-bottom: 28px; }
.btn-add-cart {
  flex: 1;
  background: #111;
  color: #fff;
  border: none;
  padding: 16px;
  font-size: 15px;
  font-weight: 800;
  border-radius: 40px;
  cursor: pointer;
  transition: .2s;
}
.btn-add-cart:hover { background: #000; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(0,0,0,.15); }
.btn-go-cart {
  flex: 0 0 auto;
  background: #fff;
  color: #111;
  border: 1.5px solid #e2e8f0;
  padding: 16px 22px;
  border-radius: 40px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: .2s;
}
.btn-go-cart:hover { border-color: #111; }

/* ── ХАРАКТЕРИСТИКИ ── */
.specs-card {
  background: #f8fafc;
  border: 1px solid #f0f4f8;
  border-radius: 20px;
  padding: 22px 24px;
}
.specs-card h3 {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: .4px;
}
.spec-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 13px;
}
.spec-row:last-child { border-bottom: none; padding-bottom: 0; }
.spec-name { color: #94a3b8; font-weight: 500; }
.spec-value { font-weight: 700; color: #0f172a; }

/* ── ОПИСАНИЕ — на всю ширину снизу ── */
.description-section {
  grid-column: 1 / -1;
  border-top: 1px solid #f0f4f8;
  padding-top: 28px;
  margin-top: 4px;
}
.description-heading {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: .4px;
  margin: 0 0 14px;
}
.description {
  color: #475569;
  line-height: 1.75;
  font-size: 14px;
  margin: 0;
  max-width: 720px;
}

/* ── АДМИН-ПАНЕЛЬ ── */
.admin-panel {
  margin-top: 24px;
  padding: 20px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 20px;
}
.admin-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.admin-header h3 { margin: 0; font-size: 14px; font-weight: 800; color: #92400e; }
.admin-actions { display: flex; gap: 10px; margin-bottom: 16px; }
.btn-edit {
  background: #2563eb; color: #fff; border: none;
  padding: 9px 16px; border-radius: 40px; cursor: pointer;
  font-weight: 700; font-size: 13px; transition: .2s;
}
.btn-edit:hover { background: #1d4ed8; }
.btn-delete {
  background: #ef4444; color: #fff; border: none;
  padding: 9px 16px; border-radius: 40px; cursor: pointer;
  font-weight: 700; font-size: 13px; transition: .2s;
}
.btn-delete:hover { background: #dc2626; }

/* ── РЕКОМЕНДАЦИИ ── */
.related-section {
  margin-top: 40px;
  background: #fff;
  border-radius: 28px;
  padding: 36px;
  border: 1.5px solid #f0f4f8;
}
.related-heading { font-size: 21px; font-weight: 800; margin: 0 0 6px; color: #0f172a; }
.related-subheading { font-size: 13px; color: #94a3b8; margin: 0 0 24px; }

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
}
.related-card {
  background: #fff;
  border: 1.5px solid #f0f4f8;
  border-radius: 18px;
  overflow: hidden;
  cursor: pointer;
  transition: .22s;
  display: flex;
  flex-direction: column;
}
.related-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0,0,0,.08);
  border-color: #e2e8f0;
}
.related-img-wrap {
  position: relative;
  height: 150px;
  background: #f9fafb;
  display: flex; align-items: center; justify-content: center;
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}
.related-img { max-width: 100%; max-height: 100%; object-fit: contain; mix-blend-mode: multiply; }
.related-condition-badge {
  position: absolute; top: 8px; left: 8px;
  background: #fef3c7; color: #92400e;
  font-size: 9px; font-weight: 800;
  padding: 3px 7px; border-radius: 40px;
  text-transform: uppercase;
}
.related-info { padding: 14px; display: flex; flex-direction: column; flex: 1; }
.related-brand { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
.related-title {
  font-size: 13px; font-weight: 700; line-height: 1.4; color: #0f172a;
  margin: 0 0 12px; min-height: 36px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.related-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.related-price { font-size: 15px; font-weight: 900; color: #0f172a; }
.related-currency { font-size: 11px; color: #94a3b8; margin-left: 2px; }
.related-add-cart-btn {
  background: #f1f5f9; border: none;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; transition: .2s;
}
.related-add-cart-btn:hover { background: #111; transform: scale(1.05); }

/* ── RESPONSIVE ── */
@media (max-width: 800px) {
  .product-layout { grid-template-columns: 1fr; padding: 22px; }
  .description-section { grid-column: auto; }
  .cart-actions { flex-direction: column; }
  .related-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
  .related-section { padding: 22px; }
}
</style>