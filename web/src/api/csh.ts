import { api } from './client'

export type CshAccountListItem = {
  id: number
  code: string
  name: string
  cashType: string
  balance: number
  isActive: boolean
}

export type CshPaymentRequest = {
  accountId: number
  cashAccountId: number
  amount: number
  transactionDate: string
  description?: string | null
}

export async function fetchCshAccounts(search?: string) {
  const { data } = await api.get<CshAccountListItem[]>('/api/csh/accounts', {
    params: { search: search || undefined },
  })
  return data
}

export async function recordCollection(body: CshPaymentRequest) {
  const { data } = await api.post<{ message: string }>('/api/csh/collections', body)
  return data
}

export async function recordPayment(body: CshPaymentRequest) {
  const { data } = await api.post<{ message: string }>('/api/csh/payments', body)
  return data
}

export type CshTransactionListItem = {
  id: number
  cashAccountId: number
  cashAccountName: string
  accountTitle: string | null
  transactionDate: string
  transactionType: string
  transactionTypeLabel: string
  amount: number
  description: string | null
  referenceNo: string | null
}

export async function fetchCshMovements(cashAccountId?: number, search?: string) {
  const { data } = await api.get<CshTransactionListItem[]>('/api/csh/movements', {
    params: {
      cashAccountId: cashAccountId || undefined,
      search: search || undefined,
    },
  })
  return data
}
