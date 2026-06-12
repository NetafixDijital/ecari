import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchExpenseStats, fetchExpenses, type ExpExpenseListItem } from '../../api/exp'
import { expenseCategoryLabel, formatTry } from '../../utils/format'

export default function MasrafYonetimPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchExpenseStats>> | null>(null)
  const [items, setItems] = useState<ExpExpenseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchExpenseStats(), fetchExpenses()])
      .then(([statsData, listData]) => {
        setStats(statsData)
        setItems(listData)
      })
      .catch(() => setError('Masraf verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const row of items) {
      const prev = map.get(row.category) ?? { count: 0, total: 0 }
      map.set(row.category, { count: prev.count + 1, total: prev.total + row.amount })
    }
    return [...map.entries()]
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [items])

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Masraf Yönetimi</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/masraf">Masraf</Link>
              </li>
              <li className="breadcrumb-item active">Yönetim</li>
            </ol>
          </nav>
        </div>
        <Link to="/masraf" className="btn btn-label-secondary">
          <i className="ti ti-list me-1" /> Masraf Listesi
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-4 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Toplam Masraf</p>
              <h4 className="mb-0">{loading ? '—' : formatTry(stats?.totalAmount ?? 0)}</h4>
              <p className="text-body-secondary small mb-0 mt-1">{stats?.totalCount ?? 0} kayıt</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Onay Bekliyor</p>
              <h4 className="mb-0 text-warning">{loading ? '—' : (stats?.pendingCount ?? 0)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Onaylandı</p>
              <h4 className="mb-0 text-info">{loading ? '—' : (stats?.approvedCount ?? 0)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Ödendi</p>
              <h4 className="mb-0 text-success">{loading ? '—' : (stats?.paidCount ?? 0)}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Kategori Dağılımı</div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Kategori</th>
                <th>Adet</th>
                <th>Toplam Tutar</th>
                <th>Oran</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && categoryBreakdown.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                categoryBreakdown.map((row) => {
                  const pct =
                    stats && stats.totalAmount > 0
                      ? Math.round((row.total / stats.totalAmount) * 100)
                      : 0
                  return (
                    <tr key={row.category}>
                      <td className="fw-medium">{expenseCategoryLabel(row.category)}</td>
                      <td>{row.count}</td>
                      <td>{formatTry(row.total)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px' }}>
                            <div className="progress-bar" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="small text-body-secondary">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
