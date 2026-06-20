import { api } from './client'
import type { AuditInfo } from '../components/ui/AuditInfoPanel'

export interface StkItemListItem {
  id: number
  code: string
  barcode?: string | null
  name: string
  itemType: string
  brandName?: string | null
  baseUnitName: string
  purchasePrice?: number | null
  salesPrice?: number | null
  stockQuantity: number
  stockStatus: string
  isActive: boolean
}

export interface CreateStkItemRequest {
  name: string
  barcode?: string
  brandName?: string
  itemType?: string
  purchasePrice?: number
  salesPrice?: number
  baseUnitId?: number
  taxRateId?: number
}

export async function fetchStkItems(search?: string) {
  const { data } = await api.get<StkItemListItem[]>('/api/stk/items', {
    params: search ? { search } : undefined,
  })
  return data
}

export interface StkItemDetail {
  id: number
  code: string
  barcode?: string | null
  name: string
  itemType: string
  brandName?: string | null
  baseUnitId: number
  taxRateId: number
  purchasePrice?: number | null
  salesPrice?: number | null
  stockQuantity: number
  isActive: boolean
  audit?: AuditInfo | null
}

export interface UpdateStkItemRequest {
  name: string
  barcode?: string
  brandName?: string
  purchasePrice?: number
  salesPrice?: number
  taxRateId?: number
  shelfNo?: string
  isWeighable?: boolean
  description?: string
  isActive: boolean
}

export async function fetchStkItem(id: number) {
  const { data } = await api.get<StkItemDetail>(`/api/stk/items/${id}`)
  return data
}

export async function createStkItem(body: CreateStkItemRequest) {
  const { data } = await api.post('/api/stk/items', body)
  return data
}

export async function updateStkItem(id: number, body: UpdateStkItemRequest) {
  const { data } = await api.put(`/api/stk/items/${id}`, body)
  return data
}

export async function deleteStkItem(id: number) {
  await api.delete(`/api/stk/items/${id}`)
}

export type StkStockMovementListItem = {
  id: number
  itemCode: string
  itemName: string
  warehouseName: string
  movementDate: string
  movementType: string
  movementTypeLabel: string
  quantity: number
  unitName: string
  description: string | null
}

export async function fetchStkMovements(params?: {
  warehouseId?: number
  itemId?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  movementType?: string
}) {
  const { data } = await api.get<StkStockMovementListItem[]>('/api/stk/movements', {
    params: {
      warehouseId: params?.warehouseId || undefined,
      itemId: params?.itemId || undefined,
      search: params?.search || undefined,
      dateFrom: params?.dateFrom || undefined,
      dateTo: params?.dateTo || undefined,
      movementType: params?.movementType || undefined,
    },
  })
  return data
}

export type CreateStkManualMovementRequest = {
  itemId: number
  warehouseId: number
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  movementDate?: string
  description?: string
}

export async function createStkManualMovement(body: CreateStkManualMovementRequest) {
  const { data } = await api.post<StkStockMovementListItem>('/api/stk/movements', body)
  return data
}
