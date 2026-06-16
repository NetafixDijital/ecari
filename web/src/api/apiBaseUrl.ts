const productionApiBase = 'https://ecariapi.netafix.com'

/** Tarayıcıdan kullanılan API kök adresi */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.PROD) return productionApiBase
  return 'http://localhost:5050'
}

export const defaultProductionApiBase = productionApiBase
