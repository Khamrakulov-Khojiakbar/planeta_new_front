<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(email.value, password.value)
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' ? redirect : '/')
  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || 'Ошибка авторизации. Проверьте данные.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <span class="brand-icon">🪐</span>
        <h1>ПЛАНЕТА</h1>
        <p>Добро пожаловать в магазин аксессуаров</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <h2>Вход в аккаунт</h2>

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="example@mail.ru"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label>Пароль</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

        <p class="auth-footer">
          Нет аккаунта?
          <RouterLink to="/register">Зарегистрироваться</RouterLink>
        </p>
      </form>
    </div>

    <div class="auth-decoration">
      <div class="deco-content">
        <h3>Лучшие аксессуары<br />для вашего смартфона</h3>
        <ul>
          <li>Чехлы и защитные стёкла</li>
          <li>Кабели и зарядные устройства</li>
          <li>Наушники и гаджеты</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 180px);
  gap: 0;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--planet-shadow);
  border: 1px solid var(--planet-border);
}

.auth-card {
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-icon {
  font-size: 40px;
  filter: drop-shadow(0 0 10px rgba(124, 58, 237, 0.5));
}

.auth-brand h1 {
  margin: 8px 0 4px;
  font-size: 28px;
  letter-spacing: 2px;
}

.auth-brand p {
  margin: 0;
  color: var(--planet-muted);
  font-size: 14px;
}

.auth-form h2 {
  margin: 0 0 24px;
  font-size: 20px;
  color: #374151;
}

.form-group {
  margin-bottom: 18px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--planet-border);
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
  transition: 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--planet-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  transition: 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #dc2626;
  font-size: 14px;
  text-align: center;
  margin-top: 14px;
  background: #fef2f2;
  padding: 10px;
  border-radius: 8px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--planet-muted);
}

.auth-footer a {
  color: var(--planet-primary);
  font-weight: 600;
}

.auth-decoration {
  background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: white;
}

.deco-content h3 {
  font-size: 28px;
  line-height: 1.3;
  margin: 0 0 24px;
}

.deco-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.deco-content li {
  padding: 10px 0;
  font-size: 16px;
  color: #ddd6fe;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.deco-content li::before {
  content: '✦ ';
  color: var(--planet-accent);
}

@media (max-width: 768px) {
  .auth-page {
    grid-template-columns: 1fr;
  }

  .auth-decoration {
    display: none;
  }

  .auth-card {
    padding: 32px 24px;
  }
}
</style>
