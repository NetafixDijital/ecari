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

export async function createOrder(body: CreateOrdOrderRequest) {
  const { data } = await api.post('/api/ord/orders', body)
  return data
}
