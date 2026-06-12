import { api } from './client'

export type DlnDeliveryNoteListItem = {
  id: number
  documentNo: string
  documentType: string
  accountTitle: string
  documentDate: string
  shippingAddress: string | null
  statusKey: string
  statusLabel: string
}

export type DlnDeliveryNoteDetail = {
  id: number
  documentNo: string
  documentType: string
  accountId: number
  accountTitle: string
  documentDate: string
  shippingAddress: string | null
  warehouseName: string | null
  statusKey: string
  statusLabel: string
  notes: string | null
  lines: Array<{
    lineNo: number
    description: string
    unitName: string
    quantity: number
  }>
}

export type CreateDlnDeliveryNoteRequest = {
  documentType: 'SALES' | 'PURCHASE'
  accountId: number
  documentDate: string
  warehouseId?: number | null
  shippingAddress?: string | null
  notes?: string | null
  lines: Array<{
    itemId?: number | null
    description: string
    quantity: number
    unitId: number
  }>
}

export async function fetchDeliveryNotes(type: 'SALES' | 'PURCHASE', search?: string) {
  const { data } = await api.get<DlnDeliveryNoteListItem[]>('/api/dln/delivery-notes', {
    params: { type, search: search || undefined },
  })
  return data
}

export async function fetchDeliveryNote(id: number) {
  const { data } = await api.get<DlnDeliveryNoteDetail>(`/api/dln/delivery-notes/${id}`)
  return data
}

export async function createDeliveryNote(body: CreateDlnDeliveryNoteRequest) {
  const { data } = await api.post<DlnDeliveryNoteDetail>('/api/dln/delivery-notes', body)
  return data
}
