import { api } from './client'

export type ExpExpenseListItem = {
  id: number
  documentNo: string
  expenseDate: string
  category: string
  description: string
  amount: number
  requesterName: string | null
  statusKey: string
  statusLabel: string
}

export type ExpenseStats = {
  totalCount: number
  totalAmount: number
  pendingCount: number
  approvedCount: number
  paidCount: number
}

export type CreateExpenseRequest = {
  expenseDate: string
  category: string
  description: string
  amount: number
  requesterName?: string | null
  paymentMethod?: string | null
  notes?: string | null
}

export async function fetchExpenses(status?: string, search?: string) {
  const { data } = await api.get<ExpExpenseListItem[]>('/api/exp/expenses', {
    params: {
      status: status || undefined,
      search: search || undefined,
    },
  })
  return data
}

export async function fetchExpenseStats() {
  const { data } = await api.get<ExpenseStats>('/api/exp/stats')
  return data
}

export async function createExpense(body: CreateExpenseRequest) {
  const { data } = await api.post<ExpExpenseListItem>('/api/exp/expenses', body)
  return data
}
