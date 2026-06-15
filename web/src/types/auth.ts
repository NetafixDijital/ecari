export interface UserSummary {
  id: number
  fullName: string
  email: string
}

export interface Company {
  id: number
  code: string
  name: string
  databaseName: string
  isDefault: boolean
}

export interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: UserSummary
}

export interface SelectCompanyResponse {
  accessToken: string
  expiresIn: number
  companyId: number
  companyCode: string
  databaseName: string
  orgUserId: number
}

export interface AuthSession {
  accessToken: string
  user: UserSummary
  company: Company
  permissions: string[]
}
