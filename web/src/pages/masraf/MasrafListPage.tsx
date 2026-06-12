import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createExpense, fetchExpenses, type ExpExpenseListItem } from '../../api/exp'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import {
  expenseCategoryLabel,
  expenseStatusBadge,
  formatDate,
  formatTry,
} from '../../utils/format'

type StatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'

const CATEGORIES = [
  { value: 'yakit', label: 'Yakıt' },
  { value: 'kirtasiye', label: 'Kırtasiye' },
  { value: 'yemek', label: 'Yemek' },
  { value: 'konaklama', label: 'Konaklama' },
  { value: 'diger', label: 'Diğer' },
]

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Nakit' },
  { value: 'CARD', label: 'Kredi Kartı' },
  { value: 'TRANSFER', label: 'Havale/EFT' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function closeModal(id: string) {
  const el = document.getElementById(id)
  if (el && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(el).hide()
}

export default function MasrafListPage() {
  const [items, setItems] = useState<ExpExpenseListItem[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [expenseDate, setExpenseDate] = useState(todayIso())
  const [category, setCategory] = useState('yakit')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [requester, setRequester] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

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
      const haystack = [
        row.documentNo,
        row.description,
        row.requesterName,
        row.category,
        expenseCategoryLabel(row.category),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  function resetForm() {
    setExpenseDate(todayIso())
    setCategory('yakit')
    setDescription('')
    setAmount('')
    setRequester('')
    setPaymentMethod('CASH')
    setCreateError('')
  }

  async function handleCreate() {
    const parsedAmount = Number(amount)
    if (!description.trim() || !parsedAmount || parsedAmount <= 0) {
      setCreateError('Açıklama ve geçerli bir tutar girin.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      await createExpense({
        expenseDate,
        category,
        description: description.trim(),
        amount: parsedAmount,
        requesterName: requester.trim() || null,
        paymentMethod,
      })
      closeModal('modalYeniMasraf')
      resetForm()
      loadItems()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Masraf kaydı oluşturulamadı.'
      setCreateError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Masraf Listesi</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Masraf</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <Link to="/masraf/yonetim" className="btn btn-label-secondary">
            <i className="ti ti-chart-pie me-1" /> Yönetim
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#modalYeniMasraf"
            onClick={resetForm}
          >
            <i className="ti ti-plus me-1" /> Yeni Masraf
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Masraflar</span>
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
                <th>Kategori</th>
                <th>Açıklama</th>
                <th>Talep Eden</th>
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
                  const badge = expenseStatusBadge(row.statusKey)
                  return (
                    <tr key={row.id}>
                      <td className="fw-medium">{row.documentNo}</td>
                      <td>{formatDate(row.expenseDate)}</td>
                      <td>{expenseCategoryLabel(row.category)}</td>
                      <td>{row.description}</td>
                      <td>{row.requesterName || '—'}</td>
                      <td>{formatTry(row.amount)}</td>
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

      <div className="modal fade" id="modalYeniMasraf" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-receipt-2 me-2 text-primary" />
                Yeni Masraf
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {createError && <div className="alert alert-danger py-2">{createError}</div>}
              <div className="mb-3">
                <label className="form-label">Tarih</label>
                <input
                  type="date"
                  className="form-control"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Masraf açıklaması"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Tutar (₺)</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.01"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Talep Eden</label>
                <input
                  type="text"
                  className="form-control"
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Ödeme Yöntemi</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                İptal
              </button>
              <button type="button" className="btn btn-primary" disabled={creating} onClick={handleCreate}>
                {creating ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
