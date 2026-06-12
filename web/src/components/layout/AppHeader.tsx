import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'

interface AppHeaderProps {
  onToggleSidebar: () => void
}

export default function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const user = session?.user
  const userInitials = user ? initials(user.fullName) : '?'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const btn = document.getElementById('nl-theme-toggle')
    if (!btn) return
    const current = document.documentElement.getAttribute('data-bs-theme')
    btn.classList.toggle('is-dark', current === 'dark')
    const onClick = (e: Event) => {
      e.preventDefault()
      const html = document.documentElement
      const next = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'
      html.setAttribute('data-bs-theme', next)
      btn.classList.toggle('is-dark', next === 'dark')
    }
    btn.addEventListener('click', onClick)
    return () => btn.removeEventListener('click', onClick)
  }, [])

  return (
    <header className="app-header" id="nl-header">
      <div className="app-header-inner">
        <button
          className="app-toggler"
          type="button"
          id="nl-sidebar-toggle"
          aria-label="Menü"
          onClick={onToggleSidebar}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7.66699 12.6668L3.66699 8.00016L7.66699 3.3335"
              stroke="#1C274C"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              opacity="0.5"
              d="M12.667 12.6668L8.66699 8.00016L12.667 3.3335"
              stroke="#1C274C"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="app-header-start d-none d-md-flex">
          <form className="d-flex align-items-center h-100 w-lg-250px w-xxl-300px position-relative" onSubmit={(e) => e.preventDefault()}>
            <button type="button" className="btn btn-sm border-0 position-absolute start-0 ms-3 p-0">
              <i className="ti ti-search" />
            </button>
            <input
              type="text"
              className="form-control form-control-fill ps-5"
              placeholder="Ara... (fatura, cari, ürün)"
              data-bs-toggle="modal"
              data-bs-target="#searchResultsModal"
              readOnly
            />
          </form>
          <div className="badge-standard d-none d-lg-inline-block">
            Bugün Yeni Faturalar <span className="badge bg-primary-subtle text-primary">5</span>
          </div>
        </div>
        <div className="app-header-end">
          <div className="px-lg-4 px-2 ps-0 d-flex align-items-center">
            <a href="#theme" className="theme-btn" id="nl-theme-toggle" aria-label="Tema" onClick={(e) => e.preventDefault()}>
              <svg className="icon-light" width="20" height="21" viewBox="0 0 20 21" fill="none">
                <path
                  d="M14.1663 10.5002C14.1663 12.8013 12.3008 14.6668 9.99967 14.6668C7.69849 14.6668 5.83301 12.8013 5.83301 10.5002C5.83301 8.19898 7.69849 6.3335 9.99967 6.3335C12.3008 6.3335 14.1663 8.19898 14.1663 10.5002Z"
                  fill="var(--bs-heading-color)"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.0003 1.5415C10.3455 1.5415 10.6253 1.82133 10.6253 2.1665V3.83317C10.6253 4.17834 10.3455 4.45817 10.0003 4.45817C9.65516 4.45817 9.37532 4.17834 9.37532 3.83317V2.1665C9.37532 1.82133 9.65516 1.5415 10.0003 1.5415Z"
                  fill="var(--bs-heading-color)"
                />
              </svg>
              <div className="theme-toggle" />
              <svg className="icon-dark" width="20" height="21" viewBox="0 0 20 21" fill="none">
                <path
                  opacity="0.5"
                  d="M10.0003 18.8332C14.6027 18.8332 18.3337 15.1022 18.3337 10.4998C18.3337 10.1143 17.7557 10.0505 17.5563 10.3805C16.6077 11.9503 14.8849 12.9998 12.917 12.9998C9.92541 12.9998 7.50032 10.5748 7.50032 7.58317C7.50032 5.61521 8.54982 3.89238 10.1197 2.9438C10.4497 2.7444 10.3859 2.1665 10.0003 2.1665C5.39795 2.1665 1.66699 5.89746 1.66699 10.4998C1.66699 15.1022 5.39795 18.8332 10.0003 18.8332Z"
                  fill="var(--bs-heading-color)"
                />
              </svg>
            </a>
          </div>
          <div className="vr my-3" />
          <div className="d-flex align-items-center gap-sm-2 gap-0 px-lg-4 px-sm-2 px-1">
            <a href="#messages" className="btn btn-icon btn-action-gray rounded-circle position-relative" onClick={(e) => e.preventDefault()}>
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                <path
                  opacity="0.5"
                  d="M22 11V12.5C22 17.214 22 19.5711 20.5355 21.0355C19.0711 22.5 16.714 22.5 12 22.5C7.28595 22.5 4.92893 22.5 3.46447 21.0355C2 19.5711 2 17.214 2 12.5C2 7.78595 2 5.42893 3.46447 3.96447C4.92893 2.5 7.28595 2.5 12 2.5H13.5"
                  stroke="var(--bs-heading-color)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M19 8.5C20.6569 8.5 22 7.15685 22 5.5C22 3.84315 20.6569 2.5 19 2.5C17.3431 2.5 16 3.84315 16 5.5C16 7.15685 17.3431 8.5 19 8.5Z" stroke="var(--bs-heading-color)" strokeWidth="2" />
                <path d="M7 14.5H16" stroke="var(--bs-heading-color)" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 18H13" stroke="var(--bs-heading-color)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="position-absolute top-0 end-0 p-1 mt-1 me-1 bg-primary border border-3 border-light rounded-circle">
                <span className="visually-hidden">Yeni mesaj</span>
              </span>
            </a>
            <div className="dropdown text-end">
              <button
                type="button"
                className="btn btn-icon btn-action-gray rounded-circle"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded="false"
              >
                <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                  <path
                    d="M18.7491 10.2096V9.50497C18.7491 5.63623 15.7274 2.5 12 2.5C8.27256 2.5 5.25087 5.63623 5.25087 9.50497V10.2096C5.25087 11.0552 5.00972 11.8818 4.5578 12.5854L3.45036 14.3095C2.43882 15.8843 3.21105 18.0249 4.97036 18.5229C9.57274 19.8257 14.4273 19.8257 19.0296 18.5229C20.789 18.0249 21.5612 15.8843 20.5496 14.3095L19.4422 12.5854C18.9903 11.8818 18.7491 11.0552 18.7491 10.2096Z"
                    stroke="var(--bs-heading-color)"
                    strokeWidth="2"
                  />
                  <path
                    opacity="0.5"
                    d="M7.5 19.5C8.15503 21.2478 9.92246 22.5 12 22.5C14.0775 22.5 15.845 21.2478 16.5 19.5"
                    stroke="var(--bs-heading-color)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className="dropdown-menu dropdown-menu-lg-end p-0 w-300px mt-2">
                <div className="px-3 py-3 border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    Bildirimler <span className="badge badge-sm rounded-pill bg-primary ms-2">0</span>
                  </h6>
                  <button type="button" className="btn btn-sm btn-link p-0">
                    Tümünü oku
                  </button>
                </div>
                <div className="p-2 nl-notify-scroll">
                  <ul className="list-group list-group-hover list-group-smooth list-group-unlined mb-0" />
                </div>
                <div className="p-2 border-top">
                  <button type="button" className="btn w-100 btn-primary">
                    Tüm bildirimleri gör
                  </button>
                </div>
              </div>
            </div>
            <a href="#calendar" className="btn btn-icon btn-action-gray rounded-circle" title="Takvim" onClick={(e) => e.preventDefault()}>
              <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
                <path
                  d="M2 12.5C2 8.72876 2 6.84315 3.17157 5.67157C4.34315 4.5 6.22876 4.5 10 4.5H14C17.7712 4.5 19.6569 4.5 20.8284 5.67157C22 6.84315 22 8.72876 22 12.5V14.5C22 18.2712 22 20.1569 20.8284 21.3284C19.6569 22.5 17.7712 22.5 14 22.5H10C6.22876 22.5 4.34315 22.5 3.17157 21.3284C2 20.1569 2 18.2712 2 14.5V12.5Z"
                  stroke="var(--bs-heading-color)"
                  strokeWidth="2"
                />
              </svg>
            </a>
          </div>
          <div className="vr my-3" />
          <div className="dropdown text-end ms-sm-3 ms-2 ms-lg-4">
            <a
              href="#profile"
              className="d-flex align-items-center py-2 text-decoration-none"
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
              onClick={(e) => e.preventDefault()}
            >
              <div className="text-end me-2 d-none d-lg-inline-block">
                <div className="fw-bold text-dark">{user?.fullName}</div>
                <small className="text-body d-block lh-sm">
                  <i className="ti ti-chevron-down me-1" style={{ fontSize: '0.65rem' }} />
                  {session?.company.name}
                </small>
              </div>
              <div className="avatar avatar-sm rounded-circle avatar-status-success">
                <span className="avatar-initial bg-label-primary">{userInitials}</span>
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end w-225px mt-1">
              <li className="d-flex align-items-center p-2">
                <div className="avatar avatar-sm rounded-circle">
                  <span className="avatar-initial bg-label-primary">{userInitials}</span>
                </div>
                <div className="ms-2">
                  <div className="fw-bold text-dark">{user?.fullName}</div>
                  <small className="text-body d-block lh-sm">{user?.email}</small>
                </div>
              </li>
              <li>
                <div className="dropdown-divider my-1" />
              </li>
              <li>
                <Link className="dropdown-item d-flex align-items-center gap-2" to="/ayarlar">
                  <i className="ti ti-user" /> Profil
                </Link>
              </li>
              <li>
                <Link className="dropdown-item d-flex align-items-center gap-2" to="/fatura/satis">
                  <i className="ti ti-notes" /> Görevlerim
                </Link>
              </li>
              <li>
                <Link className="dropdown-item d-flex align-items-center gap-2" to="/ayarlar">
                  <i className="ti ti-settings" /> Hesap Ayarları
                </Link>
              </li>
              <li>
                <Link className="dropdown-item d-flex align-items-center gap-2" to="/ayarlar/ozel">
                  <i className="ti ti-crown" /> Plan Yükselt
                </Link>
              </li>
              <li>
                <div className="dropdown-divider my-1" />
              </li>
              <li>
                <button type="button" className="dropdown-item d-flex align-items-center gap-2 text-danger" onClick={handleLogout}>
                  <i className="ti ti-logout" /> Çıkış
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}
