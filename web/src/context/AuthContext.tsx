import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/auth'
import type { AuthSession, Company, UserSummary } from '../types/auth'

interface PendingLogin {
  token: string
  user: UserSummary
  companies: Company[]
}

interface AuthContextValue {
  session: AuthSession | null
  pendingLogin: PendingLogin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<'home' | 'select-company'>
  selectCompany: (companyId: number) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE = {
  token: 'ecari_access_token',
  user: 'ecari_user',
  company: 'ecari_company',
  rememberEmail: 'ecari_remember_email',
} as const

function loadSession(): AuthSession | null {
  const token = localStorage.getItem(STORAGE.token)
  const userRaw = localStorage.getItem(STORAGE.user)
  const companyRaw = localStorage.getItem(STORAGE.company)
  if (!token || !userRaw || !companyRaw) return null
  try {
    return {
      accessToken: token,
      user: JSON.parse(userRaw) as UserSummary,
      company: JSON.parse(companyRaw) as Company,
    }
  } catch {
    return null
  }
}

function buildSession(
  selected: Awaited<ReturnType<typeof authApi.selectCompany>>,
  user: UserSummary,
  company: Company,
): AuthSession {
  return {
    accessToken: selected.accessToken,
    user,
    company: {
      ...company,
      id: selected.companyId,
      code: selected.companyCode,
      databaseName: selected.databaseName,
    },
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const finalizeCompany = useCallback(
    async (loginToken: string, user: UserSummary, company: Company) => {
      const selected = await authApi.selectCompany(loginToken, company.id)
      const newSession = buildSession(selected, user, company)
      localStorage.setItem(STORAGE.token, newSession.accessToken)
      localStorage.setItem(STORAGE.user, JSON.stringify(newSession.user))
      localStorage.setItem(STORAGE.company, JSON.stringify(newSession.company))
      setSession(newSession)
      setPendingLogin(null)
    },
    [],
  )

  const login = useCallback(
    async (email: string, password: string, remember: boolean) => {
      setIsLoading(true)
      try {
        const result = await authApi.login(email, password)
        const companies = await authApi.getCompanies(result.accessToken)

        if (remember) {
          localStorage.setItem(STORAGE.rememberEmail, email)
        } else {
          localStorage.removeItem(STORAGE.rememberEmail)
        }

        if (companies.length === 0) {
          throw new Error('Bu kullanıcıya tanımlı şirket bulunamadı.')
        }

        if (companies.length === 1) {
          await finalizeCompany(result.accessToken, result.user, companies[0])
          return 'home'
        }

        setPendingLogin({ token: result.accessToken, user: result.user, companies })
        return 'select-company'
      } finally {
        setIsLoading(false)
      }
    },
    [finalizeCompany],
  )

  const selectCompany = useCallback(
    async (companyId: number) => {
      if (!pendingLogin) throw new Error('Önce giriş yapın.')
      const company = pendingLogin.companies.find((c) => c.id === companyId)
      if (!company) throw new Error('Şirket bulunamadı.')
      setIsLoading(true)
      try {
        await finalizeCompany(pendingLogin.token, pendingLogin.user, company)
      } finally {
        setIsLoading(false)
      }
    },
    [pendingLogin, finalizeCompany],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE.token)
    localStorage.removeItem(STORAGE.user)
    localStorage.removeItem(STORAGE.company)
    setSession(null)
    setPendingLogin(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      pendingLogin,
      isAuthenticated: !!session,
      isLoading,
      login,
      selectCompany,
      logout,
    }),
    [session, pendingLogin, isLoading, login, selectCompany, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı')
  return ctx
}

export function getRememberedEmail(): string {
  return localStorage.getItem(STORAGE.rememberEmail) ?? ''
}
