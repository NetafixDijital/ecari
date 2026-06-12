import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getRememberedEmail, useAuth } from '../context/AuthContext'

function AuthIllustration() {
  return (
    <svg className="auth-vector" viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="240" cy="210" r="160" fill="rgba(89,85,209,0.08)" />
      <circle cx="240" cy="210" r="120" fill="rgba(89,85,209,0.06)" className="auth-vector-pulse" />
      <rect x="120" y="90" width="240" height="180" rx="20" fill="#fff" stroke="rgba(89,85,209,0.15)" strokeWidth="2" />
      <rect x="145" y="120" width="90" height="12" rx="6" fill="rgba(89,85,209,0.35)" />
      <rect x="145" y="145" width="160" height="8" rx="4" fill="rgba(89,85,209,0.12)" />
      <rect x="145" y="165" width="130" height="8" rx="4" fill="rgba(89,85,209,0.08)" />
      <rect x="145" y="200" width="190" height="40" rx="8" fill="rgba(89,85,209,0.06)" />
      <circle cx="330" cy="130" r="36" fill="rgba(89,85,209,0.12)" />
      <path d="M315 130 L327 142 L348 118" stroke="#5955D1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <g className="auth-float-slow">
        <rect x="60" y="260" width="72" height="72" rx="16" fill="#5955D1" opacity="0.85" />
        <path d="M84 295 L96 307 L118 283" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="auth-float-fast">
        <circle cx="390" cy="280" r="28" fill="rgba(40,199,111,0.2)" />
        <path d="M378 280 L388 290 L404 272" stroke="#28c76f" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const remembered = getRememberedEmail()

  const [email, setEmail] = useState(remembered || 'admin@ecari.demo')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(!!remembered)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const next = await login(email.trim(), password, rememberMe)
      navigate(next === 'select-company' ? '/select-company' : '/', { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'
      setError(message)
    }
  }

  return (
    <div className="page-layout">
      <div className="auth-wrapper min-vh-100 px-2 auth-wrapper-animated">
        <div className="auth-bg-blob auth-bg-blob-1" aria-hidden="true" />
        <div className="auth-bg-blob auth-bg-blob-2" aria-hidden="true" />
        <div className="auth-bg-blob auth-bg-blob-3" aria-hidden="true" />

        <div className="row g-0 min-vh-100 position-relative" style={{ zIndex: 1 }}>
          <div className="col-xl-5 col-lg-6 ms-auto px-sm-4 align-self-center py-4 d-none d-lg-block">
            <div className="auth-vector-wrap">
              <AuthIllustration />
            </div>
          </div>

          <div className="col-xl-5 col-lg-6 ms-auto px-sm-4 align-self-center py-4">
            <div className="card card-body p-4 p-sm-5 maxw-450px m-auto rounded-4 auth-card-enter shadow-sm border-0">
              <div className="mb-4 text-center">
                <Link to="/login" aria-label="e-Cari" className="text-decoration-none">
                  <span className="auth-logo-mark d-inline-flex">eC</span>
                </Link>
              </div>
              <div className="text-center mb-4">
                <h5 className="mb-1">e-Cari&apos;ye Hoş Geldiniz</h5>
                <p className="text-body-secondary mb-0">Güvenli ön muhasebe panelinize giriş yapın.</p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label className="form-label" htmlFor="loginEmail">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="loginEmail"
                    name="email"
                    autoComplete="username"
                    placeholder="admin@ecari.demo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="loginPassword">
                    Şifre
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control password-input"
                      id="loginPassword"
                      name="password"
                      autoComplete="current-password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className={`toggle-password${showPassword ? ' is-visible' : ''}`}
                      aria-pressed={showPassword}
                      aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <i className="ti ti-eye-off close" />
                      <i className="ti ti-eye open" />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <div className="form-check mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={isLoading}
                      />
                      <label className="form-check-label" htmlFor="rememberMe">
                        Beni hatırla
                      </label>
                    </div>
                    <a href="#sifremi-unuttum" className="small" onClick={(e) => e.preventDefault()}>
                      Şifremi unuttum?
                    </a>
                  </div>
                </div>
                <div className="mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary waves-effect waves-light w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
                  </button>
                </div>
                <p className="mb-5 text-center text-body-secondary">
                  Hesabınız yok mu?{' '}
                  <a href="#kayit" onClick={(e) => e.preventDefault()}>
                    Kayıt olun
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
