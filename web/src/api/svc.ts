import { api } from './client'

export type SvcTicketListItem = {
  id: number
  ticketNo: string
  ticketDate: string
  accountTitle: string
  deviceName: string | null
  problemDescription: string
  technicianName: string | null
  statusKey: string
  statusLabel: string
}

export type SvcTicketLine = {
  lineNo: number
  lineType: string
  serviceDefinitionId: number | null
  itemId: number | null
  description: string
  serviceName: string | null
  itemName: string | null
  unitName: string
  quantity: number
  unitPrice: number
  taxRateId: number
  taxAmount: number
  lineTotal: number
}

export type SvcServiceDefinition = {
  id: number
  code: string
  name: string
  defaultTaxRateId: number | null
  isActive?: boolean
  sortOrder?: number
}

export type SvcTechnician = {
  id: number
  code: string
  name: string
  phone: string | null
  isActive: boolean
  sortOrder: number
}

export type UpsertSvcTechnicianRequest = {
  code: string
  name: string
  phone?: string | null
  isActive?: boolean
  sortOrder?: number
}

export type UpsertSvcServiceDefinitionRequest = {
  code: string
  name: string
  defaultTaxRateId?: number | null
  isActive?: boolean
  sortOrder?: number
}

export type SvcTicketDetail = {
  id: number
  ticketNo: string
  ticketDate: string
  accountId: number
  accountTitle: string
  deviceName: string | null
  problemDescription: string
  technicianName: string | null
  technicianId: number | null
  priorityKey: string
  priorityLabel: string
  statusKey: string
  statusLabel: string
  resolution: string | null
  closedAt: string | null
  invoiceId: number | null
  subtotal: number
  taxTotal: number
  grandTotal: number
  lines: SvcTicketLine[]
}

export type CreateSvcTicketRequest = {
  accountId: number
  deviceName?: string | null
  problemDescription: string
  technicianName?: string | null
  technicianId?: number | null
  priority: string
}

export type UpdateSvcTicketRequest = {
  deviceName?: string | null
  problemDescription: string
  technicianName?: string | null
  technicianId?: number | null
  priority: string
  resolution?: string | null
}

export type SaveSvcTicketLineRequest = {
  serviceDefinitionId?: number | null
  itemId?: number | null
  description: string
  quantity: number
  unitId: number
  unitPrice: number
  taxRateId: number
}

export async function fetchSvcServices(includeInactive = false) {
  const { data } = await api.get<SvcServiceDefinition[]>('/api/svc/services', {
    params: { includeInactive },
  })
  return data
}

export async function createSvcService(body: UpsertSvcServiceDefinitionRequest) {
  const { data } = await api.post<SvcServiceDefinition>('/api/svc/services', body)
  return data
}

export async function updateSvcService(id: number, body: UpsertSvcServiceDefinitionRequest) {
  const { data } = await api.put<SvcServiceDefinition>(`/api/svc/services/${id}`, body)
  return data
}

export async function deleteSvcService(id: number) {
  await api.delete(`/api/svc/services/${id}`)
}

export async function fetchSvcTechnicians(includeInactive = false) {
  const { data } = await api.get<SvcTechnician[]>('/api/svc/technicians', {
    params: { includeInactive },
  })
  return data
}

export async function createSvcTechnician(body: UpsertSvcTechnicianRequest) {
  const { data } = await api.post<SvcTechnician>('/api/svc/technicians', body)
  return data
}

export async function updateSvcTechnician(id: number, body: UpsertSvcTechnicianRequest) {
  const { data } = await api.put<SvcTechnician>(`/api/svc/technicians/${id}`, body)
  return data
}

export async function deleteSvcTechnician(id: number) {
  await api.delete(`/api/svc/technicians/${id}`)
}

export async function fetchSvcTickets(status?: string, search?: string) {
  const { data } = await api.get<SvcTicketListItem[]>('/api/svc/tickets', {
    params: {
      status: status || undefined,
      search: search || undefined,
    },
  })
  return data
}

export async function fetchSvcTicket(id: number) {
  const { data } = await api.get<SvcTicketDetail>(`/api/svc/tickets/${id}`)
  return data
}

export async function createSvcTicket(body: CreateSvcTicketRequest) {
  const { data } = await api.post<SvcTicketDetail>('/api/svc/tickets', body)
  return data
}

export async function updateSvcTicket(id: number, body: UpdateSvcTicketRequest) {
  const { data } = await api.put<SvcTicketDetail>(`/api/svc/tickets/${id}`, body)
  return data
}

export async function saveSvcTicketLines(id: number, lines: SaveSvcTicketLineRequest[]) {
  const { data } = await api.put<SvcTicketDetail>(`/api/svc/tickets/${id}/lines`, { lines })
  return data
}

export async function updateSvcTicketStatus(id: number, status: string) {
  const { data } = await api.patch<SvcTicketDetail>(`/api/svc/tickets/${id}/status`, { status })
  return data
}

export async function deleteSvcTicket(id: number) {
  await api.delete(`/api/svc/tickets/${id}`)
}

export async function convertSvcToInvoice(id: number, paymentMethod: 'NAKIT' | 'VERESIYE') {
  const { data } = await api.post<{ ticketId: number; invoiceId: number; invoiceDocumentNo: string }>(
    `/api/svc/tickets/${id}/convert-to-invoice`,
    { paymentMethod },
  )
  return data
}
