import { api } from './client'

export interface CariAccountListItem {
  id: number
  code: string
  title: string
  accountType: string
  personType: string
  taxNumber?: string | null
  identityNumber?: string | null
  phone?: string
  email?: string
  balance: number
  balanceSide: string
  isActive: boolean
}

export interface CreateCariAccountRequest {
  personType: string
  title: string
  taxNumber?: string
  identityNumber?: string
  taxOffice?: string
  email?: string
  phone?: string
  addressLine?: string
  cityId?: number
  districtId?: number
  countryCode?: string
  postalCode?: string
  paymentTermId?: number
  dueDays?: number
  accountType?: string
}

export async function fetchCariAccounts(search?: string) {
  const { data } = await api.get<CariAccountListItem[]>('/api/cari/accounts', {
    params: search ? { search } : undefined,
  })
  return data
}

export interface CariAccountDetail {
  id: number
  code: string
  accountType: string
  title: string
  personType: string
  addressLine?: string | null
  cityId?: number | null
  districtId?: number | null
  countryCode: string
  postalCode?: string | null
  paymentTermId?: number | null
  dueDays?: number | null
  taxNumber?: string | null
  identityNumber?: string | null
  taxOffice?: string | null
  phone?: string | null
  email?: string | null
  balance: number
  isActive: boolean
  isEinvoiceUser?: boolean
  einvoiceAlias?: string | null
  ewaybillAlias?: string | null
  gibEinvoiceCheckedAt?: string | null
}

export interface UpdateCariAccountRequest {
  title: string
  taxNumber?: string
  identityNumber?: string
  taxOffice?: string
  email?: string
  phone?: string
  addressLine?: string
  cityId?: number
  districtId?: number
  countryCode?: string
  postalCode?: string
  paymentTermId?: number
  dueDays?: number
  isActive: boolean
}

export type CariCollectionRequest = {
  accountId: number
  paymentMethod: 'CASH' | 'BANK' | 'CHECK'
  amount: number
  transactionDate: string
  description?: string | null
  cashAccountId?: number | null
  bankAccountId?: number | null
  checkInstrumentNo?: string | null
  checkBankName?: string | null
  checkDueDate?: string | null
}

export async function recordCariCollection(body: CariCollectionRequest) {
  const { data } = await api.post<{ message: string }>('/api/cari/collections', body)
  return data
}

export async function fetchCariAccount(id: number) {
  const { data } = await api.get<CariAccountDetail>(`/api/cari/accounts/${id}`)
  return data
}

export async function createCariAccount(body: CreateCariAccountRequest) {
  const { data } = await api.post('/api/cari/accounts', body)
  return data
}

export type CariTaxIdCheckResult = {
  exists: boolean
  isValidFormat: boolean
  accountId?: number | null
  accountCode?: string | null
  accountTitle?: string | null
  message: string
}

export async function checkCariTaxId(personType: string, taxId: string, excludeAccountId?: number) {
  const { data } = await api.get<CariTaxIdCheckResult>('/api/cari/tax-id/check', {
    params: {
      personType,
      taxId,
      excludeAccountId: excludeAccountId ?? undefined,
    },
  })
  return data
}

export async function updateCariAccount(id: number, body: UpdateCariAccountRequest) {
  const { data } = await api.put(`/api/cari/accounts/${id}`, body)
  return data
}

export async function deleteCariAccount(id: number) {
  await api.delete(`/api/cari/accounts/${id}`)
}

export type CariMovementListItem = {
  id: number
  accountId: number
  accountCode: string
  accountTitle: string
  movementDate: string
  movementType: string
  movementTypeLabel: string
  documentNo: string | null
  description: string | null
  debit: number
  credit: number
  runningBalance: number
}

export async function fetchCariMovements(accountId?: number, search?: string) {
  const { data } = await api.get<CariMovementListItem[]>('/api/cari/movements', {
    params: {
      accountId: accountId || undefined,
      search: search || undefined,
    },
  })
  return data
}

export interface CariTransferRequest {
  sourceAccountId: number
  targetAccountId: number
  amount: number
  transferDate: string
  description?: string | null
}

export async function recordCariTransfer(body: CariTransferRequest) {
  await api.post('/api/cari/transfers', body)
}
