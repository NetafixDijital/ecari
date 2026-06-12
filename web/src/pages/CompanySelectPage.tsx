import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function CompanySelectPage() {
  const { pendingLogin, selectCompany, isLoading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pendingLogin) {
      navigate('/login', { replace: true })
    }
  }, [pendingLogin, navigate])

  if (!pendingLogin) return null

  async function handleSelect(companyId: number) {
    setError('')
    try {
      await selectCompany(companyId)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError((err as Error).message || 'Şirket seçilemedi.')
    }
  }

  return (
    <div className="page-layout">
      <div className="auth-wrapper min-vh-100 px-2 auth-wrapper-animated d-flex align-items-center">
        <div className="card card-body p-4 p-sm-5 maxw-450px m-auto rounded-4 auth-card-enter shadow-sm border-0 w-100 mx-3">
          <div className="mb-4 text-center">
            <span className="auth-logo-mark d-inline-flex">eC</span>
          </div>
          <div className="text-center mb-4">
            <h5 className="mb-1">Şirket Seçin</h5>
            <p className="text-body-secondary mb-0">
              Merhaba {pendingLogin.user.fullName}, hangi şirketle devam etmek istersiniz?
            </p>
          </div>
          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              {error}
            </div>
          )}
          <div className="d-grid gap-2">
            {pendingLogin.companies.map((company) => (
              <button
                key={company.id}
                type="button"
                className="btn btn-outline-primary text-start"
                disabled={isLoading}
                onClick={() => handleSelect(company.id)}
              >
                <span className="fw-semibold d-block">{company.name}</span>
                <span className="small text-body-secondary">{company.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
