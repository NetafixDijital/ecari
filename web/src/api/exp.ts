import { api } from './client'

export type ExpServiceDefinition = {
  id: number
  code: string
  name: string
  categoryGroup: string
  defaultTaxRateId: number | null
}

export type ExpExpenseListItem = {
  id: number
  documentNo: string
  expenseDate: string
  accountTitle: string
  summary: string
  grandTotal: number
  paymentMethodKey: string
  paymentMethodLabel: string
  statusKey: string
  statusLabel: string
  purchaseInvoiceId: number | null
}

export type ExpExpenseDetail = {
  id: number
  documentNo: string
  expenseDate: string
  accountId: number
  accountTitle: string
  subtotal: number
  taxTotal: number
  grandTotal: number
  paymentMethodKey: string
  paymentMethodLabel: string
  statusKey: string
  statusLabel: string
  purchaseInvoiceId: number | null
  notes: string | null
  lines: Array<{
    lineNo: number
    lineType: string
    description: string
    serviceName: string | null
    unitName: string
    quantity: number
    unitPrice: number
    taxAmount: number
    lineTotal: number
  }>
}

export type ExpenseStats = {
  totalCount: number
  totalAmount: number
  pendingCount: number
  approvedCount: number
  paidCount: number
}

export type CreateExpenseRequest = {
  accountId: number
  expenseDate: string
  paymentMethod: string
  notes?: string | null
  lines: Array<{
    serviceDefinitionId?: number | null
    itemId?: number | null
    description: string
    quantity: number
    unitId: number
    unitPrice: number
    taxRateId: number
  }>
  requiresApproval?: boolean
}

export async function fetchExpenseServices() {
  const { data } = await api.get<ExpServiceDefinition[]>('/api/exp/services')
  return data
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

export async function fetchExpense(id: number) {
  const { data } = await api.get<ExpExpenseDetail>(`/api/exp/expenses/${id}`)
  return data
}

export async function fetchExpenseStats() {
  const { data } = await api.get<ExpenseStats>('/api/exp/stats')
  return data
}

export async function createExpense(body: CreateExpenseRequest) {
  const { data } = await api.post<ExpExpenseDetail>('/api/exp/expenses', body)
  return data
}

export async function updateExpenseStatus(id: number, action: 'approve' | 'reject', notes?: string | null) {
  const { data } = await api.patch<ExpExpenseDetail>(`/api/exp/expenses/${id}/status`, { action, notes })
  return data
}

export async function payExpense(id: number, body?: { paymentMethod?: string | null; transactionDate?: string | null }) {
  const { data } = await api.post<ExpExpenseDetail>(`/api/exp/expenses/${id}/pay`, body ?? {})
  return data
}
