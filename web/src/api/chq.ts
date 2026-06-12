import { api } from './client'

export type ChqInstrumentListItem = {
  id: number
  instrumentType: string
  direction: string
  instrumentNo: string
  accountTitle: string
  bankName: string | null
  issueDate: string
  dueDate: string
  amount: number
  statusKey: string
  statusLabel: string
}

export type ChqInstrumentStats = {
  totalCount: number
  totalAmount: number
  pendingCount: number
  pendingAmount: number
  completedCount: number
  completedAmount: number
}

export type CreateChqInstrumentRequest = {
  instrumentType: 'CEK' | 'SENET'
  direction: 'RECEIVED' | 'ISSUED'
  accountId: number
  bankName?: string | null
  instrumentNo: string
  issueDate: string
  dueDate: string
  amount: number
  notes?: string | null
}

export async function fetchChqInstruments(direction: 'RECEIVED' | 'ISSUED', search?: string) {
  const { data } = await api.get<ChqInstrumentListItem[]>('/api/chq/instruments', {
    params: { direction, search: search || undefined },
  })
  return data
}

export async function fetchChqStats(direction?: 'RECEIVED' | 'ISSUED') {
  const { data } = await api.get<ChqInstrumentStats>('/api/chq/stats', {
    params: direction ? { direction } : undefined,
  })
  return data
}

export async function createChqInstrument(body: CreateChqInstrumentRequest) {
  const { data } = await api.post<ChqInstrumentListItem>('/api/chq/instruments', body)
  return data
}
