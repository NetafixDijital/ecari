import { api } from './client'

export type BnkAccountListItem = {
  id: number
  code: string
  bankName: string
  accountName: string
  iban: string
  balance: number
  isActive: boolean
}

export type BnkTransactionListItem = {
  id: number
  bankAccountId: number
  bankAccountName: string
  transactionDate: string
  transactionType: string
  transactionTypeLabel: string
  cariTitle: string | null
  amount: number
  referenceNo: string | null
  description: string | null
}

export type BnkPaymentRequest = {
  bankAccountId: number
  accountId: number
  amount: number
  transactionDate: string
  description?: string | null
}

export async function fetchBnkAccounts(search?: string) {
  const { data } = await api.get<BnkAccountListItem[]>('/api/bnk/accounts', {
    params: search ? { search } : undefined,
  })
  return data
}

export async function fetchBnkTransactions(bankAccountId?: number) {
  const { data } = await api.get<BnkTransactionListItem[]>('/api/bnk/transactions', {
    params: bankAccountId ? { bankAccountId } : undefined,
  })
  return data
}

export async function recordBnkCollection(body: BnkPaymentRequest) {
  await api.post('/api/bnk/collections', body)
}

export async function recordBnkPayment(body: BnkPaymentRequest) {
  await api.post('/api/bnk/payments', body)
}
