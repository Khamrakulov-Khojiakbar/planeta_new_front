<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'

const router = useRouter()

const brands = ref([])
const categories = ref([])
const attributes = ref([])

const productForm = ref({
  name: '',
  description: '',
  price: 0,
  isUsed: false,
  brandId: '',
  categoryId: '',
  stockQuantity: 1,
  imei: ''
})

// Модальные окна для создания бренда и категории
const showBrandModal = ref(false)
const showCategoryModal = ref(false)
const newBrand = ref({ name: '' })
const newCategory = ref({ name: '' })
const brandLoading = ref(false)
const categoryLoading = ref(false)

const loading = ref(false)
const initLoading = ref(true)

const presetAttributes = [
  'Цвет',
  'Совместимость',
  'Материал',
  'Длина кабеля',
  'Мощность',
  'Тип разъёма'
]

const loadFormDependencies = async () => {
  try {
    const [brandsRes, categoriesRes] = await Promise.all([
      api.get('/api/brands'),
      api.get('/api/getcategories')
    ])
    brands.value = brandsRes.data
    categories.value = categoriesRes.data
    
    // Логируем для отладки
    console.log('Загруженные категории:', categories.value)
    console.log('Загруженные бренды:', brands.value)
  } catch (err) {
    console.error(err)
    alert('Не удалось загрузить справочники.')
  } finally {
    initLoading.value = false
  }
}

// Создание нового бренда
const createBrand = async () => {
  if (!newBrand.value.name.trim()) {
    alert('Введите название бренда')
    return
  }
  
  brandLoading.value = true
  try {
    const response = await api.post('/api/createbrand', {
      name: newBrand.value.name.trim()
    })
    
    const createdBrand = response.data
    console.log('Созданный бренд:', createdBrand)
    
    // Добавляем новый бренд в список
    brands.value.push(createdBrand)
    
    // Автоматически выбираем созданный бренд
    productForm.value.brandId = createdBrand.id
    
    // Закрываем модальное окно и очищаем форму
    showBrandModal.value = false
    newBrand.value = { name: '' }
    
    alert(`Бренд "${createdBrand.name}" успешно создан!`)
  } catch (err) {
    console.error(err)
    if (err.response?.status === 401) {
      alert('Ошибка авторизации. Пожалуйста, войдите как администратор или менеджер.')
    } else {
      const errorMsg = err.response?.data?.message || err.message || 'Ошибка при создании бренда'
      alert('Ошибка: ' + errorMsg)
    }
  } finally {
    brandLoading.value = false
  }
}

// Создание новой категории
const createCategory = async () => {
  if (!newCategory.value.name.trim()) {
    alert('Введите название категории')
    return
  }
  
  categoryLoading.value = true
  try {
    const response = await api.post('/api/createcategory', {
      name: newCategory.value.name.trim()
    })
    
    const createdCategory = response.data
    console.log('Созданная категория:', createdCategory)
    
    // Добавляем новую категорию в список
    categories.value.push(createdCategory)
    
    // Автоматически выбираем созданную категорию
    productForm.value.categoryId = createdCategory.id
    
    // Закрываем модальное окно и очищаем форму
    showCategoryModal.value = false
    newCategory.value = { name: '' }
    
    alert(`Категория "${createdCategory.name}" успешно создана!`)
  } catch (err) {
    console.error(err)
    if (err.response?.status === 401) {
      alert('Ошибка авторизации. Пожалуйста, войдите как администратор или менеджер.')
    } else {
      const errorMsg = err.response?.data?.message || err.message || 'Ошибка при создании категории'
      alert('Ошибка: ' + errorMsg)
    }
  } finally {
    categoryLoading.value = false
  }
}

const addAttribute = (presetName = '') => {
  attributes.value.push({ attributeName: presetName, value: '' })
}

const removeAttribute = (index) => {
  attributes.value.splice(index, 1)
}

