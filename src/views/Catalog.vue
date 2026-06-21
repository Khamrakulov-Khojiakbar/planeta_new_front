<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { getFullImageUrl } from '../utils/image'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

// Состояния
const products = ref([])
const categories = ref([])         // Категории первого уровня
const brands = ref([])             // Бренды для выбранной категории
const loading = ref(true)
const searchQuery = ref('')
const pageNumber = ref(1)
const pageSize = ref(12)
const totalPages = ref(1)
const totalCount = ref(0)

// Выбранные фильтры
const selectedCategory = ref(null)   // id категории
const selectedBrand = ref(null)      // id бренда
const isUsedFilter = ref('')          // состояние товара

// Корзина
const cartToast = ref(null)
let cartToastTimer = null

const addToCart = (product, event) => {
  event?.stopPropagation()
  cartStore.addItem(product)
  cartToast.value = product.name
  clearTimeout(cartToastTimer)
  cartToastTimer = setTimeout(() => {
    cartToast.value = null
  }, 2500)
}

// Загрузка категорий (первый уровень)
const fetchCategories = async () => {
  try {
    const response = await api.get('/api/getcategories')
    categories.value = response.data || []
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error)
  }
}

// Загрузка брендов для выбранной категории
const fetchBrands = async () => {
  if (!selectedCategory.value) {
    brands.value = []
    return
  }
  try {
    const response = await api.get(`/api/brands/category/${selectedCategory.value}`)
    brands.value = response.data || []
  } catch (error) {
    console.error('Ошибка загрузки брендов:', error)
    brands.value = []
  }
}

// Загрузка товаров с учётом всех фильтров
const fetchProducts = async () => {
  loading.value = true
  try {
    const params = {
      pageNumber: pageNumber.value,
      pageSize: pageSize.value,
      search: searchQuery.value || undefined,
    }
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    if (selectedBrand.value) params.brandId = selectedBrand.value
    if (isUsedFilter.value !== '') params.isUsed = isUsedFilter.value === 'true'

    const response = await api.get('/api/products', { params })
    const items = response.data.items || response.data.Items || []
    const count = response.data.totalCount ?? response.data.TotalCount ?? items.length
    const pages = response.data.totalPages ?? response.data.TotalPages ?? Math.ceil(count / pageSize.value)
    const currentPage = response.data.pageNumber ?? response.data.PageNumber ?? pageNumber.value

    products.value = items
    totalCount.value = count
    totalPages.value = pages
    pageNumber.value = currentPage
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error)
    products.value = []
  } finally {
    loading.value = false
  }
}

// Выбор категорий (с поддержкой "Все категории" при id === null)
const selectCategory = (categoryId) => {
  if (categoryId === null || selectedCategory.value === categoryId) {
    selectedCategory.value = null
    selectedBrand.value = null
    brands.value = []
  } else {
    selectedCategory.value = categoryId
    selectedBrand.value = null        // Очищаем бренд при смене категории
    fetchBrands()                      // Загружаем новые бренды
  }
  pageNumber.value = 1
  fetchProducts()
}

// Выбор бренда (сброс при повторном клике на ту же карточку)
const selectBrand = (brandId) => {
  if (selectedBrand.value === brandId) {
    selectedBrand.value = null        // Если кликнули повторно — сбрасываем фильтр бренда
  } else {
    selectedBrand.value = brandId
  }
  pageNumber.value = 1
  fetchProducts()
}

const resetFilters = () => {
  selectedCategory.value = null
  selectedBrand.value = null
  isUsedFilter.value = ''
  searchQuery.value = ''
  pageNumber.value = 1
  brands.value = []
  fetchProducts()
}

// Таймер для задержки поиска (Debounce)
let searchTimeout = null

// Наблюдаем за вводом текста с задержкой в 500мс, чтобы не перегружать бэкенд
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pageNumber.value = 1
    fetchProducts()
  }, 500)
})

// Сброс при смене состояния "Б/У" или размера страницы происходит мгновенно
watch([isUsedFilter, pageSize], () => {
  pageNumber.value = 1
  fetchProducts()
})

// Принудительный мгновенный поиск при клике на лупу или нажатии Enter
const handleSearchSubmit = () => {
  clearTimeout(searchTimeout)
  pageNumber.value = 1
  fetchProducts()
}

