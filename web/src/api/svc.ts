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

export type CreateSvcTicketRequest = {
  accountId: number
  deviceName?: string | null
  problemDescription: string
  technicianName?: string | null
  priority: string
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

export async function createSvcTicket(body: CreateSvcTicketRequest) {
  const { data } = await api.post<SvcTicketListItem>('/api/svc/tickets', body)
  return data
}
