import { api } from './client'
import type { AuditInfo } from '../components/ui/AuditInfoPanel'

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

export type OrdOrderLine = {
  id: number
  lineNo: number
  description: string
  unitName: string
  quantity: number
  deliveredQuantity: number
  invoicedQuantity: number
  remainingDeliveryQuantity: number
  remainingInvoiceQuantity: number
  unitPrice: number
  taxAmount: number
  lineTotal: number
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
  lines: OrdOrderLine[]
  audit?: AuditInfo | null
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

export type ConvertOrdLineQuantity = {
  lineId: number
  quantity: number
}

export type ConvertOrdRequest = {
  lines?: ConvertOrdLineQuantity[]
}

export type OrdDeliveryReportItem = {
  id: number
  documentNo: string
  orderType: string
  documentDate: string
  deliveryDate: string | null
  grandTotal: number
  statusKey: string
  statusLabel: string
  totalQuantity: number
  deliveredQuantity: number
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

export async function fetchOrderDeliveryReport(accountId: number) {
  const { data } = await api.get<OrdDeliveryReportItem[]>('/api/ord/delivery-report', {
    params: { accountId },
  })
  return data
}

export async function createOrder(body: CreateOrdOrderRequest) {
  const { data } = await api.post('/api/ord/orders', body)
  return data
}

export async function approveOrder(id: number) {
  const { data } = await api.post<OrdOrderDetail>(`/api/ord/orders/${id}/approve`)
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

export async function convertOrderToDeliveryNote(id: number, body?: ConvertOrdRequest) {
  const { data } = await api.post<ConvertOrdToDlnResult>(
    `/api/ord/orders/${id}/convert-to-delivery-note`,
    body ?? {},
  )
  return data
}

export async function convertOrderToInvoice(id: number, body?: ConvertOrdRequest) {
  const { data } = await api.post<ConvertOrdToInvResult>(
    `/api/ord/orders/${id}/convert-to-invoice`,
    body ?? {},
  )
  return data
}

export async function deleteOrder(id: number) {
  await api.delete(`/api/ord/orders/${id}`)
}
