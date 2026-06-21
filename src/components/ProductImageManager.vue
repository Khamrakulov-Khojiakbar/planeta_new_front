<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../api/axios'
import { getFullImageUrl } from '../utils/image'

const props = defineProps({
  productId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['updated'])

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const mainImageUrl = ref('')
const imageUrls = ref([])
const productMeta = ref(null)

const mainImageFile = ref(null)
const extraImageFiles = ref([])

const allImages = computed(() => {
  const urls = []
  if (mainImageUrl.value && !urls.includes(mainImageUrl.value)) {
    urls.push(mainImageUrl.value)
  }
  imageUrls.value.forEach((url) => {
    if (!urls.includes(url)) urls.push(url)
  })
  return urls
})

const fetchProduct = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const response = await api.get(`/api/products/${props.productId}`)
    const product = response.data

    mainImageUrl.value = product.mainImageUrl || ''
    imageUrls.value = [...(product.imageUrls || [])]
    productMeta.value = product
  } catch (err) {
    errorMsg.value = 'Не удалось загрузить фотографии товара.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const buildUpdatePayload = (overrides = {}) => {
  const product = productMeta.value
  if (!product) return null

  const main = overrides.mainImageUrl ?? mainImageUrl.value ?? ''
  const urls = overrides.imageUrls ?? imageUrls.value ?? []

  return {
    name: product.name,
    description: product.description || '',
    price: Number(product.price),
    categoryId: product.categoryId || 0,
    brandId: product.brandId || null,
    isUsed: product.isUsed,
    imei: product.imei || null,
    stockQuantity: product.stockQuantity || 1,
    mainImageUrl: main,
    imageUrls: urls,
    attributes: (product.attributes || []).map((a) => ({
      attributeName: a.attributeName,
      value: a.value
    }))
  }
}

const resolveIdsAndSave = async (overrides) => {
  const [categoriesRes, brandsRes] = await Promise.all([
    api.get('/api/getcategories'),
    api.get('/api/brands')
  ])

  const categories = categoriesRes.data
  const brands = brandsRes.data
  const product = productMeta.value

  const category = categories.find((c) => c.name === product.categoryName)
  const brand = brands.find((b) => b.name === product.brandName)

  const payload = buildUpdatePayload(overrides)
  if (!payload) return

  payload.categoryId = category?.id ?? payload.categoryId
  payload.brandId = brand?.id ?? payload.brandId

  await api.put(`/api/products/${props.productId}`, payload)
}

const setAsMain = async (url) => {
  if (url === mainImageUrl.value) return

  saving.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const others = allImages.value.filter((u) => u !== url)
    mainImageUrl.value = url
    imageUrls.value = others

    await resolveIdsAndSave({
      mainImageUrl: url,
      imageUrls: others
    })

    successMsg.value = 'Главное фото обновлено.'
    emit('updated')
    await fetchProduct()
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Не удалось сделать фото главным.'
    await fetchProduct()
  } finally {
    saving.value = false
  }
}

const removeImage = async (url) => {
  if (!confirm('Удалить это фото?')) return

  saving.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const remaining = allImages.value.filter((u) => u !== url)
    const newMain = url === mainImageUrl.value ? remaining[0] || '' : mainImageUrl.value

    mainImageUrl.value = newMain
    imageUrls.value = remaining.filter((u) => u !== newMain)

    await resolveIdsAndSave({
      mainImageUrl: newMain,
      imageUrls: remaining.filter((u) => u !== newMain)
    })

    successMsg.value = 'Фото удалено.'
    emit('updated')
    await fetchProduct()
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Не удалось удалить фото.'
    await fetchProduct()
  } finally {
    saving.value = false
  }
}

const onMainImageSelected = (event) => {
  mainImageFile.value = event.target.files[0] || null
}

const onExtraImagesSelected = (event) => {
  extraImageFiles.value = Array.from(event.target.files)
}

