import { api } from './client'
import type { Company, LoginResponse, SelectCompanyResponse } from '../types/auth'

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('/api/auth/login', { email, password })
  return data
}

export async function getCompanies(authToken: string) {
  const { data } = await api.get<Company[]>('/api/auth/companies', {
    headers: { Authorization: `Bearer ${authToken}` },
  })
  return data
}

export async function selectCompany(authToken: string, companyId: number) {
  const { data } = await api.post<SelectCompanyResponse>(
    '/api/auth/select-company',
    { companyId },
    { headers: { Authorization: `Bearer ${authToken}` } },
  )
  return data
}
