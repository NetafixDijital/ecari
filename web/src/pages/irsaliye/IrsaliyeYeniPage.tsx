import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import { fetchWarehouses } from '../../api/cfg'
import { fetchUnits, type LookupItem } from '../../api/core'
import { createDeliveryNote } from '../../api/dln'
import CariInfoPanel from '../../components/cari/CariInfoPanel'
import CariSecModal from '../../components/cari/CariSecModal'
import StokLineSearch from '../../components/stok/StokLineSearch'
import { fetchStkItem, fetchStkItems, type StkItemListItem } from '../../api/stk'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'

type LineDraft = {
  key: string
  itemId: number | ''
  description: string
  quantity: string
  unitId: number
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function newLine(units: LookupItem[]): LineDraft {
  return {
    key: crypto.randomUUID(),
    itemId: '',
    description: '',
    quantity: '1',
    unitId: units[0]?.id ?? 0,
  }
}

export default function IrsaliyeYeniPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('type') === 'alis' ? 'alis' : 'satis'
  const documentType = mode === 'alis' ? 'PURCHASE' : 'SALES'
  const listPath = mode === 'alis' ? '/irsaliye/alis' : '/irsaliye/satis'
  const title = mode === 'alis' ? 'Yeni Alış İrsaliyesi' : 'Yeni Satış İrsaliyesi'

  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [items, setItems] = useState<StkItemListItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<typeof fetchWarehouses>>>([])
  const [selectedCari, setSelectedCari] = useState<CariAccountListItem | null>(null)
  const [documentDate, setDocumentDate] = useState(todayIso())
  const [warehouseId, setWarehouseId] = useState<number | ''>('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stkLoadingKey, setStkLoadingKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchCariAccounts(), fetchStkItems(), fetchUnits(), fetchWarehouses()])
      .then(([cariData, stkData, unitData, whData]) => {
        setCariler(cariData)
        setItems(stkData)
        setUnits(unitData)
        setWarehouses(whData)
        setLines([newLine(unitData)])
        const defaultWh = whData.find((w) => w.isDefault) ?? whData[0]
        if (defaultWh) setWarehouseId(defaultWh.id)
      })
      .catch(() => setError('Form verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  }

  async function handleStokSelect(lineKey: string, item: StkItemListItem) {
    setStkLoadingKey(lineKey)
    try {
      const detail = await fetchStkItem(item.id)
      updateLine(lineKey, {
        itemId: item.id,
        description: item.name,
        unitId: detail.baseUnitId,
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
      setError('Cari hesap seçin.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createDeliveryNote({
        documentType,
        accountId: selectedCari.id,
        documentDate,
        warehouseId: warehouseId === '' ? null : Number(warehouseId),
        shippingAddress: shippingAddress.trim() || null,
        notes: notes.trim() || null,
        lines: lines.map((line) => ({
          itemId: line.itemId === '' ? null : Number(line.itemId),
          description: line.description.trim(),
          quantity: Number(line.quantity),
          unitId: line.unitId,
        })),
      })
      toast.success('Kayıt oluşturuldu', 'İrsaliye listeye eklendi.')
      navigate(listPath)
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'İrsaliye kaydedilemedi.')
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
          <h4 className="mb-1">{title}</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={listPath}>{mode === 'alis' ? 'Alış İrsaliye' : 'Satış İrsaliye'}</Link>
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
            data-bs-target="#modalCariSecIrsaliye"
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
                <label className="form-label">İrsaliye Tarihi</label>
                <input
                  type="date"
                  className="form-control"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  required
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
              <div className="col-md-4">
                <label className="form-label">Sevk Adresi</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Sevk adresi..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Notlar</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="İrsaliye notu..."
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
                    <th style={{ width: '8rem' }}>Birim</th>
                    <th style={{ width: '3rem' }} />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.key}>
                      <td className="align-middle">
                        <StokLineSearch
                          items={items}
                          selectedId={line.itemId}
                          priceMode={mode === 'alis' ? 'purchase' : 'sales'}
                          disabled={stkLoadingKey === line.key}
                          onSelect={(item) => handleStokSelect(line.key, item)}
                          onClear={() => updateLine(line.key, { itemId: '' })}
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
                          className="form-control form-control-sm"
                          min={0}
                          step="0.01"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                          required
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={line.unitId}
                          onChange={(e) => updateLine(line.key, { unitId: Number(e.target.value) })}
                        >
                          {units.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
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
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-label-primary"
              onClick={() => setLines((prev) => [...prev, newLine(units)])}
            >
              <i className="ti ti-plus me-1" /> Satır Ekle
            </button>
          </div>
          <div className="card-footer d-flex justify-content-end gap-2">
            <Link to={listPath} className="btn btn-label-secondary">
              İptal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </form>

      <CariSecModal
        modalId="modalCariSecIrsaliye"
        description={
          mode === 'alis'
            ? 'İrsaliyeye bağlamak istediğiniz tedarikçi cariyi seçin.'
            : 'İrsaliyeye bağlamak istediğiniz müşteri cariyi seçin.'
        }
        cariler={cariler}
        loading={loading}
        accountTypeFilter={mode === 'alis' ? 'SUPPLIER' : 'CUSTOMER'}
        onSelect={(cari) => setSelectedCari(cari)}
      />
    </div>
  )
}
