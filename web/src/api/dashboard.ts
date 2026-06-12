import { api } from './client'

export type DashboardRecentTransaction = {
  id: number
  accountTitle: string
  documentDate: string
  description: string
  category: string
  amount: number
  statusKey: string
  statusLabel: string
}

export type DashboardDueItem = {
  id: number
  documentNo: string
  accountTitle: string
  dueDate: string | null
  amount: number
  statusKey: string
  hint: string
}

export type DashboardTaskItem = {
  id: number
  title: string
  statusKey: string
  endDate: string
}

export type DashboardSummary = {
  totalIncome: number
  totalExpense: number
  netProfit: number
  pendingInvoiceCount: number
  salesInvoiceCount: number
  receivableAccountCount: number
  totalReceivable: number
  paidInvoicePercent: number
  overdueInvoicePercent: number
  monthIncome: number
  todayIncome: number
  recentTransactions: DashboardRecentTransaction[]
  dueItems: DashboardDueItem[]
  recentTasks: DashboardTaskItem[]
}

export async function fetchDashboard() {
  const { data } = await api.get<DashboardSummary>('/api/core/dashboard')
  return data
}
