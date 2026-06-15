import { api } from './client'

export type AuthUserListItem = {
  id: number
  fullName: string
  email: string
  phone: string | null
  permissionSummary: string
  isActive: boolean
  createdAt: string
}

export type AuthUserDetail = {
  id: number
  systemUserId: number
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  isBranchRestrictionEnabled: boolean
  maxBranchAccess: number
  permissionIds: number[]
  deniedBranchIds: number[]
  createdAt: string
}

export type AuthPermission = {
  id: number
  code: string
  name: string
  moduleCode: string
  actionCode: string
}

export type AuthPermissionGroup = {
  id: number
  code: string
  name: string
  permissions: AuthPermission[]
}

export type AuthBranch = {
  id: number
  code: string
  name: string
  isHeadquarters: boolean
}

export type CreateAuthUserRequest = {
  fullName: string
  email: string
  phone?: string | null
  password: string
  isActive: boolean
  isBranchRestrictionEnabled: boolean
  maxBranchAccess: number
  permissionIds: number[]
  deniedBranchIds: number[]
}

export type UpdateAuthUserRequest = Omit<CreateAuthUserRequest, 'password'> & {
  password?: string | null
}

export async function fetchAuthUsers(search?: string) {
  const { data } = await api.get<AuthUserListItem[]>('/api/auth/users', {
    params: search ? { search } : undefined,
  })
  return data
}

export async function fetchAuthUser(id: number) {
  const { data } = await api.get<AuthUserDetail>(`/api/auth/users/${id}`)
  return data
}

export async function createAuthUser(body: CreateAuthUserRequest) {
  const { data } = await api.post<AuthUserDetail>('/api/auth/users', body)
  return data
}

export async function updateAuthUser(id: number, body: UpdateAuthUserRequest) {
  const { data } = await api.put<AuthUserDetail>(`/api/auth/users/${id}`, body)
  return data
}

export async function deleteAuthUser(id: number) {
  await api.delete(`/api/auth/users/${id}`)
}

export async function fetchPermissionTree() {
  const { data } = await api.get<AuthPermissionGroup[]>('/api/auth/permissions/tree')
  return data
}

export async function fetchAuthBranches() {
  const { data } = await api.get<AuthBranch[]>('/api/auth/branches')
  return data
}

export async function fetchMe() {
  const { data } = await api.get<{
    orgUserId: number
    systemUserId: number
    fullName: string
    email: string
    phone: string | null
    permissions: string[]
  }>('/api/auth/me')
  return data
}
