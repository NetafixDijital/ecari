import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import {
  fetchCshAccounts,
  fetchCshMovements,
  recordCollection,
  type CshAccountListItem,
  type CshTransactionListItem,
} from '../../api/csh'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDate, formatTry } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function KasaListPage() {
  const toast = useToast()
  const [items, setItems] = useState<CshAccountListItem[]>([])
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [movements, setMovements] = useState<CshTransactionListItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [movementSearch, setMovementSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [accountId, setAccountId] = useState<number | ''>('')
  const [cashAccountId, setCashAccountId] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [transactionDate, setTransactionDate] = useState(todayIso())
  const [description, setDescription] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchCshAccounts(), fetchCshMovements(), fetchCariAccounts()])
      .then(([accounts, movementRows, cariRows]) => {
        setItems(accounts)
        setMovements(movementRows)
        setCariler(cariRows.filter((c) => c.isActive))
        const defaultCash = accounts.find((a) => a.isActive) ?? accounts[0]
        if (defaultCash && cashAccountId === '') setCashAccountId(defaultCash.id)
      })
      .catch(() => setError('Kasa listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [cashAccountId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => [row.code, row.name].join(' ').toLowerCase().includes(q))
  }, [items, tableSearch])

  const totalBalance = useMemo(
    () => filteredItems.reduce((sum, row) => sum + row.balance, 0),
    [filteredItems],
  )

  const filteredMovements = useMemo(() => {
    const q = movementSearch.trim().toLowerCase()
    if (!q) return movements
    return movements.filter((row) =>
      [
        row.cashAccountName,
        row.accountTitle,
        row.transactionTypeLabel,
        row.referenceNo,
        row.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [movements, movementSearch])

  async function handleTahsilat(e: React.FormEvent) {
    e.preventDefault()
    if (accountId === '' || cashAccountId === '' || !amount) return
    setSaving(true)
    setError('')
    try {
      await recordCollection({
        accountId: Number(accountId),
        cashAccountId: Number(cashAccountId),
        amount: Number(amount),
        transactionDate,
        description: description.trim() || undefined,
      })
      toast.success('Tahsilat kaydedildi', 'Kasa hareketi oluşturuldu.')
      setAmount('')
      setDescription('')
      const modal = document.getElementById('modalKasaTahsilat')
      if (modal && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(modal).hide()
      loadItems()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Tahsilat kaydedilemedi.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Kasa</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Kasa</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalKasaTahsilat">
            <i className="ti ti-cash me-1" /> Tahsilat
          </button>
          <Link to="/kasa/gun-sonu" className="btn btn-label-secondary">
            <i className="ti ti-report me-1" /> Gün Sonu Raporu
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Toplam bakiye</p>
              <h4 className="mb-0">{formatTry(totalBalance)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Aktif kasa</p>
              <h4 className="mb-0">{items.filter((i) => i.isActive).length}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Kasa hesapları</span>
        </div>
        <TableSearchToolbar placeholder="Kasa ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Kod</th>
                <th>Kasa Adı</th>
                <th>Tip</th>
                <th>Bakiye</th>
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
                filteredItems.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-medium">{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.cashType === 'CASH' ? 'Nakit' : row.cashType}</td>
                    <td className={row.balance >= 0 ? 'text-success' : 'text-danger'}>
                      {formatTry(row.balance)}
                    </td>
                    <td>
                      <span className={`badge ${row.isActive ? 'bg-label-success' : 'bg-label-secondary'}`}>
                        {row.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Kasa hareketleri</span>
        </div>
        <TableSearchToolbar placeholder="Hareket ara..." onSearch={setMovementSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Tarih</th>
                <th>Kasa</th>
                <th>Cari</th>
                <th>Tip</th>
                <th>Tutar</th>
                <th>Referans</th>
                <th>Açıklama</th>
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
              {!loading && filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredMovements.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.transactionDate)}</td>
                    <td>{row.cashAccountName}</td>
                    <td>{row.accountTitle || '—'}</td>
                    <td>{row.transactionTypeLabel}</td>
                    <td className={row.transactionType === 'IN' ? 'text-success' : 'text-danger'}>
                      {formatTry(row.amount)}
                    </td>
                    <td className="font-mono small">{row.referenceNo || '—'}</td>
                    <td>{row.description || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade" id="modalKasaTahsilat" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleTahsilat}>
              <div className="modal-header">
                <h5 className="modal-title">Kasa Tahsilat</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
              </div>
              <div className="modal-body row g-3">
                <div className="col-12">
                  <label className="form-label">Cari</label>
                  <select
                    className="form-select"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">Seçin</option>
                    {cariler.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Kasa</label>
                  <select
                    className="form-select"
                    value={cashAccountId}
                    onChange={(e) => setCashAccountId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    {items.filter((i) => i.isActive).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tarih</label>
                  <input
                    type="date"
                    className="form-control"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Tutar</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0.01}
                    step={0.01}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Açıklama</label>
                  <input
                    type="text"
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tahsilat açıklaması"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
