import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchBnkAccounts,
  fetchBnkTransactions,
  recordBnkCollection,
  recordBnkPayment,
  type BnkAccountListItem,
  type BnkTransactionListItem,
} from '../../api/bnk'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import CariSecModal, { closeCariSecModal } from '../../components/cari/CariSecModal'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDate, formatTry } from '../../utils/format'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function closeModal(modalId: string) {
  const el = document.getElementById(modalId)
  if (el && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(el).hide()
}

type TxModalType = 'gelen' | 'giden'

export default function BankaListPage() {
  const [accounts, setAccounts] = useState<BnkAccountListItem[]>([])
  const [transactions, setTransactions] = useState<BnkTransactionListItem[]>([])
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [accountSearch, setAccountSearch] = useState('')
  const [txSearch, setTxSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [txModalType, setTxModalType] = useState<TxModalType | null>(null)
  const [txBankAccountId, setTxBankAccountId] = useState<number | ''>('')
  const [txCari, setTxCari] = useState<CariAccountListItem | null>(null)
  const [txAmount, setTxAmount] = useState('')
  const [txDate, setTxDate] = useState(todayIso())
  const [txDescription, setTxDescription] = useState('')
  const [txSaving, setTxSaving] = useState(false)
  const [txError, setTxError] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    setError('')
    Promise.all([fetchBnkAccounts(), fetchBnkTransactions(), fetchCariAccounts()])
      .then(([accData, txData, cariData]) => {
        setAccounts(accData)
        setTransactions(txData)
        setCariler(cariData)
      })
      .catch(() => setError('Banka verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase()
    if (!q) return accounts
    return accounts.filter((row) =>
      [row.code, row.bankName, row.accountName, row.iban].join(' ').toLowerCase().includes(q),
    )
  }, [accounts, accountSearch])

  const filteredTransactions = useMemo(() => {
    const q = txSearch.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter((row) =>
      [
        row.bankAccountName,
        row.transactionTypeLabel,
        row.cariTitle,
        row.referenceNo,
        row.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [transactions, txSearch])

  const totalBalance = useMemo(
    () => filteredAccounts.reduce((sum, row) => sum + row.balance, 0),
    [filteredAccounts],
  )

  const cariModalId = txModalType === 'gelen' ? 'modalCariSecBnkGelen' : 'modalCariSecBnkGiden'

  function openTxModal(type: TxModalType) {
    setTxModalType(type)
    setTxBankAccountId(accounts[0]?.id ?? '')
    setTxCari(null)
    setTxAmount('')
    setTxDate(todayIso())
    setTxDescription('')
    setTxError('')
  }

  async function handleTxSubmit() {
    if (!txModalType) return
    const amount = Number(txAmount)
    if (!amount || amount <= 0) {
      setTxError('Geçerli bir tutar girin.')
      return
    }
    if (!txBankAccountId) {
      setTxError('Banka hesabı seçin.')
      return
    }
    if (!txCari) {
      setTxError('Cari hesap seçin.')
      return
    }

    setTxSaving(true)
    setTxError('')
    const body = {
      bankAccountId: Number(txBankAccountId),
      accountId: txCari.id,
      amount,
      transactionDate: txDate,
      description: txDescription.trim() || null,
    }

    try {
      if (txModalType === 'gelen') {
        await recordBnkCollection(body)
        closeModal('modalBnkGelen')
      } else {
        await recordBnkPayment(body)
        closeModal('modalBnkGiden')
      }
      loadData()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'İşlem kaydedilemedi.'
      setTxError(message)
    } finally {
      setTxSaving(false)
    }
  }

  function handleCariSelect(cari: CariAccountListItem) {
    setTxCari(cari)
    closeCariSecModal(cariModalId)
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Banka</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item active">Banka</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#modalBnkGelen"
            onClick={() => openTxModal('gelen')}
          >
            <i className="ti ti-arrow-down-left me-1" /> Gelen
          </button>
          <button
            type="button"
            className="btn btn-danger"
            data-bs-toggle="modal"
            data-bs-target="#modalBnkGiden"
            onClick={() => openTxModal('giden')}
          >
            <i className="ti ti-arrow-up-right me-1" /> Giden
          </button>
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
              <p className="text-body-secondary mb-1 small">Aktif hesap</p>
              <h4 className="mb-0">{accounts.filter((i) => i.isActive).length}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card datatables-toolbar-hidden mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Banka hesapları</span>
        </div>
        <TableSearchToolbar placeholder="Hesap ara..." onSearch={setAccountSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Kod</th>
                <th>Banka</th>
                <th>Hesap Adı</th>
                <th>IBAN</th>
                <th>Bakiye</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredAccounts.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-medium">{row.code}</td>
                    <td>{row.bankName}</td>
                    <td>{row.accountName}</td>
                    <td className="font-mono small">{row.iban}</td>
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
          <span>Son hareketler</span>
        </div>
        <TableSearchToolbar placeholder="Hareket ara..." onSearch={setTxSearch} />
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Tarih</th>
                <th>Banka Hesabı</th>
                <th>Tip</th>
                <th>Cari</th>
                <th>Tutar</th>
                <th>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredTransactions.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.transactionDate)}</td>
                    <td>{row.bankAccountName}</td>
                    <td>
                      <span
                        className={`badge ${
                          row.transactionType === 'COLLECTION' ? 'bg-label-success' : 'bg-label-danger'
                        }`}
                      >
                        {row.transactionTypeLabel}
                      </span>
                    </td>
                    <td>{row.cariTitle ?? '—'}</td>
                    <td
                      className={
                        row.transactionType === 'COLLECTION' ? 'text-success' : 'text-danger'
                      }
                    >
                      {formatTry(row.amount)}
                    </td>
                    <td className="text-body-secondary small">{row.description ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal fade" id="modalBnkGelen" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-arrow-down-left me-2 text-success" />
                Gelen (Tahsilat)
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {txError && <div className="alert alert-danger py-2">{txError}</div>}
              <div className="mb-3">
                <label className="form-label">Banka Hesabı</label>
                <select
                  className="form-select"
                  value={txBankAccountId}
                  onChange={(e) =>
                    setTxBankAccountId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Seçin...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} — {a.accountName} ({a.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Cari</label>
                <div className="d-flex gap-2 align-items-center">
                  <div className="flex-grow-1 px-3 py-2 rounded-3 bg-body border">
                    {txCari ? (
                      <span>
                        <strong>{txCari.title}</strong>{' '}
                        <span className="text-body-secondary small">({txCari.code})</span>
                      </span>
                    ) : (
                      <span className="text-body-secondary">Cari seçilmedi</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#modalCariSecBnkGelen"
                  >
                    Seç
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Tutar (₺)</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.01"
                  min={0}
                  placeholder="0,00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Tarih</label>
                <input
                  type="date"
                  className="form-control"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Tahsilat açıklaması"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                İptal
              </button>
              <button
                type="button"
                className="btn btn-success"
                disabled={txSaving || txModalType !== 'gelen'}
                onClick={handleTxSubmit}
              >
                {txSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalBnkGiden" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-arrow-up-right me-2 text-danger" />
                Giden (Ödeme)
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {txError && <div className="alert alert-danger py-2">{txError}</div>}
              <div className="mb-3">
                <label className="form-label">Banka Hesabı</label>
                <select
                  className="form-select"
                  value={txBankAccountId}
                  onChange={(e) =>
                    setTxBankAccountId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Seçin...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} — {a.accountName} ({a.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Cari</label>
                <div className="d-flex gap-2 align-items-center">
                  <div className="flex-grow-1 px-3 py-2 rounded-3 bg-body border">
                    {txCari ? (
                      <span>
                        <strong>{txCari.title}</strong>{' '}
                        <span className="text-body-secondary small">({txCari.code})</span>
                      </span>
                    ) : (
                      <span className="text-body-secondary">Cari seçilmedi</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#modalCariSecBnkGiden"
                  >
                    Seç
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Tutar (₺)</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.01"
                  min={0}
                  placeholder="0,00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Tarih</label>
                <input
                  type="date"
                  className="form-control"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Ödeme açıklaması"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                İptal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={txSaving || txModalType !== 'giden'}
                onClick={handleTxSubmit}
              >
                {txSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CariSecModal
        modalId="modalCariSecBnkGelen"
        description="Tahsilat için cari hesabı listeden seçin."
        cariler={cariler}
        loading={loading}
        onSelect={handleCariSelect}
      />
      <CariSecModal
        modalId="modalCariSecBnkGiden"
        description="Ödeme için cari hesabı listeden seçin."
        cariler={cariler}
        loading={loading}
        onSelect={handleCariSelect}
      />
    </div>
  )
}
