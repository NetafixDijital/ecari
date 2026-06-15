import { api } from './client'

export type TskTaskListItem = {
  id: number
  taskNo: string
  title: string
  startDate: string
  endDate: string
  assigneeName: string | null
  priorityKey: string
  priorityLabel: string
  statusKey: string
  statusLabel: string
  progressPercent: number
}

export type TskTaskStats = {
  pending: number
  inProgress: number
  overdue: number
  completed: number
}

export type CreateTaskRequest = {
  title: string
  description?: string | null
  startDate: string
  endDate: string
  assigneeName?: string | null
  priority: string
}

export async function fetchTasks(status?: string, search?: string) {
  const { data } = await api.get<TskTaskListItem[]>('/api/tsk/tasks', {
    params: {
      status: status || undefined,
      search: search || undefined,
    },
  })
  return data
}

export async function fetchTaskStats() {
  const { data } = await api.get<TskTaskStats>('/api/tsk/stats')
  return data
}

export async function createTask(body: CreateTaskRequest) {
  const { data } = await api.post<TskTaskListItem>('/api/tsk/tasks', body)
  return data
}

export type UpdateTaskRequest = {
  title: string
  description?: string | null
  startDate: string
  endDate: string
  assigneeName?: string | null
  priority: string
  progressPercent?: number | null
}

export async function updateTask(id: number, body: UpdateTaskRequest) {
  const { data } = await api.put<TskTaskListItem>(`/api/tsk/tasks/${id}`, body)
  return data
}

export async function updateTaskStatus(id: number, status: string, progressPercent?: number | null) {
  const { data } = await api.patch<TskTaskListItem>(`/api/tsk/tasks/${id}/status`, {
    status,
    progressPercent,
  })
  return data
}

export async function deleteTask(id: number) {
  await api.delete(`/api/tsk/tasks/${id}`)
}
