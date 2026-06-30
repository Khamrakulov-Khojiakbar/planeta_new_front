<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { getFullImageUrl } from '../utils/image'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

// ── Состояния ──────────────────────────────
const products    = ref([])          // используется в режиме "выбрана категория"
const categories  = ref([])
const brands      = ref([])
const loading     = ref(true)
const searchQuery = ref('')
const pageNumber  = ref(1)
const pageSize    = ref(12)
const totalPages  = ref(1)
const totalCount  = ref(0)

const selectedCategory = ref(null)
const selectedBrand    = ref(null)
const isUsedFilter     = ref('')

// ── Режим "обзор по категориям" (когда фильтр не выбран) ──
const overviewLoading  = ref(true)
const overviewSections = ref([])     // [{ category, products: [...8] }]

// Корзина
const cartToast = ref(null)
let cartToastTimer = null

const addToCart = (product, event) => {
  event?.stopPropagation()
  cartStore.addItem(product)
  cartToast.value = product.name
  clearTimeout(cartToastTimer)
  cartToastTimer = setTimeout(() => { cartToast.value = null }, 2500)
}

// ── Категории ──────────────────────────────
const fetchCategories = async () => {
  try {
    const r = await api.get('/api/getcategories')
    categories.value = r.data || []
  } catch (e) { console.error('Ошибка загрузки категорий:', e) }
}

// Порядок категорий: "Смартфоны" всегда первая, остальные — по алфавиту
const orderedCategories = computed(() => {
  const list = [...categories.value]
  return list.sort((a, b) => {
    const aIsPhone = /смартфон|телефон/i.test(a.name || '')
    const bIsPhone = /смартфон|телефон/i.test(b.name || '')
    if (aIsPhone && !bIsPhone) return -1
    if (!aIsPhone && bIsPhone) return 1
    return (a.name || '').localeCompare(b.name || '', 'ru')
  })
})

// ── Бренды ─────────────────────────────────
const fetchBrands = async () => {
  if (!selectedCategory.value) { brands.value = []; return }
  try {
    const r = await api.get(`/api/brands/category/${selectedCategory.value}`)
    brands.value = r.data || []
  } catch { brands.value = [] }
}

// ── Загрузка товаров (режим: выбрана категория / поиск) ──
const fetchProducts = async () => {
  loading.value = true
  try {
    const params = {
      pageNumber: pageNumber.value,
      pageSize: pageSize.value,
      search: searchQuery.value || undefined,
    }
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    if (selectedBrand.value)    params.brandId    = selectedBrand.value
    if (isUsedFilter.value !== '') params.isUsed  = isUsedFilter.value === 'true'

    const r     = await api.get('/api/products', { params })
    const items = r.data.items || r.data.Items || []
    const count = r.data.totalCount ?? r.data.TotalCount ?? items.length
    const pages = r.data.totalPages ?? r.data.TotalPages ?? Math.ceil(count / pageSize.value)
    const cur   = r.data.pageNumber ?? r.data.PageNumber ?? pageNumber.value

    products.value   = items
    totalCount.value = count
    totalPages.value = pages
    pageNumber.value = cur
  } catch (e) {
    console.error('Ошибка загрузки товаров:', e)
    products.value = []
  } finally {
    loading.value = false
  }
}

// Товары текущей страницы, отсортированные по алфавиту
const sortedProducts = computed(() =>
  [...products.value].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'))
)

// ── Загрузка "обзора" по всем категориям (по 8 штук каждая) ──
const fetchOverview = async () => {
  overviewLoading.value = true
  try {
    if (categories.value.length === 0) await fetchCategories()

    const results = await Promise.all(
      orderedCategories.value.map(async (cat) => {
        try {
          const r = await api.get('/api/products', {
            params: { pageNumber: 1, pageSize: 8, categoryId: cat.id }
          })
          const items = r.data.items || r.data.Items || []
          const count = r.data.totalCount ?? r.data.TotalCount ?? items.length
          const sortedItems = [...items].sort((a, b) =>
            (a.name || '').localeCompare(b.name || '', 'ru')
          )
          return { category: cat, products: sortedItems, totalCount: count }
        } catch {
          return { category: cat, products: [], totalCount: 0 }
        }
      })
    )

    overviewSections.value = results.filter(s => s.products.length > 0)
  } finally {
    overviewLoading.value = false
  }
}

