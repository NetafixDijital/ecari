import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchQuotations, type QotQuotationListItem } from '../../api/qot'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDate, formatMoneyOptional, quotationStatusBadge } from '../../utils/format'

export default function TeklifListPage() {
  const [items, setItems] = useState<QotQuotationListItem[]>([])
  const [typeFilter, setTypeFilter] = useState<'all' | 'SALES' | 'PURCHASE'>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchQuotations(typeFilter === 'all' ? undefined : typeFilter)
      .then(setItems)
      .catch(() => setError('Teklif listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [typeFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.documentNo, row.accountTitle, row.documentType].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Teklif Listesi</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Teklif</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <Link to="/teklif/yeni?type=satis" className="btn btn-primary">
            <i className="ti ti-plus me-1" /> Yeni Satış Teklifi
          </Link>
          <Link to="/teklif/yeni?type=alis" className="btn btn-label-primary">
            <i className="ti ti-plus me-1" /> Yeni Alış Teklifi
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Teklifler</span>
          <div className="btn-group btn-group-sm">
            {(['all', 'SALES', 'PURCHASE'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`btn ${typeFilter === key ? 'btn-primary' : 'btn-label-secondary'}`}
                onClick={() => setTypeFilter(key)}
              >
                {key === 'all' ? 'Tümü' : key === 'SALES' ? 'Satış' : 'Alış'}
              </button>
            ))}
          </div>
        </div>
        <TableSearchToolbar placeholder="Teklif ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Teklif No</th>
                <th>Tip</th>
                <th>Cari</th>
                <th>Tarih</th>
                <th>Geçerlilik</th>
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
                  const badge = quotationStatusBadge(row.statusKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">
                        <Link to={`/teklif/${row.id}`}>{row.documentNo}</Link>
                      </td>
                      <td>
                        <span className={`badge ${row.documentType === 'SALES' ? 'bg-label-primary' : 'bg-label-info'}`}>
                          {row.documentType === 'SALES' ? 'Satış' : 'Alış'}
                        </span>
                      </td>
                      <td>{row.accountTitle}</td>
                      <td>{formatDate(row.documentDate)}</td>
                      <td>{formatDate(row.validUntil)}</td>
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
