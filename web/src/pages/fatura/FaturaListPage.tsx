import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchInvoices, deleteInvoice, type InvInvoiceListItem } from '../../api/inv'
import IconActionButton from '../../components/ui/IconActionButton'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDate, formatMoneyOptional, statusBadge } from '../../utils/format'

type FaturaListConfig = {
  invoiceType: 'SALES' | 'PURCHASE'
  title: string
  breadcrumbActive: string
  cardTitle: string
  accountColumn: string
  searchPlaceholder: string
  newButtonLabel: string
}

const CONFIG: Record<'satis' | 'alis', FaturaListConfig> = {
  satis: {
    invoiceType: 'SALES',
    title: 'Satış Fatura',
    breadcrumbActive: 'Satış Fatura',
    cardTitle: 'Satış faturaları',
    accountColumn: 'Müşteri (Cari)',
    searchPlaceholder: 'Satış faturası ara...',
    newButtonLabel: 'Yeni Satış Faturası',
  },
  alis: {
    invoiceType: 'PURCHASE',
    title: 'Alış Fatura',
    breadcrumbActive: 'Alış Fatura',
    cardTitle: 'Alış faturaları',
    accountColumn: 'Tedarikçi (Cari)',
    searchPlaceholder: 'Alış faturası ara...',
    newButtonLabel: 'Yeni Alış Faturası',
  },
}

export default function FaturaListPage({ mode }: { mode: 'satis' | 'alis' }) {
  const navigate = useNavigate()
  const cfg = CONFIG[mode]
  const [items, setItems] = useState<InvInvoiceListItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchInvoices(cfg.invoiceType)
      .then(setItems)
      .catch(() => setError('Fatura listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [cfg.invoiceType])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.documentNo, row.accountTitle].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  async function handleDelete(row: InvInvoiceListItem) {
    if (!window.confirm(`${row.documentNo} faturası silinsin mi?`)) return
    setDeletingId(row.id)
    setError('')
    try {
      await deleteInvoice(row.id)
      loadItems()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Fatura silinemedi.'))
    } finally {
      setDeletingId(null)
    }
  }

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
                <span>Fatura</span>
              </li>
              <li className="breadcrumb-item active">{cfg.breadcrumbActive}</li>
            </ol>
          </nav>
        </div>
        <Link to={`/fatura/yeni?type=${mode}`} className="btn btn-primary">
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
                <th>Fatura No</th>
                <th>{cfg.accountColumn}</th>
                <th>Tarih</th>
                <th>Vade</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th className="text-center">İşlemler</th>
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
                  const badge = statusBadge(row.paymentStatusKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">{row.documentNo}</td>
                      <td>{row.accountTitle}</td>
                      <td>{formatDate(row.documentDate)}</td>
                      <td>{formatDate(row.dueDate)}</td>
                      <td>{formatMoneyOptional(row.grandTotal)}</td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="text-center">
                        <div className="d-inline-flex gap-1">
                          <IconActionButton
                            icon="ti-eye"
                            color="info"
                            title="Önizle"
                            onClick={() => navigate(`/fatura/onizleme/${row.id}`)}
                          />
                          <IconActionButton
                            icon="ti-printer"
                            color="secondary"
                            title="Yazdır"
                            onClick={() => navigate(`/fatura/onizleme/${row.id}`, { state: { print: true } })}
                          />
                          <IconActionButton
                            icon="ti-trash"
                            color="danger"
                            title="Sil"
                            disabled={deletingId === row.id}
                            onClick={() => handleDelete(row)}
                          />
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
