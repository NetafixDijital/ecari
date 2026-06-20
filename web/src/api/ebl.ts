import { api } from './client'

export type EblIntegrator = {
  id: number
  code: string
  name: string
  apiBaseUrl: string
  apiEwaybillUrl: string | null
  isActive: boolean
}

export type EblCredential = {
  id: number
  integratorId: number
  integratorCode: string
  username: string
  environment: string
  branchId: number | null
  invoiceSerialPrefix: string | null
  isActive: boolean
  hasPassword: boolean
}

export type SaveEblCredentialRequest = {
  integratorId: number
  username: string
  password?: string | null
  environment: string
  branchId?: number | null
  invoiceSerialPrefix?: string | null
  isActive: boolean
}

export type EblGibCheckResult = {
  isEinvoiceUser: boolean
  alias: string | null
  title: string | null
  message: string
  checkedAt: string
}

export type EblEinvoiceRecord = {
  id: number
  invoiceId: number
  uuid: string
  status: string
  statusMessage: string | null
  profileId: string | null
  sentAt: string | null
  responseAt: string | null
}

export type EblEwaybillRecord = {
  id: number
  deliveryNoteId: number
  uuid: string
  status: string
  statusMessage: string | null
  sentAt: string | null
  responseAt: string | null
}

export type EblSendResult = {
  success: boolean
  uuid: string
  status: string
  message: string
}

export async function fetchEblIntegrators() {
  const { data } = await api.get<EblIntegrator[]>('/api/ebl/integrators')
  return data
}

export async function fetchEblCredentials() {
  const { data } = await api.get<EblCredential[]>('/api/ebl/credentials')
  return data
}

export async function saveEblCredential(body: SaveEblCredentialRequest) {
  const { data } = await api.post<EblCredential>('/api/ebl/credentials', body)
  return data
}

export async function checkCariGibUser(accountId: number) {
  const { data } = await api.post<EblGibCheckResult>(`/api/ebl/cari/${accountId}/check-gib`)
  return data
}

export async function fetchInvoiceEblRecord(invoiceId: number) {
  const { data } = await api.get<EblEinvoiceRecord>(`/api/ebl/invoices/${invoiceId}/record`)
  return data
}

export async function sendInvoiceToEdm(invoiceId: number) {
  const { data } = await api.post<EblSendResult>(`/api/ebl/invoices/${invoiceId}/send`)
  return data
}

export async function refreshInvoiceEblStatus(invoiceId: number) {
  const { data } = await api.post<EblEinvoiceRecord>(`/api/ebl/invoices/${invoiceId}/refresh-status`)
  return data
}

export async function fetchDeliveryNoteEblRecord(deliveryNoteId: number) {
  const { data } = await api.get<EblEwaybillRecord>(`/api/ebl/delivery-notes/${deliveryNoteId}/record`)
  return data
}

export async function sendDeliveryNoteToEdm(deliveryNoteId: number) {
  const { data } = await api.post<EblSendResult>(`/api/ebl/delivery-notes/${deliveryNoteId}/send`)
  return data
}

export async function refreshDeliveryNoteEblStatus(deliveryNoteId: number) {
  const { data } = await api.post<EblEwaybillRecord>(`/api/ebl/delivery-notes/${deliveryNoteId}/refresh-status`)
  return data
}
