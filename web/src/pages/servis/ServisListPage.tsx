import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSvcTickets, type SvcTicketListItem } from '../../api/svc'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDateTime, svcStatusBadge } from '../../utils/format'

type StatusFilter = 'all' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED'

export default function ServisListPage() {
  const [items, setItems] = useState<SvcTicketListItem[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchSvcTickets(statusFilter === 'all' ? undefined : statusFilter)
      .then(setItems)
      .catch(() => setError('Servis listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [
        row.ticketNo,
        row.accountTitle,
        row.deviceName,
        row.problemDescription,
        row.technicianName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Servis Listesi</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Servis</li>
            </ol>
          </nav>
        </div>
        <Link to="/servis/yeni" className="btn btn-primary">
          <i className="ti ti-plus me-1" /> Yeni Servis Kaydı
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Servis Kayıtları</span>
          <div className="btn-group btn-group-sm flex-wrap">
            {(
              [
                ['all', 'Tümü'],
                ['WAITING', 'Beklemede'],
                ['IN_PROGRESS', 'İşlemde'],
                ['COMPLETED', 'Tamamlandı'],
                ['DELIVERED', 'Teslim Edildi'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`btn ${statusFilter === key ? 'btn-primary' : 'btn-label-secondary'}`}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <TableSearchToolbar placeholder="Servis ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Kayıt No</th>
                <th>Tarih</th>
                <th>Cari</th>
                <th>Cihaz</th>
                <th>Arıza / Talep</th>
                <th>Teknisyen</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => {
                  const badge = svcStatusBadge(row.statusKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">{row.ticketNo}</td>
                      <td>{formatDateTime(row.ticketDate)}</td>
                      <td>{row.accountTitle}</td>
                      <td>{row.deviceName || '—'}</td>
                      <td className="text-truncate" style={{ maxWidth: '16rem' }}>
                        {row.problemDescription}
                      </td>
                      <td>{row.technicianName || '—'}</td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
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
