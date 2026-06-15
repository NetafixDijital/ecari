import { api } from './client'

export type InvInvoiceListItem = {
  id: number
  documentNo: string
  invoiceType: string
  accountTitle: string
  documentDate: string
  dueDate: string | null
  grandTotal: number
  paymentStatusKey: string
  paymentStatusLabel: string
}

export type CreateInvInvoiceLineRequest = {
  itemId?: number | null
  description: string
  quantity: number
  unitId: number
  unitPrice: number
  taxRateId: number
}

export type CreateInvInvoiceRequest = {
  invoiceType: 'SALES' | 'PURCHASE'
  accountId: number
  documentDate: string
  dueDate?: string | null
  notes?: string | null
  lines: CreateInvInvoiceLineRequest[]
}

export type InvInvoiceLine = {
  lineNo: number
  description: string
  unitName: string
  quantity: number
  unitPrice: number
  taxAmount: number
  lineTotal: number
}

export type InvInvoiceDetail = {
  id: number
  documentNo: string
  invoiceType: string
  accountId: number
  accountTitle: string
  accountTaxNumber: string | null
  documentDate: string
  dueDate: string | null
  subtotal: number
  taxTotal: number
  grandTotal: number
  paymentStatusKey: string
  paymentStatusLabel: string
  notes: string | null
  sellerLegalName: string
  sellerAddress: string | null
  lines: InvInvoiceLine[]
}

export async function fetchInvoices(type: 'SALES' | 'PURCHASE', search?: string) {
  const { data } = await api.get<InvInvoiceListItem[]>('/api/inv/invoices', {
    params: { type, search: search || undefined },
  })
  return data
}

export async function fetchInvoice(id: number) {
  const { data } = await api.get<InvInvoiceDetail>(`/api/inv/invoices/${id}`)
  return data
}

export async function createInvoice(body: CreateInvInvoiceRequest) {
  const { data } = await api.post<InvInvoiceDetail>('/api/inv/invoices', body)
  return data
}

export type InvKdvReportRow = {
  id: number
  documentNo: string
  invoiceType: string
  accountTitle: string
  documentDate: string
  subtotal: number
  taxTotal: number
}

export type InvKdvReport = {
  salesTaxTotal: number
  purchaseTaxTotal: number
  deductibleTaxTotal: number
  netPayableTax: number
  rows: InvKdvReportRow[]
}

export async function fetchKdvReport() {
  const { data } = await api.get<InvKdvReport>('/api/inv/kdv-report')
  return data
}

export async function deleteInvoice(id: number) {
  await api.delete(`/api/inv/invoices/${id}`)
}
