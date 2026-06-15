import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchExpenses, payExpense, updateExpenseStatus, type ExpExpenseListItem } from '../../api/exp'
import IconActionButton from '../../components/ui/IconActionButton'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { apiErrorMessage } from '../../utils/apiError'
import { expenseStatusBadge, formatDate, formatTry } from '../../utils/format'

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'

export default function MasrafListPage() {
  const [items, setItems] = useState<ExpExpenseListItem[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState<number | null>(null)

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchExpenses(statusFilter === 'all' ? undefined : statusFilter)
      .then(setItems)
      .catch(() => setError('Masraf listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.documentNo, row.accountTitle, row.summary, row.paymentMethodLabel].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  async function handleApprove(row: ExpExpenseListItem) {
    setActingId(row.id)
    setError('')
    try {
      await updateExpenseStatus(row.id, 'approve')
      loadItems()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Masraf onaylanamadı.'))
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(row: ExpExpenseListItem) {
    if (!window.confirm(`${row.documentNo} reddedilsin mi?`)) return
    setActingId(row.id)
    setError('')
    try {
      await updateExpenseStatus(row.id, 'reject')
      loadItems()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Masraf reddedilemedi.'))
    } finally {
      setActingId(null)
    }
  }

  async function handlePay(row: ExpExpenseListItem) {
    if (!window.confirm(`${row.documentNo} ödemesi yapılsın mı?`)) return
    setActingId(row.id)
    setError('')
    try {
      await payExpense(row.id)
      loadItems()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Masraf ödenemedi.'))
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Masraf Listesi</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item active">Masraf</li>
            </ol>
          </nav>
        </div>
        <Link to="/masraf/yeni" className="btn btn-primary">
          <i className="ti ti-plus me-1" /> Yeni Masraf
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Masraf Kayıtları (Kapalı Fatura)</span>
          <div className="btn-group btn-group-sm flex-wrap">
            {(
              [
                ['all', 'Tümü'],
                ['PENDING', 'Onay Bekliyor'],
                ['APPROVED', 'Onaylandı'],
                ['PAID', 'Ödendi'],
                ['REJECTED', 'Reddedildi'],
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
        <TableSearchToolbar placeholder="Masraf ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Belge No</th>
                <th>Tarih</th>
                <th>Cari</th>
                <th>Özet</th>
                <th>Ödeme</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center text-body-secondary py-4">Yükleniyor...</td></tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr><td colSpan={8} className="text-center text-body-secondary py-4">Kayıt bulunamadı.</td></tr>
              )}
              {!loading && filteredItems.map((row) => {
                const badge = expenseStatusBadge(row.statusKey)
                return (
                  <tr key={row.id}>
                    <td className="fw-medium">
                      <Link to={`/masraf/${row.id}`}>{row.documentNo}</Link>
                    </td>
                    <td>{formatDate(row.expenseDate)}</td>
                    <td>{row.accountTitle}</td>
                    <td className="text-truncate" style={{ maxWidth: '16rem' }}>{row.summary}</td>
                    <td>{row.paymentMethodLabel}</td>
                    <td>{formatTry(row.grandTotal)}</td>
                    <td><span className={`badge ${badge.className}`}>{badge.label}</span></td>
                    <td className="text-center">
                      <div className="d-inline-flex gap-1">
                        {row.statusKey === 'onay_bekliyor' && (
                          <>
                            <IconActionButton
                              icon="ti-check"
                              color="success"
                              title="Onayla"
                              disabled={actingId === row.id}
                              onClick={() => handleApprove(row)}
                            />
                            <IconActionButton
                              icon="ti-x"
                              color="danger"
                              title="Reddet"
                              disabled={actingId === row.id}
                              onClick={() => handleReject(row)}
                            />
                          </>
                        )}
                        {(row.statusKey === 'onaylandi' || row.statusKey === 'onay_bekliyor') && !row.purchaseInvoiceId && (
                          <IconActionButton
                            icon="ti-cash"
                            color="primary"
                            title="Öde"
                            disabled={actingId === row.id}
                            onClick={() => handlePay(row)}
                          />
                        )}
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