const handleCreateProduct = async () => {
  // Валидация
  if (!productForm.value.name || !productForm.value.brandId || !productForm.value.categoryId) {
    alert('Заполните: Название, Бренд и Категория!')
    console.log('Текущие значения формы:', {
      name: productForm.value.name,
      brandId: productForm.value.brandId,
      categoryId: productForm.value.categoryId,
      brands: brands.value,
      categories: categories.value
    })
    return
  }
  
  if (productForm.value.price <= 0) {
    alert('Цена должна быть больше нуля!')
    return
  }

  // Проверяем, существует ли выбранная категория в списке
  const selectedCategory = categories.value.find(c => c.id === productForm.value.categoryId)
  if (!selectedCategory) {
    alert(`Категория с ID ${productForm.value.categoryId} не найдена. Пожалуйста, выберите категорию заново.`)
    productForm.value.categoryId = ''
    return
  }
  
  // Проверяем, существует ли выбранный бренд в списке
  const selectedBrand = brands.value.find(b => b.id === productForm.value.brandId)
  if (!selectedBrand) {
    alert(`Бренд с ID ${productForm.value.brandId} не найден. Пожалуйста, выберите бренд заново.`)
    productForm.value.brandId = ''
    return
  }

  console.log('Отправка товара:', {
    name: productForm.value.name,
    categoryId: productForm.value.categoryId,
    categoryName: selectedCategory.name,
    brandId: productForm.value.brandId,
    brandName: selectedBrand.name
  })

  const filledAttributes = attributes.value
    .filter(a => a.attributeName.trim() && a.value.trim())
    .map(a => ({
      attributeName: a.attributeName.trim(),
      value: a.value.trim()
    }))

  loading.value = true
  try {
    const payload = {
      name: productForm.value.name.trim(),
      description: productForm.value.description?.trim() || '',
      price: Number(productForm.value.price),
      isUsed: Boolean(productForm.value.isUsed),
      brandId: Number(productForm.value.brandId),
      categoryId: Number(productForm.value.categoryId),
      stockQuantity: Number(productForm.value.stockQuantity) || 1,
      imei: productForm.value.imei || null,
      attributes: filledAttributes
    }

    console.log('Отправляемый payload:', payload)
    
    const response = await api.post('/api/products/create', payload)
    console.log('Ответ сервера:', response.data)
    
    alert('Товар успешно создан!')

    const createdId = response.data.productId || response.data.ProductId
    if (createdId) {
      router.push(`/products/${createdId}`)
    } else {
      router.push('/')
    }
  } catch (err) {
    console.error('Ошибка при создании товара:', err.response?.data || err)
    
    if (err.response?.status === 401) {
      alert('Ошибка авторизации. Пожалуйста, войдите как администратор или менеджер для создания товаров.')
    } else if (err.response?.status === 500) {
      alert('Ошибка сервера при создании товара. Проверьте, что выбранная категория и бренд существуют в базе данных.')
    } else {
      let msg = err.response?.data?.message || err.message
      if (err.response?.data?.errors) {
        msg += '\n' + Object.values(err.response.data.errors).flat().join('\n')
      }
      alert('Ошибка: ' + msg)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFormDependencies()
})
</script>

<template>
  <div class="create-page">
    <button @click="router.push('/')" class="btn-back">← Назад в каталог</button>

    <div class="page-header">
      <h1>Добавить товар</h1>
      <p>Заполните карточку аксессуара для магазина ПЛАНЕТА</p>
    </div>

    <div v-if="initLoading" class="loading-box">Загрузка справочников...</div>

    <form v-else @submit.prevent="handleCreateProduct" class="form-layout">

      <!-- Основное -->
      <section class="form-card">
        <h2>📦 Основная информация</h2>

        <div class="form-group">
          <label>Название *</label>
          <input v-model="productForm.name" type="text" placeholder="Чехол Silicone Case iPhone 15 Pro" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Бренд *</label>
            <div class="select-with-button">
              <select v-model.number="productForm.brandId" required>
                <option value="" disabled>Выберите бренд</option>
                <option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
              </select>
              <button 
                type="button" 
                @click="showBrandModal = true" 
                class="btn-add-small" 
                title="Добавить новый бренд"
              >
                + Новый
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Категория *</label>
            <div class="select-with-button">
              <select v-model.number="productForm.categoryId" required>
                <option value="" disabled>Выберите категорию</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
              <button 
                type="button" 
                @click="showCategoryModal = true" 
                class="btn-add-small" 
                title="Добавить новую категорию"
              >
                + Новая
              </button>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Цена (сом) *</label>
            <input v-model.number="productForm.price" type="number" min="1" required />
          </div>
          <div class="form-group">
            <label>Количество на складе</label>
            <input v-model.number="productForm.stockQuantity" type="number" min="1" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>IMEI / Артикул</label>
            <input v-model="productForm.imei" type="text" placeholder="Необязательно" />
          </div>
          <div class="form-group checkbox-wrap">
            <label class="checkbox-label">
              <input v-model="productForm.isUsed" type="checkbox" />
              <span>Товар Б/У</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="productForm.description" rows="4" placeholder="Материал, комплектация, особенности..."></textarea>
        </div>
      </section>

      <!-- Атрибуты -->
      <section class="form-card">
        <div class="section-top">
          <div>
            <h2>⚙️ Характеристики</h2>
            <p class="hint">Добавьте параметры: цвет, совместимость, материал и т.д.</p>
          </div>
          <button type="button" @click="addAttribute()" class="btn-add">+ Добавить</button>
        </div>

        <div class="presets">
          <span>Быстро добавить:</span>
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

        <p v-if="attributes.length === 0" class="empty-attrs">
          Характеристики не добавлены. Нажмите «+ Добавить» или выберите из списка выше.
        </p>

        <div v-for="(attr, index) in attributes" :key="index" class="attr-row">
          <input
            v-model="attr.attributeName"
            type="text"
            placeholder="Название (Цвет)"
            required
          />
          <input
            v-model="attr.value"
            type="text"
            placeholder="Значение (Чёрный)"
            required
          />
          <button type="button" @click="removeAttribute(index)" class="btn-remove" title="Удалить">✕</button>
        </div>
      </section>

      <button type="submit" :disabled="loading" class="btn-submit">
        {{ loading ? 'Сохранение...' : '🪐 Создать товар и загрузить фото' }}
      </button>
    </form>

    <!-- Модальное окно для создания бренда -->
    <div v-if="showBrandModal" class="modal-overlay" @click.self="showBrandModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>➕ Новый бренд</h3>
          <button @click="showBrandModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <label>Название бренда</label>
          <input 
            v-model="newBrand.name" 
            type="text" 
            placeholder="Например: Apple, Samsung, Xiaomi"
            @keyup.enter="createBrand"
            autofocus
          />
          <p class="hint-modal">* Требуются права администратора или менеджера</p>
        </div>
        <div class="modal-footer">
          <button @click="showBrandModal = false" class="btn-cancel">Отмена</button>
          <button @click="createBrand" :disabled="brandLoading" class="btn-create">
            {{ brandLoading ? 'Создание...' : 'Создать' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно для создания категории -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>📁 Новая категория</h3>
          <button @click="showCategoryModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <label>Название категории</label>
          <input 
            v-model="newCategory.name" 
            type="text" 
            placeholder="Например: Чехлы, Стекло, Кабели"
            @keyup.enter="createCategory"
            autofocus
          />
          <p class="hint-modal">* Требуются права администратора или менеджера</p>
        </div>
        <div class="modal-footer">
          <button @click="showCategoryModal = false" class="btn-cancel">Отмена</button>
          <button @click="createCategory" :disabled="categoryLoading" class="btn-create">
            {{ categoryLoading ? 'Создание...' : 'Создать' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-page {
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
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f9fafb;
  transform: translateX(-2px);
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
  padding: 40px;
  background: white;
  border-radius: var(--planet-radius);
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

input, select, textarea {
  padding: 11px 13px;
  border: 1px solid var(--planet-border);
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.2s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--planet-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.select-with-button {
  display: flex;
  gap: 8px;
  align-items: center;
}

.select-with-button select {
  flex: 1;
}

.btn-add-small {
  background: #f5f3ff;
  color: var(--planet-primary);
  border: 1px solid #ddd6fe;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-add-small:hover {
  background: #ede9fe;
  transform: translateY(-1px);
}

.checkbox-wrap { justify-content: center; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  cursor: pointer;
  font-weight: 500;
}

.section-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.section-top h2 { margin: 0; }

.hint {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--planet-muted);
}

.hint-modal {
  margin: 8px 0 0;
  font-size: 12px;
  color: #ef4444;
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
  transition: all 0.2s;
}

.btn-add:hover {
  background: #ede9fe;
  transform: translateY(-1px);
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
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--planet-primary);
  color: var(--planet-primary);
  background: #f5f3ff;
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
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fee2e2;
  transform: scale(1.02);
}

.btn-submit {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.2s ease;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid var(--planet-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.modal-body label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.modal-body input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--planet-border);
  border-radius: 10px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid var(--planet-border);
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-create {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-row, .attr-row { grid-template-columns: 1fr; }
  .btn-remove { width: 100%; }
  .select-with-button { flex-direction: column; }
  .btn-add-small { width: 100%; }
  .modal-content { width: 95%; margin: 16px; }
}
</style>