// ── Режим: есть ли активный фильтр/поиск? ──
const isFiltering = computed(() =>
  !!(selectedCategory.value || selectedBrand.value || isUsedFilter.value || searchQuery.value)
)

// ── Выбор категории ────────────────────────
const selectCategory = (catId) => {
  if (catId === null || selectedCategory.value === catId) {
    selectedCategory.value = null
    selectedBrand.value    = null
    brands.value           = []
  } else {
    selectedCategory.value = catId
    selectedBrand.value    = null
    fetchBrands()
  }
  pageNumber.value = 1

  if (selectedCategory.value || searchQuery.value || isUsedFilter.value) {
    fetchProducts()
  }
}

const selectBrand = (brandId) => {
  selectedBrand.value = selectedBrand.value === brandId ? null : brandId
  pageNumber.value = 1
  fetchProducts()
}

const resetFilters = () => {
  selectedCategory.value = null
  selectedBrand.value    = null
  isUsedFilter.value     = ''
  searchQuery.value      = ''
  pageNumber.value       = 1
  brands.value           = []
}

// Клик "Показать все" в секции обзора — переключает в режим категории
const showAllInCategory = (catId) => {
  selectCategory(catId)
}

// ── Поиск / дебаунс ────────────────────────
let searchTimeout = null
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pageNumber.value = 1
    if (searchQuery.value) fetchProducts()
  }, 500)
})

watch([isUsedFilter, pageSize], () => {
  pageNumber.value = 1
  if (isFiltering.value) fetchProducts()
})

const handleSearchSubmit = () => {
  clearTimeout(searchTimeout)
  pageNumber.value = 1
  if (searchQuery.value) fetchProducts()
}

// Когда фильтрация выключается полностью (resetFilters) — возвращаемся к обзору,
// который уже загружен; когда включается — подгружаем список
watch(isFiltering, (filtering) => {
  if (!filtering) {
    // вернулись к обзору — ничего грузить не нужно, он уже в памяти
  }
})

// ── Пагинация ──────────────────────────────
const pageNumbers = computed(() => {
  const pages = []
  const max = totalPages.value, cur = pageNumber.value
  let start = Math.max(1, cur - 2)
  let end   = Math.min(max, start + 4)
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

const currentCategoryName = computed(() => {
  if (!selectedCategory.value) return 'Все товары'
  const c = categories.value.find(c => c.id === selectedCategory.value)
  return c?.name || 'Категория'
})

const formatPrice = (p) => Number(p).toLocaleString('ru-RU')

const getCatIcon = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('смартфон') || n.includes('телефон')) return '📱'
  if (n.includes('заряд'))                              return '⚡'
  if (n.includes('стекл') || n.includes('защит'))      return '🛡️'
  if (n.includes('аудио') || n.includes('наушн'))      return '🎧'
  if (n.includes('час') || n.includes('watch'))        return '⌚'
  if (n.includes('дом') || n.includes('home'))         return '🏠'
  return '📦'
}

// ── Инициализация ──────────────────────────
onMounted(async () => {
  await fetchCategories()
  await fetchOverview()
  loading.value = false
})
</script>

