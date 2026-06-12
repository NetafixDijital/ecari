import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders, type OrdOrderListItem } from '../../api/ord'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDate, formatMoneyOptional, orderStatusBadge } from '../../utils/format'

export default function SiparisListPage() {
  const [items, setItems] = useState<OrdOrderListItem[]>([])
  const [typeFilter, setTypeFilter] = useState<'all' | 'SALES' | 'PURCHASE'>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchOrders(typeFilter === 'all' ? undefined : typeFilter)
      .then(setItems)
      .catch(() => setError('Sipariş listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [typeFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.documentNo, row.accountTitle, row.orderType].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Sipariş Listesi</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Sipariş</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <Link to="/siparis/yeni?type=satis" className="btn btn-primary">
            <i className="ti ti-plus me-1" /> Yeni Satış Siparişi
          </Link>
          <Link to="/siparis/yeni?type=alis" className="btn btn-label-primary">
            <i className="ti ti-plus me-1" /> Yeni Alış Siparişi
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Siparişler</span>
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className={`btn ${typeFilter === 'all' ? 'btn-primary' : 'btn-label-secondary'}`}
              onClick={() => setTypeFilter('all')}
            >
              Tümü
            </button>
            <button
              type="button"
              className={`btn ${typeFilter === 'SALES' ? 'btn-primary' : 'btn-label-secondary'}`}
              onClick={() => setTypeFilter('SALES')}
            >
              Satış
            </button>
            <button
              type="button"
              className={`btn ${typeFilter === 'PURCHASE' ? 'btn-primary' : 'btn-label-secondary'}`}
              onClick={() => setTypeFilter('PURCHASE')}
            >
              Alış
            </button>
          </div>
        </div>
        <TableSearchToolbar placeholder="Sipariş ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover datatables-ajax mb-0">
            <thead className="border-top">
              <tr>
                <th>Sipariş No</th>
                <th>Tip</th>
                <th>Cari</th>
                <th>Tarih</th>
                <th>Teslim</th>
                <th>Tutar</th>
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
                  const badge = orderStatusBadge(row.statusKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">{row.documentNo}</td>
                      <td>
                        <span className={`badge ${row.orderType === 'SALES' ? 'bg-label-primary' : 'bg-label-info'}`}>
                          {row.orderType === 'SALES' ? 'Satış' : 'Alış'}
                        </span>
                      </td>
                      <td>{row.accountTitle}</td>
                      <td>{formatDate(row.documentDate)}</td>
                      <td>{formatDate(row.deliveryDate)}</td>
                      <td>{formatMoneyOptional(row.grandTotal)}</td>
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
