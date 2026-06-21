<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const productId = route.params.productId

const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')

const categories = ref([])
const brands = ref([])

const presetAttributes = [
  'Цвет',
  'Совместимость',
  'Материал',
  'Длина кабеля',
  'Мощность',
  'Тип разъёма'
]

const form = ref({
  name: '',
  price: 0,
  description: '',
  categoryId: null,
  brandId: null,
  isUsed: false,
  imei: '',
  stockQuantity: 1,
  mainImageUrl: '',
  imageUrls: [],
  attributes: []
})

const fetchDependencies = async () => {
  const [categoriesRes, brandsRes] = await Promise.all([
    api.get('/api/getcategories'),
    api.get('/api/brands')
  ])
  categories.value = categoriesRes.data
  brands.value = brandsRes.data
}

const fetchProductData = async () => {
  const response = await api.get(`/api/products/${productId}`)
  const product = response.data

  const category = categories.value.find((c) => c.name === product.categoryName)
  const brand = brands.value.find((b) => b.name === product.brandName)

  form.value = {
    name: product.name,
    price: product.price,
    description: product.description || '',
    categoryId: category?.id ?? null,
    brandId: brand?.id ?? null,
    isUsed: product.isUsed,
    imei: '',
    stockQuantity: 1,
    mainImageUrl: product.mainImageUrl || '',
    imageUrls: product.imageUrls || [],
    attributes: product.attributes
      ? product.attributes.map((attr) => ({
          attributeName: attr.attributeName || attr.name || '',
          value: attr.value || ''
        }))
      : []
  }
}

onMounted(async () => {
  try {
    await fetchDependencies()
    await fetchProductData()
  } catch (err) {
    console.error(err)
    errorMsg.value = 'Не удалось загрузить данные товара.'
  } finally {
    loading.value = false
  }
})

const handleSave = async () => {
  if (!form.value.name || !form.value.price || !form.value.categoryId) {
    alert('Заполните обязательные поля!')
    return
  }

  saving.value = true
  errorMsg.value = ''

  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      price: Number(form.value.price),
      categoryId: Number(form.value.categoryId),
      brandId: form.value.brandId ? Number(form.value.brandId) : null,
      isUsed: form.value.isUsed,
      imei: form.value.imei || null,
      stockQuantity: Number(form.value.stockQuantity) || 1,
      mainImageUrl: form.value.mainImageUrl || '',
      imageUrls: form.value.imageUrls || [],
      attributes: form.value.attributes
        .filter((a) => a.attributeName.trim() && a.value.trim())
        .map((a) => ({
          attributeName: a.attributeName.trim(),
          value: a.value.trim()
        }))
    }

    await api.put(`/api/products/${productId}`, payload)
    router.push(`/products/${productId}`)
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message || err.response?.data || 'Ошибка сохранения.'
  } finally {
    saving.value = false
  }
}

const addAttribute = (presetName = '') => {
  form.value.attributes.push({ attributeName: presetName, value: '' })
}

const removeAttribute = (index) => {
  form.value.attributes.splice(index, 1)
}
</script>

<template>
  <div class="edit-page">
    <button @click="router.push(`/products/${productId}`)" class="btn-back">
      ← Назад к товару
    </button>

    <div class="page-header">
      <h1>Редактирование товара</h1>
      <p>ID: {{ productId }} · магазин ПЛАНЕТА</p>
    </div>

    <div v-if="loading" class="loading-box">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>

    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

    <form v-if="!loading" @submit.prevent="handleSave" class="form-layout">
      <section class="form-card">
        <h2>📦 Основная информация</h2>

        <div class="form-group">
          <label>Название *</label>
          <input v-model="form.name" type="text" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Цена (сом) *</label>
            <input v-model.number="form.price" type="number" min="0" required />
          </div>
          <div class="form-group">
            <label>Состояние</label>
            <select v-model="form.isUsed">
              <option :value="false">Новый</option>
              <option :value="true">Б/У</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Бренд</label>
            <select v-model="form.brandId">
              <option :value="null" disabled>Выбрать бренд...</option>
              <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                {{ brand.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Категория *</label>
            <select v-model="form.categoryId" required>
              <option :value="null" disabled>Выбрать категорию...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>IMEI / Артикул</label>
            <input v-model="form.imei" type="text" />
          </div>
          <div class="form-group">
            <label>Количество</label>
            <input v-model.number="form.stockQuantity" type="number" min="0" />
          </div>
        </div>

        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="form.description" rows="4"></textarea>
        </div>
      </section>

      <section class="form-card">
        <div class="section-top">
          <div>
            <h2>⚙️ Характеристики</h2>
            <p class="hint">Цвет, совместимость, материал и другие параметры</p>
          </div>
          <button type="button" @click="addAttribute()" class="btn-add">
            + Добавить
          </button>
        </div>

        <div class="presets">
          <span>Быстро:</span>
          <button
            v-for="preset in presetAttributes"
            :key="preset"
            type="button"
            @click="addAttribute(preset)"
            class="preset-btn"
          >
            {{ preset }}
          </button>
        </div>

        <p v-if="form.attributes.length === 0" class="empty-attrs">
          Характеристики не заданы
        </p>

        <div
          v-for="(attr, index) in form.attributes"
          :key="index"
          class="attr-row"
        >
          <input
            v-model="attr.attributeName"
            type="text"
            placeholder="Название"
            required
          />
          <input
            v-model="attr.value"
            type="text"
            placeholder="Значение"
            required
          />
          <button
            type="button"
            @click="removeAttribute(index)"
            class="btn-remove"
          >
            ✕
          </button>
        </div>
      </section>

      <div class="actions-row">
        <button
          type="button"
          @click="router.push(`/products/${productId}`)"
          class="btn-secondary"
          :disabled="saving"
        >
          Отмена
        </button>
        <button type="submit" class="btn-submit" :disabled="saving">
          {{ saving ? 'Сохранение...' : '💾 Сохранить изменения' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.edit-page {
  max-width: 820px;
  margin: 0 auto;
}

.btn-back {
  background: white;
  border: 1px solid var(--planet-border);
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 28px;
}

.page-header p {
  margin: 0 0 24px;
  color: var(--planet-muted);
}

.loading-box {
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
  to { transform: rotate(360deg); }
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 14px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
}

.form-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-card {
  background: white;
  border-radius: var(--planet-radius);
  padding: 24px;
  box-shadow: var(--planet-shadow);
  border: 1px solid var(--planet-border);
}

.form-card h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

input,
select,
textarea {
  padding: 11px 13px;
  border: 1px solid var(--planet-border);
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--planet-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.section-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.section-top h2 {
  margin: 0;
}

.hint {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--planet-muted);
}

.btn-add {
  background: #f5f3ff;
  color: var(--planet-primary);
  border: 1px solid #ddd6fe;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--planet-muted);
}

.preset-btn {
  background: #fafafa;
  border: 1px solid var(--planet-border);
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
}

.preset-btn:hover {
  border-color: var(--planet-primary);
  color: var(--planet-primary);
}

.empty-attrs {
  text-align: center;
  color: var(--planet-muted);
  font-size: 14px;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
  margin-bottom: 12px;
}

.attr-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  margin-bottom: 10px;
}

.btn-remove {
  width: 42px;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-secondary {
  background: white;
  border: 1px solid var(--planet-border);
  padding: 14px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.btn-submit {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-row,
  .attr-row {
    grid-template-columns: 1fr;
  }

  .btn-remove {
    width: 100%;
  }

  .actions-row {
    flex-direction: column;
  }
}
</style>
