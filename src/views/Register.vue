<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '../api/axios'

const router = useRouter()

const username = ref('')
const email = ref('')
const phoneNumber = ref('')
const password = ref('')

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await api.post('/api/auth/register', {
      username: username.value,
      email: email.value,
      phoneNumber: phoneNumber.value,
      password: password.value,
      roleId: 4
    })

    successMessage.value = 'Регистрация успешна! Перенаправление на вход...'
    setTimeout(() => router.push('/login'), 2000)
  } catch (err) {
    if (err.response?.data?.errors) {
      errorMessage.value = Object.values(err.response.data.errors)
        .flat()
        .join(', ')
    } else {
      errorMessage.value =
        err.response?.data?.message ||
        err.response?.data ||
        'Ошибка регистрации.'
    }
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
        <p>Создайте аккаунт для заказов</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-form">
        <h2>Регистрация</h2>

        <div class="form-group">
          <label>Имя пользователя</label>
          <input
            v-model="username"
            type="text"
            placeholder="Ваш логин"
            required
            autocomplete="username"
          />
        </div>

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
          <label>Телефон</label>
          <input
            v-model="phoneNumber"
            type="tel"
            placeholder="+996 XXX XXX XXX"
            required
            autocomplete="tel"
          />
        </div>

        <div class="form-group">
          <label>Пароль</label>
          <input
            v-model="password"
            type="password"
            placeholder="Минимум 6 символов"
            required
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Регистрация...' : 'Создать аккаунт' }}
        </button>

        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-msg">{{ successMessage }}</p>

        <p class="auth-footer">
          Уже есть аккаунт?
          <RouterLink to="/login">Войти</RouterLink>
        </p>
      </form>
    </div>

    <div class="auth-decoration">
      <div class="deco-content">
        <h3>Присоединяйтесь<br />к ПЛАНЕТЕ</h3>
        <p class="deco-text">
          Регистрируйтесь, чтобы оформлять заказы на чехлы, стёкла, кабели и
          другие аксессуары с доставкой.
        </p>
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
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-brand {
  text-align: center;
  margin-bottom: 28px;
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
  margin: 0 0 20px;
  font-size: 20px;
  color: #374151;
}

.form-group {
  margin-bottom: 14px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid var(--planet-border);
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--planet-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #111827;
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
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: #dc2626;
  font-size: 14px;
  text-align: center;
  margin-top: 12px;
  background: #fef2f2;
  padding: 10px;
  border-radius: 8px;
}

.success-msg {
  color: #166534;
  font-size: 14px;
  text-align: center;
  margin-top: 12px;
  background: #f0fdf4;
  padding: 10px;
  border-radius: 8px;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
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
  margin: 0 0 16px;
}

.deco-text {
  color: #ddd6fe;
  line-height: 1.7;
  font-size: 15px;
  margin: 0;
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
