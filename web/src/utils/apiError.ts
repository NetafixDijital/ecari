export function apiErrorMessage(err: unknown, fallback = 'İşlem sırasında hata oluştu.') {
  const axiosErr = err as {
    message?: string
    response?: { status?: number; data?: { message?: string } }
  }
  if (axiosErr?.message === 'Network Error') {
    return 'API sunucusuna ulaşılamadı. Sunucu kapalı olabilir veya bağlantı engellenmiş olabilir.'
  }
  if (axiosErr?.response?.status === 500) {
    return axiosErr.response.data?.message || 'Sunucu hatası (500). API SQL bağlantısını kontrol edin.'
  }
  const message = axiosErr?.response?.data?.message
  return message || fallback
}