const handleUpload = async () => {
  if (!mainImageFile.value && extraImageFiles.value.length === 0) {
    errorMsg.value = 'Выберите файлы для загрузки.'
    return
  }

  uploading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  const formData = new FormData()
  if (mainImageFile.value) {
    formData.append('MainImage', mainImageFile.value)
  }
  extraImageFiles.value.forEach((file) => {
    formData.append('ExtraImages', file)
  })

  try {
    await api.post(`/api/products/${props.productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    mainImageFile.value = null
    extraImageFiles.value = []
    successMsg.value = 'Фотографии загружены!'
    emit('updated')
    await fetchProduct()
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Ошибка загрузки фото.'
  } finally {
    uploading.value = false
  }
}

onMounted(fetchProduct)

watch(
  () => props.productId,
  () => fetchProduct()
)
</script>

<template>
  <div class="image-manager">
    <div class="manager-header">
      <h3>📷 Управление фотографиями</h3>
      <span v-if="saving || uploading" class="status-pill">Сохранение...</span>
    </div>

    <div v-if="loading" class="loading-box">Загрузка галереи...</div>

    <template v-else>
      <p v-if="errorMsg" class="msg error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="msg success">{{ successMsg }}</p>

      <div v-if="allImages.length === 0" class="empty-gallery">
        <span>🖼️</span>
        <p>Фотографий пока нет. Загрузите первое изображение ниже.</p>
      </div>

      <div v-else class="gallery-grid">
        <div
          v-for="(url, index) in allImages"
          :key="url"
          class="gallery-item"
          :class="{ isMain: url === mainImageUrl }"
        >
          <img :src="getFullImageUrl(url)" :alt="`Фото ${index + 1}`" />
          <span v-if="url === mainImageUrl" class="main-badge">Главное</span>

          <div class="item-actions">
            <button
              v-if="url !== mainImageUrl"
              type="button"
              class="btn-sm btn-main"
              :disabled="saving"
              @click="setAsMain(url)"
            >
              ★ Главное
            </button>
            <button
              type="button"
              class="btn-sm btn-delete"
              :disabled="saving"
              @click="removeImage(url)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="upload-section">
        <h4>Загрузить новые фото</h4>
        <div class="upload-fields">
          <label class="file-field">
            <span>Главное фото</span>
            <input type="file" accept="image/*" @change="onMainImageSelected" />
          </label>
          <label class="file-field">
            <span>Дополнительные фото</span>
            <input type="file" accept="image/*" multiple @change="onExtraImagesSelected" />
          </label>
        </div>
        <button
          type="button"
          class="btn-upload"
          :disabled="uploading"
          @click="handleUpload"
        >
          {{ uploading ? 'Загрузка...' : '⬆️ Загрузить на сервер' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.image-manager {
  background: white;
  border: 1px solid var(--planet-border);
  border-radius: 14px;
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.manager-header h3 {
  margin: 0;
  font-size: 16px;
  color: #78350f;
}

.status-pill {
  font-size: 12px;
  background: #f5f3ff;
  color: var(--planet-primary);
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.loading-box {
  text-align: center;
  padding: 30px;
  color: var(--planet-muted);
}

.msg {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 14px;
}

.msg.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.msg.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.empty-gallery {
  text-align: center;
  padding: 30px;
  background: #fafafa;
  border-radius: 12px;
  margin-bottom: 16px;
  color: var(--planet-muted);
}

.empty-gallery span {
  font-size: 32px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.gallery-item {
  position: relative;
  border: 2px solid var(--planet-border);
  border-radius: 12px;
  overflow: hidden;
  background: #faf5ff;
}

.gallery-item.isMain {
  border-color: var(--planet-primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.gallery-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.main-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: var(--planet-primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}

.item-actions {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.95);
}

.btn-sm {
  flex: 1;
  border: none;
  padding: 5px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.btn-main {
  background: #f5f3ff;
  color: var(--planet-primary);
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
  flex: 0 0 28px;
}

.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-section {
  border-top: 1px solid var(--planet-border);
  padding-top: 16px;
}

.upload-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #374151;
}

.upload-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.file-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--planet-muted);
}

.file-field input {
  font-size: 12px;
}

.btn-upload {
  width: 100%;
  background: #78350f;
  color: white;
  border: none;
  padding: 11px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .upload-fields {
    grid-template-columns: 1fr;
  }
}
</style>
