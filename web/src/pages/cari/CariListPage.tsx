import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCities, fetchPaymentTerms, type City, type PaymentTerm } from '../../api/core'
import {
  createCariAccount,
  deleteCariAccount,
  fetchCariAccounts,
  fetchCariMovements,
  recordCariCollection,
  recordCariTransfer,
  updateCariAccount,
  type CariAccountListItem,
  type CariMovementListItem,
  type CreateCariAccountRequest,
  type UpdateCariAccountRequest,
} from '../../api/cari'
import { fetchCshAccounts, recordPayment } from '../../api/csh'
import { fetchBnkAccounts } from '../../api/bnk'
import IconActionButton from '../../components/ui/IconActionButton'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { displayTaxId, formatCariBalance, personTypeBadge } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'
import CariListModals, {
  type PaymentModalState,
  type TahsilatPaymentMethod,
  type VirmanModalState,
} from './CariListModals'
import DuzenleCariModal from './DuzenleCariModal'

function openModal(id: string) {
  const el = document.getElementById(id)
  if (!el || !window.bootstrap) return
  window.bootstrap.Modal.getOrCreateInstance(el).show()
}

function closeModal(id: string) {
  const el = document.getElementById(id)
  if (!el || !window.bootstrap) return
  window.bootstrap.Modal.getOrCreateInstance(el).hide()
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function CariListPage() {
  const toast = useToast()
  const [items, setItems] = useState<CariAccountListItem[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])
  const [bankAccounts, setBankAccounts] = useState<Awaited<ReturnType<typeof fetchBnkAccounts>>>([])
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [kasaAccounts, setKasaAccounts] = useState<Awaited<ReturnType<typeof fetchCshAccounts>>>([])
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<TahsilatPaymentMethod>('CASH')
  const [paymentCashAccountId, setPaymentCashAccountId] = useState<number | ''>('')
  const [paymentBankAccountId, setPaymentBankAccountId] = useState<number | ''>('')
  const [checkInstrumentNo, setCheckInstrumentNo] = useState('')
  const [checkBankName, setCheckBankName] = useState('')
  const [checkDueDate, setCheckDueDate] = useState('')
  const [paymentDescription, setPaymentDescription] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayIso())
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [reportMovements, setReportMovements] = useState<CariMovementListItem[]>([])
  const [reportLoading, setReportLoading] = useState(false)
  const [virmanModal, setVirmanModal] = useState<VirmanModalState | null>(null)
  const [virmanTargetId, setVirmanTargetId] = useState<number | ''>('')
  const [virmanAmount, setVirmanAmount] = useState('')
  const [virmanDescription, setVirmanDescription] = useState('')
  const [virmanSaving, setVirmanSaving] = useState(false)
  const [virmanError, setVirmanError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    setError('')
    fetchCariAccounts()
      .then(setItems)
      .catch(() => setError('Cari listesi yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadItems()
    fetchCities().then(setCities).catch(() => undefined)
    fetchPaymentTerms().then(setPaymentTerms).catch(() => undefined)
    fetchBnkAccounts().then((accounts) => {
      setBankAccounts(accounts)
      if (accounts[0]) setPaymentBankAccountId(accounts[0].id)
    }).catch(() => undefined)
    fetchCshAccounts().then((accounts) => {
      setKasaAccounts(accounts)
      if (accounts[0]) setPaymentCashAccountId(accounts[0].id)
    }).catch(() => undefined)
  }, [loadItems])

  const filteredItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) => {
      const haystack = [row.code, row.title, row.phone, row.email, displayTaxId(row), row.personType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [items, tableSearch])

  const handleSearch = useCallback((query: string) => {
    setTableSearch(query)
  }, [])

  async function handleCreate(body: CreateCariAccountRequest) {
    setCreating(true)
    setCreateError('')
    try {
      await createCariAccount(body)
      toast.success('Kayıt oluşturuldu', 'Cari hesap eklendi.')
      loadItems()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Cari kaydı oluşturulamadı.')
      setCreateError(message)
      toast.error('Kayıt başarısız', message)
      throw err
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: number, body: UpdateCariAccountRequest) {
    setSaving(true)
    setSaveError('')
    try {
      await updateCariAccount(id, body)
      toast.success('Güncellendi', 'Cari bilgileri kaydedildi.')
      loadItems()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Cari güncellenemedi.')
      setSaveError(message)
      toast.error('Kayıt başarısız', message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row: CariAccountListItem) {
    if (!window.confirm(`"${row.title}" cari kaydını silmek istediğinize emin misiniz?`)) return
    setDeletingId(row.id)
    try {
      await deleteCariAccount(row.id)
      toast.success('Silindi', `"${row.title}" cari kaydı kaldırıldı.`)
      loadItems()
    } catch {
      toast.error('Silme başarısız', 'Cari silinemedi.')
    } finally {
      setDeletingId(null)
    }
  }

  function handleCariAction(action: string, row: CariAccountListItem) {
    if (action === 'edit') {
      setSaveError('')
      setEditingId(row.id)
      return
    }
    if (action === 'tahsilat' || action === 'tediye') {
      setPaymentModal({ type: action, cari: row })
      setPaymentAmount('')
      setPaymentMethod('CASH')
      setPaymentDescription('')
      setPaymentDate(todayIso())
      setCheckInstrumentNo('')
      setCheckBankName('')
      setCheckDueDate('')
      setPaymentError('')
      if (kasaAccounts[0]) setPaymentCashAccountId(kasaAccounts[0].id)
      if (bankAccounts[0]) setPaymentBankAccountId(bankAccounts[0].id)
      openModal(action === 'tahsilat' ? 'modalTahsilat' : 'modalTediye')
      return
    }
    if (action === 'virman') {
      setVirmanModal({ source: row })
      setVirmanTargetId('')
      setVirmanAmount('')
      setVirmanDescription('')
      setVirmanError('')
      openModal('modalVirman')
      return
    }
    if (action === 'rapor') {
      setReportLoading(true)
      setReportMovements([])
      fetchCariMovements(row.id)
        .then(setReportMovements)
        .catch(() => setReportMovements([]))
        .finally(() => setReportLoading(false))
      openModal('modalHareketRaporu')
    }
  }

  const virmanTargetOptions = useMemo(() => {
    if (!virmanModal) return items.filter((c) => c.isActive)
    return items.filter((c) => c.isActive && c.id !== virmanModal.source.id)
  }, [items, virmanModal])

  async function handleVirmanSubmit() {
    if (!virmanModal) return
    const amount = Number(virmanAmount)
    if (!virmanTargetId) {
      setVirmanError('Hedef cari seçin.')
      return
    }
    if (!amount || amount <= 0) {
      setVirmanError('Geçerli bir tutar girin.')
      return
    }
    setVirmanSaving(true)
    setVirmanError('')
    try {
      await recordCariTransfer({
        sourceAccountId: virmanModal.source.id,
        targetAccountId: Number(virmanTargetId),
        amount,
        transferDate: todayIso(),
        description: virmanDescription.trim() || null,
      })
      closeModal('modalVirman')
      setVirmanModal(null)
      toast.success('Virman kaydedildi', 'Cari hesaplar arası transfer tamamlandı.')
      loadItems()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Virman kaydedilemedi.')
      setVirmanError(message)
      toast.error('Kayıt başarısız', message)
    } finally {
      setVirmanSaving(false)
    }
  }

  async function handlePaymentSubmit() {
    if (!paymentModal) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      setPaymentError('Geçerli bir tutar girin.')
      return
    }

    if (paymentModal.type === 'tahsilat') {
      if (paymentMethod === 'CASH' && !paymentCashAccountId) {
        setPaymentError('Kasa seçin.')
        return
      }
      if (paymentMethod === 'BANK' && !paymentBankAccountId) {
        setPaymentError('Banka hesabı seçin.')
        return
      }
      if (paymentMethod === 'CHECK') {
        if (!checkInstrumentNo.trim()) {
          setPaymentError('Çek/senet numarası girin.')
          return
        }
        if (!checkDueDate) {
          setPaymentError('Vade tarihi seçin.')
          return
        }
      }
    } else if (!paymentCashAccountId) {
      setPaymentError('Kasa seçin.')
      return
    }

    setPaymentSaving(true)
    setPaymentError('')
    try {
      if (paymentModal.type === 'tahsilat') {
        await recordCariCollection({
          accountId: paymentModal.cari.id,
          paymentMethod,
          amount,
          transactionDate: paymentDate,
          description: paymentDescription.trim() || null,
          cashAccountId: paymentMethod === 'CASH' ? Number(paymentCashAccountId) : null,
          bankAccountId: paymentMethod === 'BANK' ? Number(paymentBankAccountId) : null,
          checkInstrumentNo: paymentMethod === 'CHECK' ? checkInstrumentNo.trim() : null,
          checkBankName: paymentMethod === 'CHECK' ? checkBankName.trim() || null : null,
          checkDueDate: paymentMethod === 'CHECK' ? checkDueDate : null,
        })
        closeModal('modalTahsilat')
      } else {
        await recordPayment({
          accountId: paymentModal.cari.id,
          cashAccountId: Number(paymentCashAccountId),
          amount,
          transactionDate: paymentDate,
          description: paymentDescription.trim() || null,
        })
        closeModal('modalTediye')
      }
      setPaymentModal(null)
      toast.success(
        paymentModal.type === 'tahsilat' ? 'Tahsilat kaydedildi' : 'Tediye kaydedildi',
        `${paymentModal.cari.title} — işlem tamamlandı.`,
      )
      loadItems()
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Ödeme kaydedilemedi.')
      setPaymentError(message)
      toast.error('Kayıt başarısız', message)
    } finally {
      setPaymentSaving(false)
    }
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <h4 className="mb-0">Cari Listesi</h4>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <button type="button" className="btn btn-label-secondary" data-bs-toggle="modal" data-bs-target="#modalExcelCari">
            <i className="ti ti-file-spreadsheet me-1" /> Excel&apos;den Aktar
          </button>
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalYeniCari">
            <i className="ti ti-plus me-1" /> Yeni Cari
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card datatables-toolbar-hidden">
        <TableSearchToolbar placeholder="Cari ara..." onSearch={handleSearch} />
        <div className="table-responsive">
          <table className="table table-hover datatables-ajax mb-0">
            <thead className="border-top">
              <tr>
                <th>Cari Kodu</th>
                <th>Tip</th>
                <th>Ünvan</th>
                <th>VKN/TCKN</th>
                <th>Telefon</th>
                <th>Bakiye</th>
                <th>Durum</th>
                <th className="text-center" style={{ minWidth: '13rem' }}>
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    Yükleniyor…
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-body-secondary py-4">
                    {tableSearch ? 'Arama kriterine uygun kayıt bulunamadı.' : 'Kayıt bulunamadı.'}
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((row) => {
                  const tip = personTypeBadge(row.personType)
                  const balance = formatCariBalance(row.balance, row.balanceSide)
                  return (
                    <tr key={row.id} data-cari-kod={row.code} data-cari-unvan={row.title}>
                      <td className="font-mono">{row.code}</td>
                      <td>
                        <span className={`badge ${tip.className}`}>{tip.label}</span>
                      </td>
                      <td>{row.title}</td>
                      <td>{displayTaxId(row)}</td>
                      <td>{row.phone ?? '—'}</td>
                      <td className="text-end">
                        <span className={balance.className}>{balance.text}</span>
                      </td>
                      <td>
                        <span className={`badge ${row.isActive ? 'bg-label-success' : 'bg-label-secondary'}`}>
                          {row.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1 cari-actions flex-wrap">
                          <IconActionButton icon="ti-edit" color="primary" title="Düzenle" onClick={() => handleCariAction('edit', row)} />
                          <IconActionButton icon="ti-cash" color="success" title="Tahsilat" onClick={() => handleCariAction('tahsilat', row)} />
                          <IconActionButton icon="ti-cash-off" color="danger" title="Tediye" onClick={() => handleCariAction('tediye', row)} />
                          <IconActionButton icon="ti-arrows-exchange" color="primary" title="Virman" onClick={() => handleCariAction('virman', row)} />
                          <IconActionButton icon="ti-report-analytics" color="info" title="Hareket Raporu" onClick={() => handleCariAction('rapor', row)} />
                          <IconActionButton
                            icon="ti-trash"
                            color="danger"
                            title="Sil"
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
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

      <CariListModals
        cities={cities}
        paymentTerms={paymentTerms}
        onCreate={handleCreate}
        creating={creating}
        createError={createError}
        kasaAccounts={kasaAccounts}
        bankAccounts={bankAccounts}
        paymentModal={paymentModal}
        paymentAmount={paymentAmount}
        paymentMethod={paymentMethod}
        paymentCashAccountId={paymentCashAccountId}
        paymentBankAccountId={paymentBankAccountId}
        checkInstrumentNo={checkInstrumentNo}
        checkBankName={checkBankName}
        checkDueDate={checkDueDate}
        paymentDescription={paymentDescription}
        paymentDate={paymentDate}
        paymentSaving={paymentSaving}
        paymentError={paymentError}
        onPaymentAmountChange={setPaymentAmount}
        onPaymentMethodChange={setPaymentMethod}
        onPaymentCashAccountChange={setPaymentCashAccountId}
        onPaymentBankAccountChange={setPaymentBankAccountId}
        onCheckInstrumentNoChange={setCheckInstrumentNo}
        onCheckBankNameChange={setCheckBankName}
        onCheckDueDateChange={setCheckDueDate}
        onPaymentDescriptionChange={setPaymentDescription}
        onPaymentDateChange={setPaymentDate}
        onPaymentSubmit={handlePaymentSubmit}
        virmanModal={virmanModal}
        virmanTargetId={virmanTargetId}
        virmanAmount={virmanAmount}
        virmanDescription={virmanDescription}
        virmanTargetOptions={virmanTargetOptions}
        virmanSaving={virmanSaving}
        virmanError={virmanError}
        onVirmanTargetChange={setVirmanTargetId}
        onVirmanAmountChange={setVirmanAmount}
        onVirmanDescriptionChange={setVirmanDescription}
        onVirmanSubmit={handleVirmanSubmit}
        reportMovements={reportMovements}
        reportLoading={reportLoading}
      />
      <DuzenleCariModal
        accountId={editingId}
        cities={cities}
        paymentTerms={paymentTerms}
        onClose={() => setEditingId(null)}
        onSave={handleUpdate}
        saving={saving}
        saveError={saveError}
      />
    </div>
  )
}
