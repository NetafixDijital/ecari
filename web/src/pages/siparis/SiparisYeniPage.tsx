import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import { fetchWarehouses } from '../../api/cfg'
import CariInfoPanel from '../../components/cari/CariInfoPanel'
import CariSecModal from '../../components/cari/CariSecModal'
import { fetchTaxRates, fetchUnits, type LookupItem, type TaxRate } from '../../api/core'
import { createOrder } from '../../api/ord'
import StokLineSearch from '../../components/stok/StokLineSearch'
import { fetchStkItem, fetchStkItems, type StkItemListItem } from '../../api/stk'
import { formatMoneyOptional, formatTry } from '../../utils/format'

type LineDraft = {
  key: string
  itemId: number | ''
  description: string
  quantity: string
  unitId: number
  unitPrice: string
  taxRateId: number
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function newLine(units: LookupItem[], taxRates: TaxRate[]): LineDraft {
  return {
    key: crypto.randomUUID(),
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
  return { net, tax, total: net + tax, rate }
}

export default function SiparisYeniPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('type') === 'alis' ? 'alis' : 'satis'
  const orderType = mode === 'alis' ? 'PURCHASE' : 'SALES'
  const listPath = '/siparis'
  const title = mode === 'alis' ? 'Yeni Alış Siparişi' : 'Yeni Satış Siparişi'

  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [items, setItems] = useState<StkItemListItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<typeof fetchWarehouses>>>([])
  const [selectedCari, setSelectedCari] = useState<CariAccountListItem | null>(null)
  const [documentDate, setDocumentDate] = useState(todayIso())
  const [deliveryDate, setDeliveryDate] = useState(addDaysIso(todayIso(), 30))
  const [warehouseId, setWarehouseId] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stkLoadingKey, setStkLoadingKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchCariAccounts(),
      fetchStkItems(),
      fetchUnits(),
      fetchTaxRates(),
      fetchWarehouses(),
    ])
      .then(([cariData, stkData, unitData, taxData, whData]) => {
        setCariler(cariData)
        setItems(stkData)
        setUnits(unitData)
        setTaxRates(taxData)
        setWarehouses(whData)
        setLines([newLine(unitData, taxData)])
        const defaultWh = whData.find((w) => w.isDefault) ?? whData[0]
        if (defaultWh) setWarehouseId(defaultWh.id)
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
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    )
  }

  async function handleStokSelect(lineKey: string, item: StkItemListItem) {
    setStkLoadingKey(lineKey)
    try {
      const detail = await fetchStkItem(item.id)
      const price = mode === 'alis' ? detail.purchasePrice : detail.salesPrice
      updateLine(lineKey, {
        itemId: item.id,
        description: item.name,
        unitId: detail.baseUnitId,
        unitPrice: String(price ?? 0),
        taxRateId: detail.taxRateId || taxRates[0]?.id || 0,
      })
    } catch {
      setError('Stok bilgisi yüklenemedi.')
    } finally {
      setStkLoadingKey(null)
    }
  }

  function handleStokClear(lineKey: string) {
    updateLine(lineKey, { itemId: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCari) {
      setError('Cari hesap seçin.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createOrder({
        orderType,
        accountId: selectedCari.id,
        documentDate,
        deliveryDate: deliveryDate || null,
        warehouseId: warehouseId === '' ? null : Number(warehouseId),
        notes: notes.trim() || null,
        lines: lines.map((line) => ({
          itemId: line.itemId === '' ? null : Number(line.itemId),
          description: line.description.trim(),
          quantity: Number(line.quantity),
          unitId: line.unitId,
          unitPrice: Number(line.unitPrice),
          taxRateId: line.taxRateId,
        })),
      })
      navigate(listPath)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Sipariş kaydedilemedi.'
      setError(message)
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
          <h4 className="mb-1">{title}</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={listPath}>Sipariş</Link>
              </li>
              <li className="breadcrumb-item active">Yeni</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-body">
            <i className="ti ti-user text-primary" />
            <span className="small text-body-secondary">Seçili:</span>
            <span className="fw-medium">{selectedCari ? selectedCari.title : 'Cari seçilmedi'}</span>
            {selectedCari && (
              <span className="badge bg-label-primary font-mono">{selectedCari.code}</span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#modalCariSecSiparis"
          >
            <i className="ti ti-users me-1" /> Cari Seç
          </button>
          {selectedCari && (
            <button type="button" className="btn btn-label-secondary" onClick={() => setSelectedCari(null)}>
              <i className="ti ti-x me-1" /> Temizle
            </button>
          )}
        </div>
      </div>

      {selectedCari && (
        <CariInfoPanel
          cari={selectedCari}
          label={mode === 'alis' ? 'Tedarikçi Bilgileri' : 'Müşteri Bilgileri'}
        />
      )}

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label">Sipariş Tarihi</label>
                <input
                  type="date"
                  className="form-control"
                  value={documentDate}
                  onChange={(e) => {
                    setDocumentDate(e.target.value)
                    setDeliveryDate(addDaysIso(e.target.value, 30))
                  }}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Teslim Tarihi</label>
                <input
                  type="date"
                  className="form-control"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Depo</label>
                <select
                  className="form-select"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">Seçin...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Sipariş notu..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <hr className="my-4" />
            <h6 className="mb-3">Kalemler</h6>
            <div className="table-responsive overflow-visible">
              <table className="table table-sm table-no-search align-middle">
                <thead>
                  <tr>
                    <th style={{ minWidth: '14rem' }}>Stok</th>
                    <th>Ürün/Hizmet</th>
                    <th style={{ width: '6rem' }}>Miktar</th>
                    <th style={{ width: '8rem' }}>Birim Fiyat</th>
                    <th style={{ width: '6rem' }}>KDV</th>
                    <th style={{ width: '8rem' }}>Tutar</th>
                    <th style={{ width: '3rem' }} />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => {
                    const c = calcLine(line, taxRates)
                    return (
                      <tr key={line.key}>
                        <td className="align-middle">
                          <StokLineSearch
                            items={items}
                            selectedId={line.itemId}
                            priceMode={mode === 'alis' ? 'purchase' : 'sales'}
                            disabled={stkLoadingKey === line.key}
                            onSelect={(item) => handleStokSelect(line.key, item)}
                            onClear={() => handleStokClear(line.key)}
                          />
                        </td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            value={line.description}
                            onChange={(e) => updateLine(line.key, { description: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0.0001"
                            step="any"
                            className="form-control form-control-sm"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control form-control-sm"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                            required
                          />
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={line.taxRateId}
                            onChange={(e) =>
                              updateLine(line.key, { taxRateId: Number(e.target.value) })
                            }
                          >
                            {taxRates.map((t) => (
                              <option key={t.id} value={t.id}>
                                %{t.rate}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="align-middle">{formatTry(c.total)}</td>
                        <td className="align-middle">
                          {lines.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-icon btn-label-danger"
                              onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                            >
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
              <button
                type="button"
                className="btn btn-label-secondary"
                onClick={() => setLines((prev) => [...prev, newLine(units, taxRates)])}
              >
                <i className="ti ti-plus me-1" /> Kalem Ekle
              </button>
              <div className="text-end">
                <p className="mb-1">
                  Ara Toplam: <strong>{formatMoneyOptional(totals.subtotal)}</strong>
                </p>
                <p className="mb-1">
                  KDV: <strong>{formatMoneyOptional(totals.taxTotal)}</strong>
                </p>
                <h5 className="mb-0">Genel Toplam: {formatTry(totals.grandTotal)}</h5>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <Link to={listPath} className="btn btn-label-secondary">
                İptal
              </Link>
            </div>
          </div>
        </div>
      </form>

      <CariSecModal
        modalId="modalCariSecSiparis"
        description={
          mode === 'alis'
            ? 'Siparişe bağlamak istediğiniz tedarikçi cariyi listeden seçin.'
            : 'Siparişe bağlamak istediğiniz müşteri cariyi listeden seçin.'
        }
        cariler={cariler}
        loading={loading}
        accountTypeFilter={mode === 'alis' ? 'SUPPLIER' : 'CUSTOMER'}
        onSelect={setSelectedCari}
      />
    </div>
  )
}