<template>
  <div class="catalog-view">

    <!-- ═══════════════ ПОИСК ═══════════════ -->
    <div class="search-bar">
      <div class="search-wrap">
        <span class="search-icon-left">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Поиск товаров..."
          @keyup.enter="handleSearchSubmit"
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="search-clear">✕</button>
      </div>
    </div>

    <!-- ═══════════════ КАТЕГОРИИ (TAB-BAR) ══════════════ -->
    <div class="cat-tabbar">
      <button
        class="cat-tab"
        :class="{ active: selectedCategory === null && !isFiltering }"
        @click="resetFilters()"
      >
        <span class="tab-icon">🏪</span>
        <span class="tab-label">Все</span>
      </button>
      <button
        v-for="cat in orderedCategories"
        :key="cat.id"
        class="cat-tab"
        :class="{ active: selectedCategory === cat.id }"
        @click="selectCategory(cat.id)"
      >
        <span class="tab-icon">{{ getCatIcon(cat.name) }}</span>
        <span class="tab-label">{{ cat.name }}</span>
      </button>
    </div>

    <!-- ═══════════════ БРЕНДЫ (только в режиме категории) ══════════════ -->
    <transition name="slide-down">
      <div v-if="selectedCategory && brands.length > 0" class="brands-panel">
        <span class="brands-label">Бренд:</span>
        <div class="brands-list">
          <button
            v-for="brand in brands"
            :key="brand.id || brand.brandId"
            class="brand-pill"
            :class="{ active: selectedBrand === (brand.id ?? brand.brandId) }"
            @click="selectBrand(brand.id ?? brand.brandId)"
          >
            <img
              v-if="brand.logoUrl || brand.imageUrl"
              :src="getFullImageUrl(brand.logoUrl || brand.imageUrl)"
              :alt="brand.name || brand.brandName"
              class="brand-pill-logo"
            />
            <span class="brand-pill-fallback" v-else>
              {{ (brand.name || brand.brandName || '?').substring(0,2).toUpperCase() }}
            </span>
            {{ brand.name || brand.brandName }}
          </button>
        </div>
      </div>
    </transition>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- РЕЖИМ A: ОБЗОР ПО КАТЕГОРИЯМ (фильтр/поиск не активны)   -->
    <!-- ════════════════════════════════════════════════════════ -->
    <template v-if="!isFiltering">

      <div v-if="overviewLoading" class="overview-skeleton">
        <div v-for="n in 3" :key="n" class="section-skeleton">
          <div class="sk-title"></div>
          <div class="products-grid">
            <div v-for="m in 8" :key="m" class="skeleton-card">
              <div class="sk-img"></div>
              <div class="sk-line"></div>
              <div class="sk-line short"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="overviewSections.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Каталог пуст</h3>
        <p>Товары скоро появятся</p>
      </div>

      <div v-else class="overview-list">
        <section
          v-for="section in overviewSections"
          :key="section.category.id"
          class="catalog-section"
        >
          <div class="section-header">
            <div class="section-header-left">
              <span class="section-icon">{{ getCatIcon(section.category.name) }}</span>
              <h2 class="section-title">{{ section.category.name }}</h2>
              <span class="count-badge">{{ section.totalCount }}</span>
            </div>
            <button
              v-if="section.totalCount > 8"
              class="show-all-btn"
              @click="showAllInCategory(section.category.id)"
            >
              Показать все →
            </button>
          </div>

          <div class="products-grid">
            <div
              v-for="product in section.products"
              :key="product.id"
              class="product-card"
              @click="router.push(`/products/${product.id}`)"
            >
              <div class="card-img-wrap">
                <img
                  :src="getFullImageUrl(product.mainImageUrl || product.imageUrls?.[0])"
                  :alt="product.name"
                  class="card-img"
                />
                <div class="card-badges">
                  <span v-if="product.isUsed" class="badge used">Б/У</span>
                  <span v-else class="badge new">NEW</span>
                </div>
                <button @click.stop="addToCart(product, $event)" class="quick-add">
                  🛒 В корзину
                </button>
              </div>
              <div class="card-info">
                <span class="card-brand">{{ product.brandName || 'Бренд' }}</span>
                <h4 class="card-name">{{ product.name }}</h4>
                <div class="card-price">
                  <strong>{{ formatPrice(product.price) }}</strong>
                  <span class="cur"> сом</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

    </template>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- РЕЖИМ B: ВЫБРАНА КАТЕГОРИЯ / ПОИСК (список + пагинация)  -->
    <!-- ════════════════════════════════════════════════════════ -->
    <template v-else>

      <div class="toolbar">
        <div class="toolbar-left">
          <h2 class="section-heading">{{ currentCategoryName }}</h2>
          <span class="count-badge">{{ totalCount }}</span>
        </div>
        <div class="toolbar-right">
          <select v-model="isUsedFilter" class="state-select">
            <option value="">Любое состояние</option>
            <option value="false">Новый</option>
            <option value="true">Б/У</option>
          </select>
          <button @click="resetFilters" class="reset-btn">✕ Сброс</button>
        </div>
      </div>

      <div v-if="loading" class="products-grid">
        <div v-for="n in 12" :key="n" class="skeleton-card">
          <div class="sk-img"></div>
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
        </div>
      </div>

      <div v-else-if="sortedProducts.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Товары не найдены</h3>
        <p>Попробуйте изменить фильтры или поисковый запрос</p>
        <button @click="resetFilters" class="btn-reset-empty">Сбросить фильтры</button>
      </div>

      <div v-else class="products-grid">
        <div
          v-for="product in sortedProducts"
          :key="product.id"
          class="product-card"
          @click="router.push(`/products/${product.id}`)"
        >
          <div class="card-img-wrap">
            <img
              :src="getFullImageUrl(product.mainImageUrl || product.imageUrls?.[0])"
              :alt="product.name"
              class="card-img"
            />
            <div class="card-badges">
              <span v-if="product.isUsed" class="badge used">Б/У</span>
              <span v-else class="badge new">NEW</span>
            </div>
            <button @click.stop="addToCart(product, $event)" class="quick-add">
              🛒 В корзину
            </button>
          </div>
          <div class="card-info">
            <span class="card-brand">{{ product.brandName || 'Бренд' }}</span>
            <h4 class="card-name">{{ product.name }}</h4>
            <div v-if="product.attributes?.length" class="card-specs">
              <div v-for="(attr, idx) in product.attributes.slice(0, 2)" :key="idx" class="spec-row">
                <span class="spec-key">{{ attr.attributeName }}:</span>
                <span class="spec-val">{{ attr.value }}</span>
              </div>
            </div>
            <div class="card-price">
              <strong>{{ formatPrice(product.price) }}</strong>
              <span class="cur"> сом</span>
            </div>
            <button @click.stop="router.push(`/products/${product.id}`)" class="details-btn">
              Подробнее
            </button>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="pg-btn" :disabled="pageNumber <= 1" @click="goToPage(pageNumber - 1)">← Назад</button>
        <button
          v-for="p in pageNumbers" :key="p"
          :class="['pg-num', { active: p === pageNumber }]"
          @click="goToPage(p)"
        >{{ p }}</button>
        <button class="pg-btn" :disabled="pageNumber >= totalPages" @click="goToPage(pageNumber + 1)">Вперёд →</button>
      </div>

    </template>

    <!-- ═══════════════ TOAST ══════════════ -->
    <transition name="toast">
      <div v-if="cartToast" class="cart-toast">
        <span class="toast-check">✓</span>
        <div class="toast-body">
          <strong>Добавлено в корзину</strong>
          <p>{{ cartToast }}</p>
        </div>
        <router-link to="/cart" class="toast-link">Перейти →</router-link>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* ── BASE ── */
