<script setup>
import { ref } from 'vue'
import { RouterView, RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useCartStore } from './stores/cart';

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();

const mobileMenuOpen = ref(false);
const closeMenu = () => { mobileMenuOpen.value = false };
</script>

<template>
  <div class="app-shell">
    <header class="navbar">
      <div class="navbar-inner">
        <RouterLink to="/" class="logo" @click="closeMenu">
          <span class="logo-orbit">🪐</span>
          <span class="logo-text">
            <strong>ПЛАНЕТА</strong>
            <small>аксессуары для телефонов</small>
          </span>
        </RouterLink>

        <button class="burger" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Меню">
          <span :class="{ open: mobileMenuOpen }"></span>
        </button>

        <nav class="nav-links" :class="{ open: mobileMenuOpen }">
          <RouterLink to="/catalog" class="nav-link" @click="closeMenu">Каталог</RouterLink>
          <RouterLink to="/contacts" class="nav-link" @click="closeMenu">Контакты</RouterLink>

          <RouterLink to="/cart" class="nav-link nav-cart" @click="closeMenu">
            🛒 Корзина
            <span v-if="cartStore.totalItems > 0" class="cart-badge">
              {{ cartStore.totalItems }}
            </span>
          </RouterLink>

          <RouterLink
            v-if="authStore.isAdmin || authStore.isManager"
            to="/admin/create-product"
            class="nav-link nav-link-accent"
            @click="closeMenu"
          >
            + Товар
          </RouterLink>

          <RouterLink
            v-if="authStore.isAdmin || authStore.isManager"
            to="/admin/orders"
            class="nav-link"
            @click="closeMenu"
          >
            Заказы
          </RouterLink>

          <template v-if="!authStore.isAuthenticated">
            <RouterLink to="/login" class="nav-link" @click="closeMenu">Войти</RouterLink>
            <RouterLink to="/register" class="btn-nav-register" @click="closeMenu">Регистрация</RouterLink>
          </template>

          <button v-else @click="authStore.logout(); closeMenu()" class="btn-logout">
            Выйти · {{ authStore.user?.unique_name || authStore.user?.sub || 'Пользователь' }}
          </button>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <strong>🪐 ПЛАНЕТА</strong>
          <p>Премиальные аксессуары для ваших устройств</p>
          <RouterLink to="/contacts" class="footer-link">Контакты и адрес →</RouterLink>
        </div>
        <div class="footer-contacts">
          <p>📍 ул. Аскар Шакирова 105, Ош, Кыргызстан</p>
          <p>📞 +996 552 267 777</p>
          <p>🕐 Ежедневно 10:00 — 22:00</p>
        </div>
        <div class="footer-nav">
          <RouterLink to="/catalog" class="footer-link">Каталог</RouterLink>
          <RouterLink to="/cart" class="footer-link">Корзина</RouterLink>
          <RouterLink to="/contacts" class="footer-link">Контакты</RouterLink>
        </div>
      </div>
      <div class="footer-bottom">© 2026 ПЛАНЕТА. Все права защищены.</div>
    </footer>
  </div>
</template>

<style>
:root {
  --ink: #0f172a;
  --muted: #64748b;
  --line: #f0f0f0;
  --line-strong: #e2e8f0;
  --radius-lg: 28px;
  --radius-md: 20px;
  --radius-sm: 14px;
  --radius-pill: 40px;
  --shadow-sm: 0 4px 12px rgba(0,0,0,.06);
  --shadow-md: 0 12px 28px rgba(0,0,0,.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #fff;
  color: var(--ink);
  min-height: 100vh;
}

a { text-decoration: none; color: inherit; transition: .2s ease; }

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* ── NAVBAR — светлый, в стиле HomePage ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.navbar-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 32px;
}

.logo { display: flex; align-items: center; gap: 10px; }
.logo-orbit { font-size: 24px; }
.logo-text strong {
  font-size: 16px;
  letter-spacing: 1.5px;
  font-weight: 800;
  color: var(--ink);
  display: block;
}
.logo-text small {
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
}

.nav-links { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.nav-link {
  color: #475569;
  padding: 9px 16px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
  transition: .2s;
}
.nav-link:hover { background: #f1f5f9; color: var(--ink); }
.nav-link.router-link-active { background: var(--ink); color: #fff; }

.nav-link-accent {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff !important;
}
.nav-link-accent:hover { opacity: .9; }

.btn-nav-register {
  background: var(--ink);
  color: #fff !important;
  padding: 9px 20px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 800;
  transition: .2s;
}
.btn-nav-register:hover { background: #000; transform: translateY(-1px); }

.btn-logout {
  background: transparent;
  border: 1.5px solid var(--line-strong);
  color: #475569;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: .2s;
}
.btn-logout:hover { border-color: var(--ink); color: var(--ink); }

.nav-cart {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cart-badge {
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Бургер (скрыт на десктопе) */
.burger {
  display: none;
  width: 36px; height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
}
.burger span,
.burger span::before,
.burger span::after {
  content: '';
  position: absolute;
  left: 7px; right: 7px;
  height: 2px;
  background: var(--ink);
  border-radius: 2px;
  transition: .25s;
}
.burger span { top: 17px; }
.burger span::before { top: -7px; }
.burger span::after { top: 7px; }
.burger span.open { background: transparent; }
.burger span.open::before { transform: rotate(45deg); top: 0; }
.burger span.open::after { transform: rotate(-45deg); top: 0; }

/* ── MAIN ── */
.main-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

/* ── FOOTER — тёмная секция в стиле HomePage dark-section ── */
.site-footer {
  background: #0f172a;
  color: rgba(255,255,255,.7);
  margin-top: auto;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 32px;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 40px;
}
.footer-brand strong {
  font-size: 19px;
  color: #fff;
  display: block;
  margin-bottom: 8px;
}
.footer-brand p {
  margin: 6px 0 14px;
  font-size: 13px;
  color: rgba(255,255,255,.55);
  line-height: 1.5;
}
.footer-contacts p {
  margin: 6px 0;
  font-size: 13px;
  color: rgba(255,255,255,.55);
  line-height: 1.6;
}
.footer-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-link {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,.6);
  transition: .2s;
}
.footer-link:hover { color: #fff; }

.footer-bottom {
  border-top: 1px solid rgba(255,255,255,.08);
  text-align: center;
  padding: 16px 32px;
  font-size: 12px;
  color: rgba(255,255,255,.35);
}

/* ── АДАПТИВ ── */
@media (max-width: 900px) {
  .burger { display: block; }

  .nav-links {
    position: fixed;
    top: 64px;
    left: 0; right: 0;
    background: #fff;
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    gap: 8px;
    border-bottom: 1px solid var(--line);
    box-shadow: var(--shadow-md);
    transform: translateY(-12px);
    opacity: 0;
    pointer-events: none;
    transition: .2s ease;
  }
  .nav-links.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }
  .nav-link, .btn-nav-register, .btn-logout, .nav-cart {
    width: 100%;
    text-align: center;
  }

  .footer-inner { grid-template-columns: 1fr; gap: 28px; padding: 36px 24px; }
}

@media (max-width: 480px) {
  .navbar-inner { padding: 12px 16px; }
  .main-content { padding: 20px 16px; }
}
</style>