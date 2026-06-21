import api from '../api/axios'

export function getFullImageUrl(url, placeholder = 'PLANETA') {
  if (!url) {
    return `https://placehold.co/400x300/f5f3ff/7c3aed?text=${encodeURIComponent(placeholder)}`
  }
  if (url.startsWith('http://') || url.startsWith('https://')) return url

  const base = (api.defaults.baseURL || 'https://localhost:7036').replace(/\/$/, '')
  return `${base}${url.startsWith('/') ? url : '/' + url}`
}