// Пагинация
const pageNumbers = computed(() => {
  const pages = []
  const max = totalPages.value
  const current = pageNumber.value
  let start = Math.max(1, current - 2)
  let end = Math.min(max, start + 4)
  start = Math.max(1, end - 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === pageNumber.value) return
  pageNumber.value = page
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Инициализация
onMounted(async () => {
  await fetchCategories()
  await fetchProducts()
})
</script>

<template>
  <div class="catalog-view">
    <div class="search-filter">
      <input 
        v-model="searchQuery"
        type="search" 
        placeholder="Поиск по названию или совместимости..."
        @keyup.enter="handleSearchSubmit"
        class="search-input"
      />
      <button @click="handleSearchSubmit" class="search-btn">🔍</button>
    </div>

    <div class="categories-menu">
      <div class="categories-scroll">
        <button
          class="category-chip"
          :class="{ active: selectedCategory === null }"
          @click="selectCategory(null)"
        >
          Все категории
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-chip"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <div v-if="selectedCategory && brands.length > 0" class="brands-menu">
      <h5 class="brands-title">Бренды категории:</h5>
      <div class="brands-scroll">
        <button
          v-for="brand in brands"
          :key="brand.id || brand.brandId"
          class="brand-card"
          :class="{ active: selectedBrand === (brand.id ?? brand.brandId) }"
          @click="selectBrand(brand.id ?? brand.brandId)"
        >
          <div class="brand-image-wrapper">
            <img 
              v-if="brand.logoUrl || brand.imageUrl"
              :src="getFullImageUrl(brand.logoUrl || brand.imageUrl)" 
              :alt="brand.name || brand.brandName"
              class="brand-logo-img"
            />
            <div v-else class="brand-logo-text-fallback">
              {{ (brand.name || brand.brandName || '?').substring(0, 2).toUpperCase() }}
            </div>
          </div>
          <span class="brand-name">{{ brand.name || brand.brandName }}</span>
        </button>
      </div>
    </div>

    <div class="filters-bar">
      <div class="filter-group">
        <label>Состояние:</label>
        <select v-model="isUsedFilter" class="state-filter">
          <option value="">Любое</option>
          <option value="false">Новый</option>
          <option value="true">Б/У</option>
        </select>
        <span class="result-count">{{ totalCount }} товаров</span>
      </div>
      <button v-if="selectedCategory || selectedBrand || isUsedFilter || searchQuery" 
              @click="resetFilters" 
              class="reset-all-btn">
        ✕ Сбросить все фильтры
      </button>
    </div>

    <div v-if="loading" class="products-grid">
      <div v-for="n in 12" :key="n" class="product-skeleton">
        <div class="skeleton-img"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>Товары не найдены</h3>
      <p>Попробуйте изменить фильтры или ввести другой поисковый запрос</p>
      <button @click="resetFilters" class="btn-empty">Сбросить фильтры</button>
    </div>

    <div v-else class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="router.push(`/products/${product.id}`)"
      >
        <div class="product-img-wrapper">
          <img 
            :src="getFullImageUrl(product.mainImageUrl || product.imageUrls?.[0])"
            :alt="product.name"
            class="product-img"
          />
          <div class="product-badges">
            <span v-if="product.isUsed" class="badge used">Б/У</span>
            <span v-else class="badge new">NEW</span>
          </div>
          <button 
            @click.stop="addToCart(product, $event)"
            class="quick-add"
          >
            🛒 В корзину
          </button>
        </div>
        <div class="product-info">
          <div class="product-brand">{{ product.brandName || 'Бренд' }}</div>
          <h4 class="product-title">{{ product.name }}</h4>
          <div v-if="product.attributes?.length" class="product-specs">
            <div v-for="(attr, idx) in product.attributes.slice(0, 2)" :key="idx" class="spec">
              <span class="spec-label">{{ attr.attributeName }}:</span>
              <span>{{ attr.value }}</span>
            </div>
          </div>
          <div class="product-price">
            <span class="price">{{ Number(product.price).toLocaleString() }}</span>
            <span class="currency">сом</span>
          </div>
          <button 
            @click.stop="router.push(`/products/${product.id}`)"
            class="details-btn"
          >
            Подробнее
          </button>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button 
        class="page-btn prev"
        :disabled="pageNumber <= 1"
        @click="goToPage(pageNumber - 1)"
      >← Назад</button>
      <div class="page-numbers">
        <button 
          v-for="p in pageNumbers" 
          :key="p"
          :class="['page-number', { active: p === pageNumber }]"
          @click="goToPage(p)"
        >{{ p }}</button>
      </div>
      <button 
        class="page-btn next"
        :disabled="pageNumber >= totalPages"
        @click="goToPage(pageNumber + 1)"
      >Вперёд →</button>
    </div>

    <transition name="toast">
      <div v-if="cartToast" class="cart-toast">
        <span class="toast-icon">✓</span>
        <div class="toast-text">
          <strong>Добавлено в корзину</strong>
          <p>{{ cartToast }}</p>
        </div>
        <router-link to="/cart" class="toast-link">Перейти в корзину →</router-link>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.catalog-view {
  width: 100%;
}

.search-filter {
  display: flex;
  gap: 12px;
  margin: 0 auto 20px auto; 
  max-width: 500px;
  width: 100%;
}
.search-input {
  flex: 1;
  padding: 12px 18px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 15px;
  transition: 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
}
.search-btn {
  background: #1a1a1a;
  border: none;
  padding: 0 24px;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  font-size: 18px;
  transition: 0.2s;
}
.search-btn:hover {
  background: #000;
}

.categories-menu {
  margin-bottom: 24px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 14px;
  overflow-x: auto;
}
.categories-scroll {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center; 
}
.category-chip {
  background: #f5f5f5;
  border: 1px solid transparent;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  color: #4a4a4a;
  border-radius: 40px;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}
.category-chip:hover {
  background: #e0e0e0;
  color: #1a1a1a;
}
.category-chip.active {
  background: #1a1a1a;
  color: white;
}

.brands-menu {
  margin-bottom: 28px;
  background: #fafafa;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center; 
}
.brands-title {
  margin: 0 0 14px 0;
  font-size: 13px;
  font-weight: 700;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}
.brands-scroll {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center; 
  width: 100%;
}
.brand-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 12px;
  width: 96px;
  min-width: 96px;
  height: 96px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.brand-card:hover {
  border-color: #1a1a1a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}
.brand-card.active {
  border-color: #1a1a1a;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  outline: 2px solid #1a1a1a;
}
.brand-image-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.brand-logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.brand-logo-text-fallback {
  width: 100%;
  height: 100%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-name {
  font-size: 11px;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #555;
}
.state-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 30px;
  background: white;
  font-size: 13px;
  cursor: pointer;
}
.reset-all-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
}
.reset-all-btn:hover {
  background: #f0f0f0;
  border-color: #1a1a1a;
}

.result-count {
  font-size: 14px;
  color: #6b6b6b;
  font-weight: 500;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}
.product-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  transition: 0.25s;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
  border-color: #e0e0e0;
}
.product-img-wrapper {
  position: relative;
  background: #ffffff; 
  padding: 0;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f1f5f9; 
  overflow: hidden;
}
.product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: 0.3s;
  mix-blend-mode: multiply; 
}
.product-card:hover .product-img {
  transform: scale(1.02);
}
.product-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 30px;
  text-transform: uppercase;
}
.badge.new {
  background: #1a1a1a;
  color: white;
}
.badge.used {
  background: #f5e6d3;
  color: #a1622f;
}
.quick-add {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transform: translateY(100%);
  transition: 0.25s;
  opacity: 0;
}
.product-card:hover .quick-add {
  transform: translateY(0);
  opacity: 1;
}
.product-info {
  padding: 18px;
}
.product-brand {
  font-size: 11px;
  font-weight: 700;
  color: #6b6b6b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}
.product-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 10px;
  min-height: 40px;
  color: #1a1a1a;
}
.product-specs {
  background: #f8f8f8;
  border-radius: 10px;
  padding: 8px;
  margin: 10px 0;
  font-size: 12px;
}
.spec {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.spec-label {
  font-weight: 600;
  color: #4a4a4a;
}
.product-price {
  margin: 14px 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.price {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a1a;
}
.currency {
  font-size: 12px;
  font-weight: 500;
  color: #6b6b6b;
}
.details-btn {
  width: 100%;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 30px;
  padding: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.details-btn:hover {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}

/* Скелетон */
.product-skeleton {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #ececec;
}
.skeleton-img {
  height: 220px;
  background: #f0f0f0;
}
.skeleton-line {
  height: 16px;
  background: #f0f0f0;
  margin: 12px;
  border-radius: 8px;
}
.skeleton-line.short {
  width: 60%;
}

/* Пагинация */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
}
.page-btn, .page-number {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 500;
  transition: 0.2s;
}
.page-btn:hover:not(:disabled), .page-number:hover {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}
.page-number.active {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Уведомление */
.cart-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border-left: 4px solid #1a1a1a;
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 1000;
  animation: slideUp 0.25s ease;
  max-width: 360px;
}
.toast-icon {
  background: #22c55e;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.toast-text p {
  margin: 0;
  font-size: 13px;
  color: #4a4a4a;
}
.toast-link {
  color: #1a1a1a;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 24px;
}
.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}
.btn-empty {
  background: #1a1a1a;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  margin-top: 20px;
  cursor: pointer;
  font-weight: 600;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }
  .product-img-wrapper {
    height: 160px;
  }
  .categories-scroll, .brands-scroll {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 8px;
    justify-content: flex-start; 
  }
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .reset-all-btn {
    align-self: flex-start;
  }
}
</style>