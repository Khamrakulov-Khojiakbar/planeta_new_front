<script setup>
import { RouterView, RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useCartStore } from './stores/cart';

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();

function goToCatalog() {
  router.push('/');
}
</script>

<template>
  <div class="app-shell">
    <header class="navbar">
      <RouterLink to="/" class="logo">
        <span class="logo-orbit">🪐</span>
        <span class="logo-text">
          <strong>ПЛАНЕТА</strong>
          <small>аксессуары для телефонов</small>
        </span>
      </RouterLink>

      <nav class="nav-links">
        <RouterLink to="/" class="nav-link">Каталог</RouterLink>

        <RouterLink to="/cart" class="nav-link nav-cart">
          🛒 Корзина
          <span v-if="cartStore.totalItems > 0" class="cart-badge">
            {{ cartStore.totalItems }}
          </span>
        </RouterLink>

        <RouterLink
          v-if="authStore.isAdmin || authStore.isManager"
          to="/admin/create-product"
          class="nav-link nav-link-accent"
        >
          + Товар
        </RouterLink>

        <RouterLink
          v-if="authStore.isAdmin || authStore.isManager"
          to="/admin/orders"
          class="nav-link"
        >
          Заказы
        </RouterLink>

        <template v-if="!authStore.isAuthenticated">
          <RouterLink to="/login" class="nav-link">Войти</RouterLink>
          <RouterLink to="/register" class="btn-nav-register">Регистрация</RouterLink>
        </template>

        <button v-else @click="authStore.logout" class="btn-logout">
          Выйти · {{ authStore.user?.unique_name || authStore.user?.sub || 'Пользователь' }}
        </button>
      </nav>
    </header>

    <main class="main-content">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <strong>🪐 ПЛАНЕТА</strong>
          <p>Премиальные аксессуары для ваших устройств</p>
        </div>
        <div class="footer-contacts">
          <p>📍 ул. Аскар Шакирова 105, Ош, Кыргызстан</p>
          <p>📞 +996 552 267 777</p>
          <p>🕐 Ежедневно 08:00 — 22:00</p>
        </div>
      </div>
      <div class="footer-bottom">© 2026 ПЛАНЕТА. Все права защищены.</div>
    </footer>
  </div>
</template>

<style>
:root {
  --primary-black: #1a1a1a;
  --secondary-black: #2d2d2d;
  --text-light: #f5f5f5;
  --text-dark: #1a1a1a;
  --border-color: #e0e0e0;
  --radius: 12px;
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.12);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f8f8f8;
  color: var(--text-dark);
  min-height: 100vh;
}

a {
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

/* ---------- NAVBAR (чёрный, как в mi-shop) ---------- */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 32px;
  background: #000000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--shadow-sm);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ffffff;
}

.logo-orbit {
  font-size: 28px;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.5));
}

.logo-text strong {
  font-size: 18px;
  letter-spacing: 2px;
  font-weight: 800;
  color: #ffffff;
}

.logo-text small {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nav-link {
  color: rgba(255, 255, 255, 0.85);
  padding: 8px 14px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.nav-link-accent {
  background: #2c2c2c;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-link-accent:hover {
  background: #3d3d3d;
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-nav-register {
  background: #ffffff;
  color: #000000 !important;
  padding: 8px 18px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.btn-nav-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background: #f0f0f0;
}

.btn-logout {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-cart {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cart-badge {
  background: #ff6600;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ---------- MAIN CONTENT ---------- */
.main-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

/* ---------- FOOTER (тёмный, минималистичный) ---------- */
.site-footer {
  background: #000000;
  color: rgba(255, 255, 255, 0.7);
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 32px;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 48px;
}

.footer-brand strong {
  font-size: 20px;
  color: white;
  display: block;
  margin-bottom: 8px;
}

.footer-brand p,
.footer-contacts p {
  margin: 6px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  padding: 16px 32px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* ---------- АДАПТИВ ---------- */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
    align-items: stretch;
  }

  .logo {
    justify-content: center;
  }

  .nav-links {
    justify-content: center;
  }

  .main-content {
    padding: 20px 16px;
  }

  .footer-inner {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 32px 20px;
  }
}

@media (max-width: 480px) {
  .nav-links {
    gap: 6px;
  }
  .nav-link, .btn-logout, .btn-nav-register {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>