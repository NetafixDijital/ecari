import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDeliveryNotes, type DlnDeliveryNoteListItem } from '../../api/dln'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { deliveryStatusBadge, formatDate } from '../../utils/format'

type IrsaliyeListConfig = {
  documentType: 'SALES' | 'PURCHASE'
  title: string
  breadcrumbActive: string
  cardTitle: string
  accountColumn: string
  searchPlaceholder: string
  newButtonLabel: string
  newQueryType: string
}

const CONFIG: Record<'satis' | 'alis', IrsaliyeListConfig> = {
  satis: {
    documentType: 'SALES',
    title: 'Satış İrsaliye',
    breadcrumbActive: 'Satış İrsaliye',
    cardTitle: 'Satış irsaliyeleri',
    accountColumn: 'Müşteri',
    searchPlaceholder: 'İrsaliye ara...',
    newButtonLabel: 'Yeni Satış İrsaliyesi',
    newQueryType: 'satis',
  },
  alis: {
    documentType: 'PURCHASE',
    title: 'Alış İrsaliye',
    breadcrumbActive: 'Alış İrsaliye',
    cardTitle: 'Alış irsaliyeleri',
    accountColumn: 'Tedarikçi',
    searchPlaceholder: 'İrsaliye ara...',
    newButtonLabel: 'Yeni Alış İrsaliyesi',
    newQueryType: 'alis',
  },
}

export default function IrsaliyeListPage({ mode }: { mode: 'satis' | 'alis' }) {
  const cfg = CONFIG[mode]
  const [items, setItems] = useState<DlnDeliveryNoteListItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchDeliveryNotes(cfg.documentType)
      .then(setItems)
      .catch(() => setError('İrsaliye listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [cfg.documentType])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.documentNo, row.accountTitle, row.shippingAddress]
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
          <h4 className="mb-1">{cfg.title}</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <span>İrsaliye</span>
              </li>
              <li className="breadcrumb-item active">{cfg.breadcrumbActive}</li>
            </ol>
          </nav>
        </div>
        <Link to={`/irsaliye/yeni?type=${cfg.newQueryType}`} className="btn btn-primary">
          <i className="ti ti-plus me-1" /> {cfg.newButtonLabel}
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>{cfg.cardTitle}</span>
        </div>
        <TableSearchToolbar placeholder={cfg.searchPlaceholder} onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover datatables-ajax mb-0">
            <thead className="border-top">
              <tr>
                <th>İrsaliye No</th>
                <th>{cfg.accountColumn}</th>
                <th>Tarih</th>
                <th>Sevk Adresi</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => {
                  const badge = deliveryStatusBadge(row.statusKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">
                        <Link to={`/irsaliye/${row.id}`}>{row.documentNo}</Link>
                      </td>
                      <td>{row.accountTitle}</td>
                      <td>{formatDate(row.documentDate)}</td>
                      <td>{row.shippingAddress ?? '—'}</td>
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
