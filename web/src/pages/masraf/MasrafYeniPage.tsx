import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import CariInfoPanel from '../../components/cari/CariInfoPanel'
import CariSecModal from '../../components/cari/CariSecModal'
import { fetchTaxRates, fetchUnits, type LookupItem, type TaxRate } from '../../api/core'
import { createExpense, fetchExpenseServices, type ExpServiceDefinition } from '../../api/exp'
import StokLineSearch from '../../components/stok/StokLineSearch'
import { fetchStkItem, fetchStkItems, type StkItemListItem } from '../../api/stk'
import { formatMoneyOptional, formatTry } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'

type LineDraft = {
  key: string
  serviceDefinitionId: number | ''
  itemId: number | ''
  description: string
  quantity: string
  unitId: number
  unitPrice: string
  taxRateId: number
}

const PAYMENT_METHODS = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'HAVALE', label: 'Havale/EFT' },
  { value: 'KREDI_KARTI', label: 'Kredi Kartı' },
  { value: 'CEK', label: 'Çek' },
  { value: 'SENET', label: 'Senet' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function newLine(units: LookupItem[], taxRates: TaxRate[]): LineDraft {
  return {
    key: crypto.randomUUID(),
    serviceDefinitionId: '',
    itemId: '',
    description: '',
    quantity: '1',
    unitId: units[0]?.id ?? 0,
    unitPrice: '0',
    taxRateId: taxRates.find((t) => t.rate === 20)?.id ?? taxRates[0]?.id ?? 0,
  }
}

function calcLine(line: LineDraft, taxRates: TaxRate[]) {
  const qty = Number(line.quantity) || 0
  const price = Number(line.unitPrice) || 0
  const net = Math.round(qty * price * 100) / 100
  const rate = taxRates.find((t) => t.id === line.taxRateId)?.rate ?? 0
  const tax = Math.round(net * rate) / 100
  return { net, tax, total: net + tax }
}

export default function MasrafYeniPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [services, setServices] = useState<ExpServiceDefinition[]>([])
  const [items, setItems] = useState<StkItemListItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [selectedCari, setSelectedCari] = useState<CariAccountListItem | null>(null)
  const [expenseDate, setExpenseDate] = useState(todayIso())
  const [paymentMethod, setPaymentMethod] = useState('NAKIT')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stkLoadingKey, setStkLoadingKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchCariAccounts(),
      fetchExpenseServices(),
      fetchStkItems(),
      fetchUnits(),
      fetchTaxRates(),
    ])
      .then(([cariData, svcData, stkData, unitData, taxData]) => {
        setCariler(cariData)
        setServices(svcData)
        setItems(stkData)
        setUnits(unitData)
        setTaxRates(taxData)
        setLines([newLine(unitData, taxData)])
      })
      .catch(() => setError('Form verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const totals = useMemo(() => {
    let subtotal = 0
    let taxTotal = 0
    for (const line of lines) {
      const c = calcLine(line, taxRates)
      subtotal += c.net
      taxTotal += c.tax
    }
    return { subtotal, taxTotal, grandTotal: subtotal + taxTotal }
  }, [lines, taxRates])

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  function handleServiceSelect(lineKey: string, serviceId: number) {
    const svc = services.find((s) => s.id === serviceId)
    if (!svc) return
    updateLine(lineKey, {
      serviceDefinitionId: serviceId,
      itemId: '',
      description: svc.name,
      taxRateId: svc.defaultTaxRateId || taxRates[0]?.id || 0,
    })
  }

  async function handleStokSelect(lineKey: string, item: StkItemListItem) {
    setStkLoadingKey(lineKey)
    try {
      const detail = await fetchStkItem(item.id)
      updateLine(lineKey, {
        serviceDefinitionId: '',
        itemId: item.id,
        description: item.name,
        unitId: detail.baseUnitId,
        unitPrice: String(detail.purchasePrice ?? detail.salesPrice ?? 0),
        taxRateId: detail.taxRateId || taxRates[0]?.id || 0,
      })
    } catch {
      setError('Stok bilgisi yüklenemedi.')
    } finally {
      setStkLoadingKey(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCari) {
      setError('Tedarikçi / cari hesap seçin.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createExpense({
        accountId: selectedCari.id,
        expenseDate,
        paymentMethod,
        notes: notes.trim() || null,
        requiresApproval,
        lines: lines.map((line) => ({
          serviceDefinitionId: line.serviceDefinitionId === '' ? null : Number(line.serviceDefinitionId),
          itemId: line.itemId === '' ? null : Number(line.itemId),
          description: line.description.trim(),
          quantity: Number(line.quantity),
          unitId: line.unitId,
          unitPrice: Number(line.unitPrice),
          taxRateId: line.taxRateId,
        })),
      })
      toast.success(
        'Kayıt oluşturuldu',
        requiresApproval ? 'Masraf onay bekliyor.' : 'Masraf kapalı fatura olarak kaydedildi.',
      )
      navigate('/masraf')
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Masraf kaydedilemedi.')
      setError(message)
      toast.error('Kayıt başarısız', message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="app-page-content">
        <p className="text-body-secondary">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Yeni Masraf (Kapalı Fatura)</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item"><Link to="/masraf">Masraf</Link></li>
              <li className="breadcrumb-item active">Yeni</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalCariSecMasraf">
            <i className="ti ti-users me-1" /> Cari Seç
          </button>
        </div>
      </div>

      {selectedCari && <CariInfoPanel cari={selectedCari} label="Tedarikçi / Cari" />}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label">Masraf Tarihi</label>
                <input type="date" className="form-control" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
              </div>
              <div className="col-md-8">
                <label className="form-label">Ödeme Şekli <span className="text-danger">*</span></label>
                <div className="d-flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      className={`btn btn-sm ${paymentMethod === pm.value ? 'btn-primary' : 'btn-label-secondary'}`}
                      onClick={() => setPaymentMethod(pm.value)}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
                <div className="form-text">Kapalı fatura: ödeme anında gerçekleşmiş sayılır.</div>
                <div className="form-check mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="requiresApproval"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="requiresApproval">
                    Onay akışı (önce yönetici onayı, sonra ödeme)
                  </label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Not</label>
                <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Kalemler — Hizmet veya Ürün</div>
          <div className="card-body">
            <div className="table-responsive overflow-visible">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Hizmet Tanımı</th>
                    <th style={{ minWidth: '14rem' }}>Stok Ürünü</th>
                    <th>Açıklama</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>KDV</th>
                    <th>Tutar</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const c = calcLine(line, taxRates)
                    return (
                      <tr key={line.key}>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={line.serviceDefinitionId}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) : ''
                              if (val) handleServiceSelect(line.key, val)
                              else updateLine(line.key, { serviceDefinitionId: '' })
                            }}
                          >
                            <option value="">Hizmet seç...</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <StokLineSearch
                            items={items}
                            selectedId={line.itemId}
                            priceMode="purchase"
                            disabled={stkLoadingKey === line.key}
                            onSelect={(item) => handleStokSelect(line.key, item)}
                            onClear={() => updateLine(line.key, { itemId: '' })}
                          />
                        </td>
                        <td>
                          <input className="form-control form-control-sm" value={line.description} onChange={(e) => updateLine(line.key, { description: e.target.value })} required />
                        </td>
                        <td>
                          <input type="number" min="0.0001" step="any" className="form-control form-control-sm" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: e.target.value })} required />
                        </td>
                        <td>
                          <input type="number" min="0" step="0.01" className="form-control form-control-sm" value={line.unitPrice} onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })} required />
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={line.taxRateId} onChange={(e) => updateLine(line.key, { taxRateId: Number(e.target.value) })}>
                            {taxRates.map((t) => (
                              <option key={t.id} value={t.id}>%{t.rate}</option>
                            ))}
                          </select>
                        </td>
                        <td>{formatTry(c.total)}</td>
                        <td>
                          {lines.length > 1 && (
                            <button type="button" className="btn btn-sm btn-icon btn-label-danger" onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}>
                              <i className="ti ti-trash" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
              <button type="button" className="btn btn-label-secondary" onClick={() => setLines((prev) => [...prev, newLine(units, taxRates)])}>
                <i className="ti ti-plus me-1" /> Kalem Ekle
              </button>
              <div className="text-end">
                <p className="mb-1">Ara Toplam: <strong>{formatMoneyOptional(totals.subtotal)}</strong></p>
                <p className="mb-1">KDV: <strong>{formatMoneyOptional(totals.taxTotal)}</strong></p>
                <h5 className="mb-0">Genel Toplam: {formatTry(totals.grandTotal)}</h5>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet (Kapalı Fatura)'}
              </button>
              <Link to="/masraf" className="btn btn-label-secondary">İptal</Link>
            </div>
          </div>
        </div>
      </form>

      <CariSecModal
        modalId="modalCariSecMasraf"
        description="Masrafı kaydetmek istediğiniz tedarikçi veya cari hesabı seçin."
        cariler={cariler}
        loading={loading}
        onSelect={setSelectedCari}
      />
    </div>
  )
}
