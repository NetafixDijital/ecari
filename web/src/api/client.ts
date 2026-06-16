import axios from 'axios'
import { getApiBaseUrl } from './apiBaseUrl'

const baseURL = getApiBaseUrl()

export { getApiBaseUrl } from './apiBaseUrl'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecari_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('ecari_access_token')
      localStorage.removeItem('ecari_user')
      localStorage.removeItem('ecari_company')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
