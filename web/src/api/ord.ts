import { api } from './client'

export type OrdOrderListItem = {
  id: number
  documentNo: string
  orderType: string
  accountTitle: string
  documentDate: string
  deliveryDate: string | null
  grandTotal: number
  statusKey: string
  statusLabel: string
}

export type OrdOrderDetail = {
  id: number
  documentNo: string
  orderType: string
  accountId: number
  accountTitle: string
  documentDate: string
  deliveryDate: string | null
  subtotal: number
  taxTotal: number
  grandTotal: number
  statusKey: string
  statusLabel: string
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

export type CreateOrdOrderRequest = {
  orderType: 'SALES' | 'PURCHASE'
  accountId: number
  documentDate: string
  deliveryDate?: string | null
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

export async function fetchOrders(type?: 'SALES' | 'PURCHASE', search?: string) {
  const { data } = await api.get<OrdOrderListItem[]>('/api/ord/orders', {
    params: { type: type || undefined, search: search || undefined },
  })
  return data
}

export async function fetchOrder(id: number) {
  const { data } = await api.get<OrdOrderDetail>(`/api/ord/orders/${id}`)
  return data
}

export async function createOrder(body: CreateOrdOrderRequest) {
  const { data } = await api.post('/api/ord/orders', body)
  return data
}

export type ConvertOrdToDlnResult = {
  orderId: number
  deliveryNoteId: number
  deliveryNoteDocumentNo: string
}

export type ConvertOrdToInvResult = {
  orderId: number
  invoiceId: number
  invoiceDocumentNo: string
}

export async function convertOrderToDeliveryNote(id: number) {
  const { data } = await api.post<ConvertOrdToDlnResult>(`/api/ord/orders/${id}/convert-to-delivery-note`)
  return data
}

export async function convertOrderToInvoice(id: number) {
  const { data } = await api.post<ConvertOrdToInvResult>(`/api/ord/orders/${id}/convert-to-invoice`)
  return data
}

export async function deleteOrder(id: number) {
  await api.delete(`/api/ord/orders/${id}`)
}