.catalog-view {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── ПОИСК ── */
.search-bar { margin: 0 auto 28px; max-width: 560px; }
.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon-left { position: absolute; left: 16px; font-size: 16px; pointer-events: none; opacity: .55; }
.search-input {
  width: 100%;
  padding: 14px 48px;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  font-size: 15px;
  background: #fff;
  transition: .2s;
  box-sizing: border-box;
}
.search-input:focus {
  outline: none;
  border-color: #111;
  box-shadow: 0 0 0 3px rgba(17,17,17,.07);
}
.search-clear {
  position: absolute; right: 14px;
  background: none; border: none;
  font-size: 14px; color: #94a3b8; cursor: pointer; padding: 4px;
}
.search-clear:hover { color: #111; }

/* ── КАТЕГОРИИ — TAB BAR ── */
.cat-tabbar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 24px;
  scrollbar-width: none;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 16px;
}
.cat-tabbar::-webkit-scrollbar { display: none; }
.cat-tab {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 12px 20px;
  border: 1.5px solid #e8ecf0;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  transition: .2s;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 80px;
}
.cat-tab:hover { border-color: #111; background: #f8fafc; }
.cat-tab.active { background: #111; border-color: #111; color: #fff; }
.tab-icon { font-size: 22px; line-height: 1; }
.tab-label { font-size: 12px; font-weight: 700; letter-spacing: .2px; }

/* ── БРЕНДЫ ── */
.brands-panel {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: #f8fafc;
  border: 1px solid #e8ecf0;
  border-radius: 18px;
  padding: 14px 18px;
  margin-bottom: 24px;
}
.brands-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; flex-shrink: 0; }
.brands-list { display: flex; gap: 8px; flex-wrap: wrap; }
.brand-pill {
  display: flex; align-items: center; gap: 6px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 40px;
  padding: 7px 14px;
  font-size: 13px; font-weight: 600; color: #374151;
  cursor: pointer; transition: .2s;
}
.brand-pill:hover { border-color: #111; }
.brand-pill.active { background: #111; color: #fff; border-color: #111; }
.brand-pill-logo { width: 18px; height: 18px; object-fit: contain; }
.brand-pill-fallback {
  width: 20px; height: 20px; background: #e2e8f0; border-radius: 50%;
  font-size: 9px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; color: #64748b;
}

/* ── ОБЗОРНЫЙ РЕЖИМ: СЕКЦИИ ПО КАТЕГОРИЯМ ── */
.overview-list { display: flex; flex-direction: column; gap: 48px; }
.catalog-section { width: 100%; }
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap; gap: 10px;
}
.section-header-left { display: flex; align-items: center; gap: 10px; }
.section-icon { font-size: 22px; }
.section-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
.count-badge {
  background: #f1f5f9; color: #64748b; font-size: 12px; font-weight: 700;
  padding: 3px 10px; border-radius: 40px;
}
.show-all-btn {
  background: none;
  border: 1.5px solid #e2e8f0;
  padding: 8px 18px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  transition: .2s;
  white-space: nowrap;
}
.show-all-btn:hover { background: #111; color: #fff; border-color: #111; }

.overview-skeleton { display: flex; flex-direction: column; gap: 48px; }
.section-skeleton { width: 100%; }
.sk-title {
  width: 200px; height: 24px; margin-bottom: 20px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
  border-radius: 8px;
}

/* ── ТУЛБАР (режим категории) ── */
.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.toolbar-left { display: flex; align-items: center; gap: 10px; }
.section-heading { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.state-select {
  padding: 8px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px; font-weight: 600;
  background: #fff; color: #374151; cursor: pointer;
}
.reset-btn {
  background: none;
  border: 1.5px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px; font-weight: 700; color: #64748b;
  cursor: pointer; transition: .2s; white-space: nowrap;
}
.reset-btn:hover { border-color: #ef4444; color: #ef4444; }

/* ── СКЕЛЕТОН ── */
.skeleton-card { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #f0f0f0; }
.sk-img {
  height: 220px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
.sk-line { height: 14px; background: #f0f0f0; margin: 14px 14px 0; border-radius: 8px; animation: shimmer 1.4s infinite; }
.sk-line.short { width: 55%; margin-top: 8px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── СЕТКА ── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 20px;
  margin-bottom: 10px;
}

/* ── КАРТОЧКА ── */
.product-card {
  background: #fff; border-radius: 20px; overflow: hidden;
  border: 1.5px solid #f0f4f8; cursor: pointer; transition: .22s;
}
.product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,.08); border-color: #e2e8f0; }
.card-img-wrap {
  position: relative; background: #f9fafb; height: 220px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; border-bottom: 1px solid #f1f5f9;
}
.card-img { max-width: 90%; max-height: 90%; object-fit: contain; mix-blend-mode: multiply; transition: .25s; }
.product-card:hover .card-img { transform: scale(1.03); }
.card-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; }
.badge { font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 40px; text-transform: uppercase; letter-spacing: .4px; }
.badge.new  { background: #111; color: #fff; }
.badge.used { background: #fef3c7; color: #92400e; }
.quick-add {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: #111; color: #fff; border: none; padding: 11px;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transform: translateY(100%); opacity: 0; transition: .22s;
}
.product-card:hover .quick-add { transform: translateY(0); opacity: 1; }
.card-info { padding: 16px; }
.card-brand { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; color: #94a3b8; display: block; margin-bottom: 4px; }
.card-name {
  font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.4;
  min-height: 40px; margin: 0 0 10px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-specs { background: #f8fafc; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; font-size: 12px; }
.spec-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
.spec-row:last-child { margin-bottom: 0; }
.spec-key { font-weight: 700; color: #475569; }
.spec-val { color: #64748b; }
.card-price { font-size: 19px; font-weight: 900; color: #0f172a; margin: 10px 0 12px; }
.cur { font-size: 12px; font-weight: 500; color: #94a3b8; }
.details-btn {
  width: 100%; background: transparent; border: 1.5px solid #e2e8f0;
  border-radius: 40px; padding: 8px; font-size: 12px; font-weight: 700;
  cursor: pointer; color: #374151; transition: .2s;
}
.details-btn:hover { background: #111; color: #fff; border-color: #111; }

/* ── ПУСТОЕ СОСТОЯНИЕ ── */
.empty-state { text-align: center; padding: 80px 20px; background: #fff; border-radius: 24px; border: 1px solid #f0f0f0; }
.empty-icon { font-size: 56px; margin-bottom: 16px; display: block; }
.empty-state h3 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.empty-state p  { font-size: 14px; color: #94a3b8; margin: 0 0 24px; }
.btn-reset-empty {
  background: #111; color: #fff; border: none; padding: 12px 28px;
  border-radius: 40px; font-size: 14px; font-weight: 700; cursor: pointer;
}

/* ── ПАГИНАЦИЯ ── */
.pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
.pg-btn {
  padding: 9px 20px; border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 40px; font-size: 13px; font-weight: 700; cursor: pointer;
  transition: .2s; color: #374151;
}
.pg-btn:hover:not(:disabled) { background: #111; color: #fff; border-color: #111; }
.pg-btn:disabled { opacity: .35; cursor: not-allowed; }
.pg-num {
  width: 38px; height: 38px; border: 1.5px solid #e2e8f0; background: #fff;
  border-radius: 50%; font-size: 13px; font-weight: 700; cursor: pointer;
  transition: .2s; color: #374151;
  display: flex; align-items: center; justify-content: center;
}
.pg-num:hover  { border-color: #111; color: #111; }
.pg-num.active { background: #111; color: #fff; border-color: #111; }

/* ── TOAST ── */
.cart-toast {
  position: fixed; bottom: 24px; right: 24px;
  background: #fff; border-left: 4px solid #111;
  border-radius: 16px; padding: 14px 20px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
  z-index: 1000; max-width: 340px;
}
.toast-check {
  background: #22c55e; color: #fff; width: 26px; height: 26px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; flex-shrink: 0;
}
.toast-body { flex: 1; }
.toast-body strong { font-size: 13px; color: #0f172a; }
.toast-body p { margin: 2px 0 0; font-size: 12px; color: #94a3b8; }
.toast-link { font-size: 12px; font-weight: 700; color: #111; white-space: nowrap; text-decoration: none; }
.toast-enter-active, .toast-leave-active { transition: .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }

/* ── АНИМАЦИЯ БРЕНДОВ ── */
.slide-down-enter-active, .slide-down-leave-active { transition: .25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .card-img-wrap { height: 160px; }
  .toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-right { width: 100%; }
}
@media (max-width: 420px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .cat-tab { min-width: 68px; padding: 10px 12px; }
  .tab-label { font-size: 11px; }
}
</style>