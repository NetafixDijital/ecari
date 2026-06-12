import { api } from './client'

export interface LookupItem {
  id: number
  code: string
  name: string
}

export interface City {
  id: number
  plateCode?: string | null
  name: string
}

export interface District {
  id: number
  cityId: number
  name: string
}

export interface TaxRate {
  id: number
  code: string
  name: string
  rate: number
}

export async function fetchUnits() {
  const { data } = await api.get<LookupItem[]>('/api/core/units')
  return data
}

export async function fetchTaxRates() {
  const { data } = await api.get<TaxRate[]>('/api/core/tax-rates')
  return data
}

export async function fetchCities() {
  const { data } = await api.get<City[]>('/api/core/cities')
  return data
}

export async function fetchDistricts(cityId: number) {
  const { data } = await api.get<District[]>(`/api/core/cities/${cityId}/districts`)
  return data
}

export interface PaymentTerm {
  id: number
  code: string
  name: string
  dueDays: number
}

export async function fetchPaymentTerms() {
  const { data } = await api.get<PaymentTerm[]>('/api/core/payment-terms')
  return data
}
