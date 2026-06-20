import { api } from './client'

export type CompanyProfile = {
  id: number
  legalName: string
  tradeName: string | null
  taxNumber: string
  taxOffice: string
  address: string | null
  cityId: number | null
  districtId: number | null
  phone: string | null
  email: string | null
  website: string | null
  defaultCurrencyId: number
  fiscalYearStartMonth: number
  isEinvoiceUser: boolean
  isEarchiveUser: boolean
  isEwaybillUser: boolean
  einvoiceAlias: string | null
  ewaybillAlias: string | null
}

export type UpdateCompanyProfileRequest = Omit<CompanyProfile, 'id'>

export type Warehouse = {
  id: number
  branchId: number
  code: string
  name: string
  address: string | null
  isDefault: boolean
  isActive: boolean
}

export type CreateWarehouseRequest = {
  code: string
  name: string
  address?: string | null
  isDefault: boolean
  isActive: boolean
}

export type UpdateWarehouseRequest = CreateWarehouseRequest

export async function fetchCompanyProfile() {
  const { data } = await api.get<CompanyProfile>('/api/cfg/company-profile')
  return data
}

export async function updateCompanyProfile(body: UpdateCompanyProfileRequest) {
  const { data } = await api.put<CompanyProfile>('/api/cfg/company-profile', body)
  return data
}

export async function fetchWarehouses() {
  const { data } = await api.get<Warehouse[]>('/api/cfg/warehouses')
  return data
}

export async function fetchActiveWarehouses() {
  const { data } = await api.get<Warehouse[]>('/api/cfg/warehouses', {
    params: { activeOnly: true },
  })
  return data
}

export async function createWarehouse(body: CreateWarehouseRequest) {
  const { data } = await api.post<Warehouse>('/api/cfg/warehouses', body)
  return data
}

export async function updateWarehouse(id: number, body: UpdateWarehouseRequest) {
  const { data } = await api.put<Warehouse>(`/api/cfg/warehouses/${id}`, body)
  return data
}

export async function deleteWarehouse(id: number) {
  await api.delete(`/api/cfg/warehouses/${id}`)
}

export type ModuleSetting = {
  moduleCode: string
  settingKey: string
  settingValue: string
  dataType: string
}

export type UpdateModuleSettingsRequest = {
  settings: ModuleSetting[]
}

export async function fetchModuleSettings() {
  const { data } = await api.get<ModuleSetting[]>('/api/cfg/module-settings')
  return data
}

export async function updateModuleSettings(body: UpdateModuleSettingsRequest) {
  const { data } = await api.put<ModuleSetting[]>('/api/cfg/module-settings', body)
  return data
}
