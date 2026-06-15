import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createChqInstrument,
  fetchChqInstruments,
  fetchChqStats,
  updateChqInstrumentStatus,
  type ChqInstrumentListItem,
  type ChqInstrumentStats,
} from '../../api/chq'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import CariSecModal, { closeCariSecModal } from '../../components/cari/CariSecModal'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { checkStatusBadge, formatDate, formatTry } from '../../utils/format'

type DirectionTab = 'RECEIVED' | 'ISSUED'

const CHQ_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Beklemede' },
  { value: 'PORTFOLIO', label: 'Portföyde' },
  { value: 'COLLECTED', label: 'Tahsil edildi' },
  { value: 'PAID', label: 'Ödendi' },
  { value: 'BOUNCED', label: 'Karşılıksız' },
  { value: 'ENDORSED', label: 'Ciro edildi' },
] as const

const CHQ_STATUS_KEY_TO_API: Record<string, string> = {
  pending: 'PENDING',
  portfolio: 'PORTFOLIO',
  collected: 'COLLECTED',
  paid: 'PAID',
  bounced: 'BOUNCED',
  endorsed: 'ENDORSED',
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function closeModal(id: string) {
  const el = document.getElementById(id)
  if (el && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(el).hide()
}

export default function CekListPage() {
  const [direction, setDirection] = useState<DirectionTab>('RECEIVED')
  const [items, setItems] = useState<ChqInstrumentListItem[]>([])
  const [stats, setStats] = useState<ChqInstrumentStats | null>(null)
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [instrumentType, setInstrumentType] = useState<'CEK' | 'SENET'>('CEK')
  const [selectedCari, setSelectedCari] = useState<CariAccountListItem | null>(null)
  const [bankName, setBankName] = useState('')
  const [instrumentNo, setInstrumentNo] = useState('')
  const [issueDate, setIssueDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(todayIso())
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null)

  const loadData = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([
      fetchChqInstruments(direction),
      fetchChqStats(direction),
      fetchCariAccounts(),
    ])
      .then(([listData, statsData, cariData]) => {
        setItems(listData)
        setStats(statsData)
        setCariler(cariData)
      })
      .catch(() => setError('Çek verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [direction])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) =>
      [row.instrumentNo, row.accountTitle, row.bankName, row.statusLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [items, tableSearch])

  function openCreateModal() {
    setInstrumentType('CEK')
    setSelectedCari(null)
    setBankName('')
    setInstrumentNo('')
    setIssueDate(todayIso())
    setDueDate(todayIso())
    setAmount('')
    setNotes('')
    setCreateError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCari) {
      setCreateError('Cari seçin.')
      return
    }
    const parsedAmount = Number(amount.replace(',', '.'))
    if (!parsedAmount || parsedAmount <= 0) {
      setCreateError('Geçerli tutar girin.')
      return
    }

    setCreating(true)
    setCreateError('')
    try {
      await createChqInstrument({
        instrumentType,
        direction,
        accountId: selectedCari.id,
        bankName: bankName || null,
        instrumentNo,
        issueDate,
        dueDate,
        amount: parsedAmount,
        notes: notes || null,
      })
      closeModal('modalYeniCek')
      closeCariSecModal('modalCariSecCek')
      loadData()
    } catch {
      setCreateError('Kayıt oluşturulamadı.')
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(row: ChqInstrumentListItem, status: string) {
    if (CHQ_STATUS_KEY_TO_API[row.statusKey] === status) return
    setStatusUpdatingId(row.id)
    try {
      const updated = await updateChqInstrumentStatus(row.id, status)
      setItems((prev) => prev.map((item) => (item.id === row.id ? updated : item)))
      fetchChqStats(direction).then(setStats).catch(() => {})
    } catch {
      setError('Durum güncellenemedi.')
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const tabLabel = direction === 'RECEIVED' ? 'Tahsilatlar' : 'Ödemeler'

  return (
    <>
      <div className="app-page-head d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h4 className="mb-1">Çek & Senet</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Çek & Senet</li>
            </ol>
          </nav>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#modalYeniCek"
          onClick={openCreateModal}
        >
          <i className="ti ti-plus me-1" /> Yeni Kayıt
        </button>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${direction === 'RECEIVED' ? 'active' : ''}`}
            onClick={() => setDirection('RECEIVED')}
          >
            Tahsilatlar
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${direction === 'ISSUED' ? 'active' : ''}`}
            onClick={() => setDirection('ISSUED')}
          >
            Ödemeler
          </button>
        </li>
      </ul>

      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary small mb-1">Toplam {tabLabel}</p>
              <h5 className="mb-0">{loading ? '…' : stats?.totalCount ?? 0}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary small mb-1">Toplam tutar</p>
              <h5 className="mb-0 amount">{loading ? '…' : formatTry(stats?.totalAmount ?? 0)}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-warning">
            <div className="card-body">
              <p className="text-body-secondary small mb-1">Bekleyen</p>
              <h5 className="mb-0">{loading ? '…' : `${stats?.pendingCount ?? 0} · ${formatTry(stats?.pendingAmount ?? 0)}`}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-success">
            <div className="card-body">
              <p className="text-body-secondary small mb-1">Gerçekleşen</p>
              <h5 className="mb-0">{loading ? '…' : `${stats?.completedCount ?? 0} · ${formatTry(stats?.completedAmount ?? 0)}`}</h5>
            </div>
          </div>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden">
        <TableSearchToolbar placeholder="Çek no, cari, banka ara…" onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Belge Tipi</th>
                <th>No</th>
                <th>Cari</th>
                <th>Banka</th>
                <th>Keşide</th>
                <th>Vade</th>
                <th className="text-end">Tutar</th>
                <th>Durum</th>
                <th>Durum Güncelle</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-body-secondary">
                    Yükleniyor…
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => {
                  const badge = checkStatusBadge(row.statusKey)
                  return (
                    <tr key={row.id}>
                      <td>{row.instrumentType === 'CEK' ? 'Çek' : 'Senet'}</td>
                      <td className="font-mono">{row.instrumentNo}</td>
                      <td>{row.accountTitle}</td>
                      <td>{row.bankName || '—'}</td>
                      <td>{formatDate(row.issueDate)}</td>
                      <td>{formatDate(row.dueDate)}</td>
                      <td className="text-end amount">{formatTry(row.amount)}</td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td style={{ minWidth: '10rem' }}>
                        <select
                          className="form-select form-select-sm"
                          value={CHQ_STATUS_KEY_TO_API[row.statusKey] ?? 'PENDING'}
                          disabled={statusUpdatingId === row.id}
                          onChange={(e) => handleStatusChange(row, e.target.value)}
                        >
                          {CHQ_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              {!loading && !filteredItems.length && (
                <tr>
                  <td colSpan={9} className="text-center py-4 text-body-secondary">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade nl-modal-form" id="modalYeniCek" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <form className="modal-content" onSubmit={handleCreate}>
            <div className="modal-header">
              <div>
                <h5 className="modal-title">Yeni {direction === 'RECEIVED' ? 'Tahsilat' : 'Ödeme'} Kaydı</h5>
                <p className="modal-desc mb-0">Çek veya senet portföyüne yeni belge ekleyin.</p>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {createError && <div className="alert alert-danger py-2">{createError}</div>}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Belge tipi</label>
                  <select
                    className="form-select"
                    value={instrumentType}
                    onChange={(e) => setInstrumentType(e.target.value as 'CEK' | 'SENET')}
                  >
                    <option value="CEK">Çek</option>
                    <option value="SENET">Senet</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Belge no</label>
                  <input
                    className="form-control"
                    value={instrumentNo}
                    onChange={(e) => setInstrumentNo(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Cari</label>
                  <div className="input-group">
                    <input
                      className="form-control"
                      readOnly
                      value={selectedCari ? `${selectedCari.code} — ${selectedCari.title}` : ''}
                      placeholder="Cari seçin"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#modalCariSecCek"
                    >
                      Seç
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Banka</label>
                  <input className="form-control" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tutar</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Keşide tarihi</label>
                  <input
                    className="form-control"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Vade tarihi</label>
                  <input
                    className="form-control"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Not</label>
                  <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                İptal
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CariSecModal
        modalId="modalCariSecCek"
        description="Çek/senet kaydına bağlanacak cariyi seçin."
        cariler={cariler}
        loading={loading}
        onSelect={(cari) => {
          setSelectedCari(cari)
          closeCariSecModal('modalCariSecCek')
        }}
      />
    </>
  )
}
