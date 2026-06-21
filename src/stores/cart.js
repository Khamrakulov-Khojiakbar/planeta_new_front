import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'planeta_cart'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useCartStore = defineStore('cart', () => {
  const items = ref(loadFromStorage())

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const isEmpty = computed(() => items.value.length === 0)

  function persist() {
    saveToStorage(items.value)
  }

  function addItem(product, quantity = 1) {
    const existing = items.value.find((i) => i.productId === product.id)

    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.mainImageUrl || product.imageUrls?.[0] || null,
        quantity
      })
    }

    persist()
  }

  function removeItem(productId) {
    items.value = items.value.filter((i) => i.productId !== productId)
    persist()
  }

  function updateQuantity(productId, quantity) {
    const item = items.value.find((i) => i.productId === productId)
    if (!item) return

    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    item.quantity = quantity
    persist()
  }

  function clearCart() {
    items.value = []
    persist()
  }

  function getOrderItems() {
    return items.value.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  }

  function isInCart(productId) {
    return items.value.some((i) => i.productId === productId)
  }

  return {
    items,
    totalItems,
    totalPrice,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getOrderItems,
    isInCart
  }
})
