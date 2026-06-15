export function apiErrorMessage(err: unknown, fallback = 'İşlem sırasında hata oluştu.') {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
  return message || fallback
}
