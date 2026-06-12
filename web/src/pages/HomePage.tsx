import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDashboard, type DashboardSummary } from '../api/dashboard'
import { formatDate, formatTry, statusBadge } from '../utils/format'

function compactTry(amount: number) {
  if (amount >= 1_000_000) return `₺${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `₺${Math.round(amount / 1_000)}K`
  return formatTry(amount)
}

function taskIcon(statusKey: string) {
  if (statusKey === 'OVERDUE') return 'ti-alert-circle text-danger'
  if (statusKey === 'IN_PROGRESS') return 'ti-loader text-info'
  return 'ti-checklist text-primary'
}

export default function HomePage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboard()
      .then(setDashboard)
      .catch(() => setError('Panel verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const monthTargetPercent =
    dashboard && dashboard.monthIncome > 0
      ? Math.min(100, Math.round((dashboard.monthIncome / 75_000) * 100))
      : 0

  return (
    <>
      <div className="app-page-head d-flex align-items-center justify-content-between flex-wrap gap-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/">
                <i className="ti ti-smart-home me-1" /> Ana Sayfa
              </Link>
            </li>
            <li className="breadcrumb-item active">Ana Panel</li>
          </ol>
        </nav>
        <div className="d-flex gap-2">
          <Link to="/fatura/yeni" className="btn btn-sm btn-light">
            <i className="ti ti-file-invoice me-1" /> Yeni Fatura
          </Link>
          <Link to="/cari" className="btn btn-sm btn-primary">
            <i className="ti ti-plus me-1" /> Yeni Cari
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="row g-3">
        <div className="col-xxl-9">
          <div className="row g-3">
            <div className="col-xxl-3 col-sm-6">
              <div className="card finance-stat-card h-100">
                <div className="card-body">
                  <div className="avatar bg-success-subtle text-success">
                    <i className="ti ti-coins" />
                  </div>
                  <div>
                    <span className="stat-label">Toplam Gelir</span>
                    <h2 className="amount fw-bold mb-0">
                      {loading ? '…' : formatTry(dashboard?.totalIncome ?? 0)}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-sm-6">
              <div className="card finance-stat-card h-100">
                <div className="card-body">
                  <div className="avatar bg-danger-subtle text-danger">
                    <i className="ti ti-credit-card" />
                  </div>
                  <div>
                    <span className="stat-label">Toplam Gider</span>
                    <h2 className="amount fw-bold mb-0">
                      {loading ? '…' : formatTry(dashboard?.totalExpense ?? 0)}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-sm-6">
              <div className="card finance-stat-card h-100">
                <div className="card-body">
                  <div className="avatar bg-info-subtle text-info">
                    <i className="ti ti-chart-histogram" />
                  </div>
                  <div>
                    <span className="stat-label">Net Kar</span>
                    <h2 className="amount fw-bold mb-0">
                      {loading ? '…' : formatTry(dashboard?.netProfit ?? 0)}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xxl-3 col-sm-6">
              <div className="card finance-stat-card h-100">
                <div className="card-body">
                  <div className="avatar bg-warning-subtle text-warning">
                    <i className="ti ti-calendar" />
                  </div>
                  <div>
                    <span className="stat-label">Bekleyen Faturalar</span>
                    <h2 className="fw-bold mb-0">{loading ? '…' : dashboard?.pendingInvoiceCount ?? 0}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-0">
            <div className="col-lg-8">
              <div className="card finance-chart-card h-100">
                <div className="card-header d-flex flex-wrap align-items-center justify-content-between border-0 pb-0">
                  <h6 className="mb-0">Gelir vs Gider</h6>
                  <Link to="/raporlar/gelir-gider" className="btn btn-sm btn-light">
                    Detaylı Rapor
                  </Link>
                </div>
                <div className="card-body pt-2">
                  <div className="d-flex flex-wrap gap-3 text-1xs mb-1">
                    <span>
                      <i className="ti ti-square-filled text-primary me-1" /> Gelir{' '}
                      <strong>{loading ? '…' : formatTry(dashboard?.totalIncome ?? 0)}</strong>
                    </span>
                    <span>
                      <i className="ti ti-square-filled text-primary opacity-50 me-1" /> Gider{' '}
                      <strong>{loading ? '…' : formatTry(dashboard?.totalExpense ?? 0)}</strong>
                    </span>
                  </div>
                  <div className="finance-chart-bars" aria-hidden="true">
                    <span
                      style={{
                        height: dashboard
                          ? `${Math.min(100, (dashboard.totalIncome / Math.max(dashboard.totalIncome, dashboard.totalExpense, 1)) * 85)}%`
                          : '55%',
                      }}
                    />
                    <span
                      className="bar-alt"
                      style={{
                        height: dashboard
                          ? `${Math.min(100, (dashboard.totalExpense / Math.max(dashboard.totalIncome, dashboard.totalExpense, 1)) * 85)}%`
                          : '38%',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card h-100">
                <div className="card-header border-0 pb-0">
                  <h6 className="card-title mb-0">Fatura Özeti</h6>
                </div>
                <div className="card-body pt-2">
                  <div className="finance-legend-nl text-start">
                    <div className="finance-legend-nl-item">
                      <i className="ti ti-square-filled text-success me-1" />
                      Satış faturası<strong className="ms-auto">{loading ? '…' : dashboard?.salesInvoiceCount ?? 0}</strong>
                    </div>
                    <div className="finance-legend-nl-item">
                      <i className="ti ti-square-filled text-warning me-1" />
                      Ödeme bekleyen<strong className="ms-auto">{loading ? '…' : dashboard?.pendingInvoiceCount ?? 0}</strong>
                    </div>
                    <div className="finance-legend-nl-item">
                      <i className="ti ti-square-filled text-primary me-1" />
                      Ödenen oranı<strong className="ms-auto">{loading ? '…' : `%${dashboard?.paidInvoicePercent ?? 0}`}</strong>
                    </div>
                    <div className="finance-legend-nl-item">
                      <i className="ti ti-square-filled text-danger me-1" />
                      Vadesi geçen<strong className="ms-auto">{loading ? '…' : `%${dashboard?.overdueInvoicePercent ?? 0}`}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-3">
          <div className="card finance-target-card h-100">
            <div className="card-header pb-0 border-0 d-flex align-items-center justify-content-between">
              <h6 className="card-title mb-0 text-white">Aylık Hedef</h6>
              <div className="dropdown">
                <button className="btn btn-sm btn-icon text-white" type="button" data-bs-toggle="dropdown">
                  <i className="ti ti-dots" />
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/raporlar/gelir-gider">
                      Gelir-Gider Raporu
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="card-body pt-2 pb-0">
              <div className="d-flex gap-2 align-items-center">
                <h2 className="mb-0 text-white">{loading ? '…' : `%${monthTargetPercent}`}</h2>
                <span className="text-white text-1xs">Bu ay satış geliri</span>
              </div>
              <div className="finance-target-visual">
                <div className="finance-target-ring" aria-hidden="true" />
                <div className="finance-target-mid text-white">
                  {loading ? '…' : `${dashboard?.salesInvoiceCount ?? 0} fatura`}
                </div>
              </div>
              <div className="text-center px-2">
                <p className="text-white mb-0 text-1xs">
                  Bugün <strong className="text-warning">{loading ? '…' : formatTry(dashboard?.todayIncome ?? 0)}</strong>{' '}
                  satış faturası
                </p>
              </div>
            </div>
            <div className="card-footer border-0 pt-3 pb-3">
              <div className="finance-target-footer bg-body py-3 px-3 rounded-3 d-flex">
                <div className="text-center flex-fill py-1">
                  <h4 className="mb-0">₺75K</h4>
                  <span className="text-primary text-2xs fw-semibold d-block">Hedef</span>
                </div>
                <div className="vr opacity-50" />
                <div className="text-center flex-fill py-1">
                  <h4 className="mb-0">{loading ? '…' : compactTry(dashboard?.monthIncome ?? 0)}</h4>
                  <span className="text-primary text-2xs fw-semibold d-block">Bu Ay</span>
                </div>
                <div className="vr opacity-50" />
                <div className="text-center flex-fill py-1">
                  <h4 className="mb-0">{loading ? '…' : compactTry(dashboard?.todayIncome ?? 0)}</h4>
                  <span className="text-primary text-2xs fw-semibold d-block">Bugün</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mt-0">
        <div className="col-xxl-8">
          <div className="card finance-table-card datatables-toolbar-hidden h-100">
            <div className="card-header d-flex align-items-center justify-content-between border-0 pb-2">
              <h6 className="card-title mb-0">Son İşlemler</h6>
              <Link to="/fatura/satis" className="btn btn-sm btn-light">
                Tümünü Gör
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover datatables-ajax mb-0">
                <thead>
                  <tr>
                    <th>Cari</th>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th>Kategori</th>
                    <th className="text-end">Tutar</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-body-secondary">
                        Yükleniyor…
                      </td>
                    </tr>
                  ) : dashboard?.recentTransactions.length ? (
                    dashboard.recentTransactions.map((row) => {
                      const badge = statusBadge(row.statusKey)
                      return (
                        <tr key={row.id}>
                          <td>{row.accountTitle}</td>
                          <td>{formatDate(row.documentDate)}</td>
                          <td>
                            <Link to={`/fatura/onizleme/${row.id}`}>{row.description}</Link>
                          </td>
                          <td className="text-capitalize">{row.category}</td>
                          <td className="text-end amount">{formatTry(row.amount)}</td>
                          <td>
                            <span className={`badge ${badge.className}`}>{badge.label}</span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-body-secondary">
                        Henüz fatura kaydı yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xxl-4">
          <div className="row g-3">
            <div className="col-12">
              <div className="card finance-side-card">
                <div className="card-header d-flex justify-content-between align-items-center border-0 pb-0">
                  <h6 className="card-title mb-0">Vade Takvimi</h6>
                  <Link to="/fatura/satis" className="btn btn-action-primary btn-sm btn-icon">
                    <i className="ti ti-plus" />
                  </Link>
                </div>
                <div className="card-body" style={{ maxHeight: '14rem', overflowY: 'auto' }}>
                  {loading ? (
                    <p className="text-body-secondary mb-0">Yükleniyor…</p>
                  ) : dashboard?.dueItems.length ? (
                    dashboard.dueItems.map((item) => (
                      <div className="meeting-card mb-3" key={item.id}>
                        <h6 className="mb-0 text-sm">
                          <Link to={`/fatura/onizleme/${item.id}`}>
                            {item.documentNo} — {item.accountTitle}
                          </Link>
                        </h6>
                        <div
                          className={`text-1xs mt-1 ${item.statusKey === 'vadesi_gecmis' ? 'text-danger' : item.hint.includes('gün') ? 'text-warning' : ''}`}
                        >
                          <i
                            className={`ti ${item.statusKey === 'vadesi_gecmis' ? 'ti-alert-circle' : 'ti-clock'} me-1`}
                          />
                          {item.hint}
                        </div>
                        <div className="d-flex justify-content-between mt-2">
                          <span className="badge bg-light text-dark">Tahsilat</span>
                          <span className="text-primary text-2xs fw-semibold amount">{formatTry(item.amount)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-body-secondary mb-0">Vadesi yaklaşan fatura yok.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card finance-side-card">
                <div className="card-header d-flex justify-content-between border-0 pb-0">
                  <h6 className="card-title mb-0">Hızlı Özet</h6>
                </div>
                <div className="card-body pt-2">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="deal-box d-flex align-items-center gap-2 py-2">
                        <div className="avatar avatar-sm bg-label-success rounded-circle">
                          <i className="ti ti-users" />
                        </div>
                        <div>
                          <div className="text-1xs">Alacaklı Cari</div>
                          <h5 className="mb-0">{loading ? '…' : dashboard?.receivableAccountCount ?? 0}</h5>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="deal-box d-flex align-items-center gap-2 py-2">
                        <div className="avatar avatar-sm bg-label-primary rounded-circle">
                          <i className="ti ti-cash" />
                        </div>
                        <div>
                          <div className="text-1xs">Toplam Alacak</div>
                          <h5 className="mb-0 amount">{loading ? '…' : compactTry(dashboard?.totalReceivable ?? 0)}</h5>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between text-1xs mb-1">
                      <span>Ödenen Faturalar</span>
                      <strong>{loading ? '…' : `%${dashboard?.paidInvoicePercent ?? 0}`}</strong>
                    </div>
                    <div className="progress progress-sm">
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${dashboard?.paidInvoicePercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between text-1xs mb-1">
                      <span>Vadesi Geçen</span>
                      <strong>{loading ? '…' : `%${dashboard?.overdueInvoicePercent ?? 0}`}</strong>
                    </div>
                    <div className="progress progress-sm">
                      <div
                        className="progress-bar bg-danger"
                        style={{ width: `${dashboard?.overdueInvoicePercent ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="card finance-side-card mb-0">
                <div className="card-header d-flex justify-content-between border-0 pb-0">
                  <h6 className="card-title mb-0">Görev Güncellemeleri</h6>
                  <Link to="/gorev" className="btn btn-sm btn-link p-0">
                    Tümü
                  </Link>
                </div>
                <div className="card-body pt-0">
                  {loading ? (
                    <p className="text-body-secondary mb-0">Yükleniyor…</p>
                  ) : dashboard?.recentTasks.length ? (
                    dashboard.recentTasks.map((task) => (
                      <div className="nl-task-item" key={task.id}>
                        <i className={`ti ${taskIcon(task.statusKey)}`} />
                        <div>
                          <div className="small fw-semibold">{task.title}</div>
                          <small className="text-body-secondary">{formatDate(task.endDate)}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-body-secondary mb-0">Açık görev yok.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
