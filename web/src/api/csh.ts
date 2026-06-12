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
