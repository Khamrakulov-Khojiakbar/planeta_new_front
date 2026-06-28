<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { getFullImageUrl } from '../utils/image'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

// ──────────────────────────────────────────────
// Данные
// ──────────────────────────────────────────────
const heroProducts = ref([])       // Samsung S26 Ultra + iPhone 17 Pro Max
const watchProducts = ref([])      // Смарт-часы
const chargerProducts = ref([])    // Зарядные устройства
const topProducts = ref([])        // Топовые товары
const categories = ref([])

const cartToast = ref(null)
let cartToastTimer = null

// ──────────────────────────────────────────────
// Загрузка
// ──────────────────────────────────────────────
const fetchSection = async (search, limit = 6) => {
  try {
    const res = await api.get('/api/products', {
      params: { pageNumber: 1, pageSize: limit, search }
    })
    return res.data.items || res.data.Items || []
  } catch { return [] }
}

const fetchByCategory = async (categoryId, limit = 6) => {
  try {
    const res = await api.get('/api/products', {
      params: { pageNumber: 1, pageSize: limit, categoryId }
    })
    return res.data.items || res.data.Items || []
  } catch { return [] }
}

const addToCart = (product, event) => {
  event?.stopPropagation()
  cartStore.addItem(product)
  cartToast.value = product.name
  clearTimeout(cartToastTimer)
  cartToastTimer = setTimeout(() => { cartToast.value = null }, 2500)
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
onMounted(async () => {
  const [cats, hero, watches, chargers, top] = await Promise.all([
    api.get('/api/getcategories').then(r => r.data || []).catch(() => []),
    fetchSection('S26 Ultra', 2).then(items => {
      // Если не нашло S26 Ultra, берём просто последние 2 смартфона
      if (items.length < 2) return fetchSection('iPhone 17', 2)
      return items
    }),
    fetchSection('смарт-час', 6),
    fetchSection('зарядн', 6),
    api.get('/api/products', { params: { pageNumber: 1, pageSize: 8, sortBy: 'price', sortDesc: true } })
      .then(r => r.data.items || r.data.Items || []).catch(() => [])
  ])

  categories.value = cats

  // Hero: берём 1-2 смартфона как "флагманы"
  // Пробуем S26 + 17 Pro Max по отдельности
  const [s26, iphone] = await Promise.all([
    fetchSection('S26', 1),
    fetchSection('17 Pro', 1)
  ])
  heroProducts.value = [...s26, ...iphone].slice(0, 2)
  if (heroProducts.value.length === 0) heroProducts.value = hero.slice(0, 2)

  watchProducts.value = watches
  chargerProducts.value = chargers
  topProducts.value = top
})

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const goToCatalog = (search) => router.push({ path: '/catalog', query: { search } })
const goToCategory = (catId) => router.push({ path: '/catalog', query: { categoryId: catId } })
const getCategoryId = (name) => {
  const c = categories.value.find(c =>
    (c.name || '').toLowerCase().includes(name.toLowerCase())
  )
  return c?.id || null
}

const formatPrice = (p) => Number(p).toLocaleString('ru-RU')
const getImg = (p) => getFullImageUrl(p.mainImageUrl || p.imageUrls?.[0])
</script>

<template>
  <div class="home">

    <!-- ═══════════════════════════════════════ -->
    <!-- HERO — Флагманы                        -->
    <!-- ═══════════════════════════════════════ -->
    <section class="hero-section">
      <div class="hero-left">
        <div class="hero-label">Новинки 2025</div>
        <h1 class="hero-h1">
          Флагманы<br>
          <span class="hero-grad">нового сезона</span>
        </h1>
        <p class="hero-sub">Samsung Galaxy S26 Ultra &amp; iPhone 17 Pro Max — уже в наличии</p>
        <div class="hero-btns">
          <button class="btn-dark" @click="goToCatalog('смартфон')">Смотреть все →</button>
          <button class="btn-ghost" @click="router.push('/catalog')">Весь каталог</button>
        </div>
      </div>

      <div class="hero-right">
        <!-- Если товары подгрузились из API -->
        <div v-if="heroProducts.length" class="hero-cards">
          <div
            v-for="p in heroProducts"
            :key="p.id"
            class="hero-product-card"
            @click="router.push(`/products/${p.id}`)"
          >
            <div class="hero-img-wrap">
              <img :src="getImg(p)" :alt="p.name" class="hero-img" />
            </div>
            <div class="hero-product-info">
              <span class="hero-brand">{{ p.brandName }}</span>
              <h3 class="hero-product-name">{{ p.name }}</h3>
              <div class="hero-price">
                <strong>{{ formatPrice(p.price) }}</strong>
                <span class="cur"> сом</span>
              </div>
              <button class="btn-dark small" @click.stop="addToCart(p, $event)">
                🛒 В корзину
              </button>
            </div>
          </div>
        </div>

        <!-- Заглушка пока грузится -->
        <div v-else class="hero-skeleton-row">
          <div class="hero-skeleton" v-for="n in 2" :key="n">
            <div class="sk sk-img"></div>
            <div class="sk sk-line"></div>
            <div class="sk sk-line short"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ -->
    <!-- СМАРТ-ЧАСЫ                             -->
    <!-- ═══════════════════════════════════════ -->
    <section class="block-section">
      <div class="block-header">
        <div class="block-header-left">
          <span class="eyebrow purple">⌚ Смарт-часы</span>
          <h2 class="block-title">Носимая электроника</h2>
        </div>
        <button class="see-all" @click="getCategoryId('час') ? goToCategory(getCategoryId('час')) : goToCatalog('смарт-час')">
          Все часы →
        </button>
      </div>

      <div v-if="watchProducts.length" class="product-row">
        <div
          v-for="p in watchProducts"
          :key="p.id"
          class="product-card"
          @click="router.push(`/products/${p.id}`)"
        >
          <div class="card-img-wrap">
            <img :src="getImg(p)" :alt="p.name" class="card-img" />
            <span v-if="p.isUsed" class="badge used">Б/У</span>
            <span v-else class="badge new">NEW</span>
            <button class="card-quick" @click.stop="addToCart(p, $event)">🛒 В корзину</button>
          </div>
          <div class="card-info">
            <span class="card-brand">{{ p.brandName }}</span>
            <h4 class="card-name">{{ p.name }}</h4>
            <div class="card-price">
              <strong>{{ formatPrice(p.price) }}</strong>
              <span class="cur"> сом</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Скелетон -->
      <div v-else class="product-row">
        <div v-for="n in 4" :key="n" class="product-skeleton">
          <div class="sk sk-img tall"></div>
          <div class="sk sk-line mt"></div>
          <div class="sk sk-line short mt"></div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ -->
    <!-- ЗАРЯДНЫЕ УСТРОЙСТВА                    -->
    <!-- ═══════════════════════════════════════ -->
    <section class="dark-section">
      <div class="dark-inner">
        <div class="dark-header">
          <div>
            <span class="eyebrow amber">⚡ Зарядные устройства</span>
            <h2 class="block-title light">Заряжайся быстро</h2>
            <p class="dark-sub">GaN технологии, 65W–100W. Anker, Acefast, Baseus и другие</p>
          </div>
          <button class="see-all light" @click="getCategoryId('заряд') ? goToCategory(getCategoryId('заряд')) : goToCatalog('зарядк')">
            Все зарядки →
          </button>
        </div>

        <div v-if="chargerProducts.length" class="charger-row">
          <div
            v-for="p in chargerProducts"
            :key="p.id"
            class="charger-card"
            @click="router.push(`/products/${p.id}`)"
          >
            <div class="charger-img-wrap">
              <img :src="getImg(p)" :alt="p.name" class="charger-img" />
            </div>
            <div class="charger-info">
              <span class="charger-brand">{{ p.brandName }}</span>
              <h4 class="charger-name">{{ p.name }}</h4>
              <div class="charger-price">
                {{ formatPrice(p.price) }} <span class="cur">сом</span>
              </div>
            </div>
            <button class="charger-btn" @click.stop="addToCart(p, $event)">+</button>
          </div>
        </div>

        <div v-else class="charger-row">
          <div v-for="n in 4" :key="n" class="charger-skeleton">
            <div class="sk sk-img small dark-sk"></div>
            <div class="sk sk-line dark-sk mt"></div>
            <div class="sk sk-line short dark-sk mt"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════ -->
    <!-- ТОПОВЫЕ ТОВАРЫ                         -->
    <!-- ═══════════════════════════════════════ -->
    <section class="block-section">
      <div class="block-header">
        <div class="block-header-left">
          <span class="eyebrow gold">🔥 Популярное</span>
          <h2 class="block-title">Топовые товары</h2>
        </div>
        <button class="see-all" @click="router.push('/catalog')">Весь каталог →</button>
      </div>

      <div v-if="topProducts.length" class="top-grid">
        <div
          v-for="p in topProducts"
          :key="p.id"
          class="product-card"
          @click="router.push(`/products/${p.id}`)"
        >
          <div class="card-img-wrap">
            <img :src="getImg(p)" :alt="p.name" class="card-img" />
            <span v-if="p.isUsed" class="badge used">Б/У</span>
            <span v-else class="badge new">NEW</span>
            <button class="card-quick" @click.stop="addToCart(p, $event)">🛒 В корзину</button>
          </div>
          <div class="card-info">
            <span class="card-brand">{{ p.brandName }}</span>
            <h4 class="card-name">{{ p.name }}</h4>
            <div class="card-price">
              <strong>{{ formatPrice(p.price) }}</strong>
              <span class="cur"> сом</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="top-grid">
        <div v-for="n in 8" :key="n" class="product-skeleton">
          <div class="sk sk-img tall"></div>
          <div class="sk sk-line mt"></div>
          <div class="sk sk-line short mt"></div>
        </div>
      </div>
    </section>

    <!-- TOAST -->
    <transition name="toast">
      <div v-if="cartToast" class="cart-toast">
        <span class="toast-icon">✓</span>
        <div class="toast-text">
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
.home {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── КНОПКИ ── */
.btn-dark {
  background: #111;
  color: #fff;
  border: none;
  padding: 13px 26px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: .2s;
  white-space: nowrap;
}
.btn-dark:hover { background: #000; transform: translateY(-1px); }
.btn-dark.small { padding: 9px 18px; font-size: 13px; width: 100%; }
.btn-ghost {
  background: transparent;
  color: #111;
  border: 1.5px solid #111;
  padding: 13px 26px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: .2s;
}
.btn-ghost:hover { background: #111; color: #fff; }

/* ── HERO ── */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 48px;
  align-items: center;
  padding: 64px 0 72px;
  border-bottom: 1px solid #f0f0f0;
}
.hero-label {
  display: inline-block;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 40px;
  margin-bottom: 20px;
}
.hero-h1 {
  font-size: clamp(34px, 4.5vw, 54px);
  font-weight: 900;
  color: #0f172a;
  line-height: 1.05;
  margin: 0 0 16px;
}
.hero-grad {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-size: 15px;
  color: #64748b;
  margin: 0 0 32px;
  line-height: 1.6;
}
.hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }

.hero-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.hero-product-card {
  background: #fff;
  border: 1.5px solid #e8edf2;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  transition: .25s;
}
.hero-product-card:hover {
  border-color: #2563eb;
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(37,99,235,.1);
}
.hero-img-wrap {
  background: #f8fafc;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.hero-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
}
.hero-product-info {
  padding: 16px;
}
.hero-brand {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: #94a3b8;
  display: block;
  margin-bottom: 4px;
}
.hero-product-name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px;
  line-height: 1.4;
  min-height: 36px;
}
.hero-price {
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 12px;
}

/* Скелетоны hero */
.hero-skeleton-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.hero-skeleton {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 24px;
  overflow: hidden;
  padding-bottom: 16px;
}

/* ── ОБЩИЙ БЛОК ── */
.block-section { padding: 64px 0; border-bottom: 1px solid #f0f0f0; }
.block-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 12px;
}
.block-header-left {}
.eyebrow {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  display: block;
  margin-bottom: 6px;
}
.eyebrow.purple { color: #7c3aed; }
.eyebrow.amber  { color: #d97706; }
.eyebrow.gold   { color: #b45309; }
.block-title {
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.block-title.light { color: #fff; }
.see-all {
  background: none;
  border: 1.5px solid #d1d5db;
  padding: 9px 20px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
  transition: .2s;
  white-space: nowrap;
}
.see-all:hover { border-color: #111; color: #111; }
.see-all.light { border-color: rgba(255,255,255,.3); color: rgba(255,255,255,.8); }
.see-all.light:hover { border-color: #fff; color: #fff; }

/* ── КАРТОЧКА ТОВАРА ── */
.product-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
}
.top-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
}
.product-card {
  background: #fff;
  border: 1.5px solid #f0f4f8;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: .22s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0,0,0,.08);
  border-color: #e2e8f0;
}
.card-img-wrap {
  position: relative;
  background: #f9fafb;
  height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card-img {
  max-width: 85%;
  max-height: 85%;
  object-fit: contain;
  mix-blend-mode: multiply;
  transition: .25s;
}
.product-card:hover .card-img { transform: scale(1.04); }
.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 9px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 40px;
  text-transform: uppercase;
  letter-spacing: .5px;
}
.badge.new { background: #111; color: #fff; }
.badge.used { background: #fef3c7; color: #92400e; }
.card-quick {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: #111;
  color: #fff;
  border: none;
  padding: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transform: translateY(100%);
  transition: .22s;
  opacity: 0;
}
.product-card:hover .card-quick { transform: translateY(0); opacity: 1; }
.card-info { padding: 14px; }
.card-brand {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: #94a3b8;
  display: block;
  margin-bottom: 4px;
}
.card-name {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 10px;
  line-height: 1.4;
  min-height: 36px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-price { font-size: 17px; font-weight: 900; color: #0f172a; }
.cur { font-size: 12px; font-weight: 500; color: #94a3b8; }

/* ── ТЁМНАЯ СЕКЦИЯ (ЗАРЯДКИ) ── */
.dark-section {
  background: #0f172a;
  border-radius: 28px;
  margin: 12px 0;
}
.dark-inner { padding: 56px 48px; }
.dark-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 36px;
  flex-wrap: wrap;
  gap: 16px;
}
.dark-sub { font-size: 14px; color: rgba(255,255,255,.5); margin: 10px 0 0; line-height: 1.6; }

.charger-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.charger-card {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 18px;
  padding: 18px;
  cursor: pointer;
  display: flex;
  gap: 14px;
  align-items: center;
  transition: .22s;
  position: relative;
}
.charger-card:hover {
  border-color: #d97706;
  background: rgba(255,255,255,.08);
}
.charger-img-wrap {
  width: 64px;
  height: 64px;
  background: rgba(255,255,255,.08);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.charger-img { max-width: 80%; max-height: 80%; object-fit: contain; mix-blend-mode: lighten; }
.charger-info { flex: 1; min-width: 0; }
.charger-brand {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: rgba(255,255,255,.4);
  display: block;
  margin-bottom: 4px;
}
.charger-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.charger-price { font-size: 15px; font-weight: 800; color: #fbbf24; }
.charger-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.15);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: .2s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.charger-btn:hover { background: #d97706; border-color: #d97706; }

/* ── СКЕЛЕТОНЫ ── */
.sk { border-radius: 10px; animation: shimmer 1.4s infinite; }
.sk-img { height: 180px; background: #f0f0f0; }
.sk-img.tall { height: 190px; }
.sk-img.small { height: 64px; width: 64px; border-radius: 14px; }
.sk-img.dark-sk { background: rgba(255,255,255,.07); }
.sk-line { height: 14px; background: #f0f0f0; }
.sk-line.short { width: 55%; }
.sk-line.dark-sk { background: rgba(255,255,255,.07); }
.sk-line.mt, .sk-img.mt { margin-top: 10px; }
.product-skeleton {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  overflow: hidden;
  padding-bottom: 16px;
}
.charger-skeleton {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  gap: 14px;
  align-items: center;
}
@keyframes shimmer {
  0%   { opacity: 1; }
  50%  { opacity: .5; }
  100% { opacity: 1; }
}

/* ── TOAST ── */
.cart-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #fff;
  border-left: 4px solid #111;
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.12);
  z-index: 1000;
  max-width: 340px;
}
.toast-icon {
  background: #22c55e;
  color: #fff;
  width: 24px; height: 24px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; flex-shrink: 0;
}
.toast-text p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
.toast-link { font-size: 12px; font-weight: 700; color: #111; white-space: nowrap; text-decoration: none; }
.toast-enter-active, .toast-leave-active { transition: .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .hero-section { grid-template-columns: 1fr; padding: 44px 0 48px; }
  .dark-inner { padding: 40px 28px; }
}
@media (max-width: 640px) {
  .hero-cards, .hero-skeleton-row { grid-template-columns: 1fr 1fr; }
  .product-row, .top-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .charger-row { grid-template-columns: 1fr; }
  .card-img-wrap { height: 150px; }
  .dark-inner { padding: 32px 20px; }
  .dark-section { border-radius: 20px; }
}
@media (max-width: 400px) {
  .hero-cards, .hero-skeleton-row { grid-template-columns: 1fr; }
}
</style>