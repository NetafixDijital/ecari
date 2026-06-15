import { api } from './client'

export type QotQuotationListItem = {
  id: number
  documentNo: string
  documentType: string
  accountTitle: string
  documentDate: string
  validUntil: string | null
  grandTotal: number
  statusKey: string
  statusLabel: string
}

export type QotQuotationDetail = {
  id: number
  documentNo: string
  documentType: string
  accountId: number
  accountTitle: string
  documentDate: string
  validUntil: string | null
  subtotal: number
  taxTotal: number
  grandTotal: number
  statusKey: string
  statusLabel: string
  convertedOrderId: number | null
  notes: string | null
  lines: Array<{
    lineNo: number
    description: string
    unitName: string
    quantity: number
    unitPrice: number
    taxAmount: number
    lineTotal: number
  }>
}

export type CreateQotQuotationRequest = {
  documentType: 'SALES' | 'PURCHASE'
  accountId: number
  documentDate: string
  validUntil?: string | null
  warehouseId?: number | null
  notes?: string | null
  lines: Array<{
    itemId?: number | null
    description: string
    quantity: number
    unitId: number
    unitPrice: number
    taxRateId: number
  }>
}

export async function fetchQuotations(type?: 'SALES' | 'PURCHASE', search?: string) {
  const { data } = await api.get<QotQuotationListItem[]>('/api/qot/quotations', {
    params: { type: type || undefined, search: search || undefined },
  })
  return data
}

export async function fetchQuotation(id: number) {
  const { data } = await api.get<QotQuotationDetail>(`/api/qot/quotations/${id}`)
  return data
}

export async function createQuotation(body: CreateQotQuotationRequest) {
  const { data } = await api.post<QotQuotationDetail>('/api/qot/quotations', body)
  return data
}

export async function convertQuotationToOrder(id: number) {
  const { data } = await api.post<{ quotationId: number; orderId: number; orderDocumentNo: string }>(
    `/api/qot/quotations/${id}/convert-to-order`,
  )
  return data
}

export async function deleteQuotation(id: number) {
  await api.delete(`/api/qot/quotations/${id}`)
}
