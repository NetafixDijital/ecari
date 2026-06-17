import { type FormEvent, useEffect, useState } from 'react'
import type { LookupItem, TaxRate } from '../../api/core'
import type { CreateStkItemRequest, StkItemDetail, UpdateStkItemRequest } from '../../api/stk'

type StokFormModalProps =
  | {
      mode: 'create'
      item: null
      units: LookupItem[]
      taxRates: TaxRate[]
      onSubmit: (body: CreateStkItemRequest) => Promise<void>
      saving: boolean
      error: string
    }
  | {
      mode: 'edit'
      item: StkItemDetail | null
      units: LookupItem[]
      taxRates: TaxRate[]
      onSubmit: (body: UpdateStkItemRequest) => Promise<void>
      saving: boolean
      error: string
      onClose: () => void
    }

export default function StokFormModal(props: StokFormModalProps) {
  const { units, taxRates, saving, error } = props
  const isEdit = props.mode === 'edit'

  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [baseUnitId, setBaseUnitId] = useState<number | ''>('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salesPrice, setSalesPrice] = useState('')
  const [taxRateId, setTaxRateId] = useState<number | ''>('')
  const [isActive, setIsActive] = useState(true)

  const modalId = isEdit ? 'modalDuzenleStok' : 'modalYeniStok'
  const title = isEdit ? 'Stok Düzenle' : 'Yeni Stok Ekle'
  const desc = isEdit
    ? 'Stok kartı bilgilerini güncelleyin.'
    : 'Stok kartı bilgilerini girin. Kayıt sonrası stok listesine eklenir.'

  useEffect(() => {
    if (!isEdit) {
      if (units.length > 0 && baseUnitId === '') {
        const adet = units.find((u) => u.code === 'ADET') ?? units[0]
        setBaseUnitId(adet.id)
      }
      if (taxRates.length > 0 && taxRateId === '') {
        const defaultRate = taxRates.find((t) => t.rate === 20) ?? taxRates[0]
        setTaxRateId(defaultRate.id)
      }
      return
    }
    if (!props.item) return
    const d = props.item
    setName(d.name)
    setBarcode(d.barcode ?? '')
    setBaseUnitId(d.baseUnitId)
    setPurchasePrice(d.purchasePrice != null ? String(d.purchasePrice) : '')
    setSalesPrice(d.salesPrice != null ? String(d.salesPrice) : '')
    setTaxRateId(d.taxRateId)
    setIsActive(d.isActive)
  }, [isEdit, props.item, units, baseUnitId, taxRates, taxRateId])

  useEffect(() => {
    if (!isEdit) {
      const el = document.getElementById('modalYeniStok')
      if (!el) return
      const reset = () => {
        setName('')
        setBarcode('')
        setPurchasePrice('')
        setSalesPrice('')
        setIsActive(true)
        if (units.length > 0) {
          const adet = units.find((u) => u.code === 'ADET') ?? units[0]
          setBaseUnitId(adet.id)
        }
      }
      el.addEventListener('show.bs.modal', reset)
      return () => el.removeEventListener('show.bs.modal', reset)
    }
    if (!props.item) return
    const el = document.getElementById('modalDuzenleStok')
    if (!el || !window.bootstrap) return
    window.bootstrap.Modal.getOrCreateInstance(el).show()
    const onHidden = () => props.onClose()
    el.addEventListener('hidden.bs.modal', onHidden)
    return () => el.removeEventListener('hidden.bs.modal', onHidden)
  }, [isEdit, props, units])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      if (isEdit) {
        await props.onSubmit({
          name: name.trim(),
          barcode: barcode.trim() || undefined,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          salesPrice: salesPrice ? Number(salesPrice) : undefined,
          taxRateId: taxRateId === '' ? undefined : taxRateId,
          isActive,
        })
      } else {
        await props.onSubmit({
          name: name.trim(),
          barcode: barcode.trim() || undefined,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          salesPrice: salesPrice ? Number(salesPrice) : undefined,
          baseUnitId: baseUnitId === '' ? undefined : baseUnitId,
          taxRateId: taxRateId === '' ? undefined : taxRateId,
        })
        setName('')
        setBarcode('')
        setPurchasePrice('')
        setSalesPrice('')
      }
      const el = document.getElementById(modalId)
      if (el && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(el).hide()
    } catch {
      /* üst bileşen */
    }
  }

  const unitName =
    isEdit && props.item
      ? units.find((u) => u.id === props.item!.baseUnitId)?.name ?? '—'
      : undefined

  return (
    <div className="modal fade nl-modal-form" id={modalId} tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div className="pe-3">
              <h5 className="modal-title">{title}</h5>
              <p className="modal-desc mb-0">
                {isEdit && props.item ? (
                  <>
                    <span className="font-mono">{props.item.code}</span> — {desc}
                  </>
                ) : (
                  desc
                )}
              </p>
            </div>
            <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <div className="form-section">
                <div className="form-section-title">Stok Bilgileri</div>
                <div className="row g-3">
                  {isEdit && props.item && (
                    <div className="col-md-4">
                      <label className="form-label">Stok Kodu</label>
                      <input type="text" className="form-control font-mono" value={props.item.code} readOnly disabled />
                    </div>
                  )}
                  {!isEdit && (
                    <div className="col-md-4">
                      <label className="form-label">Stok Kodu</label>
                      <input type="text" className="form-control font-mono" value="Otomatik" readOnly disabled />
                      <div className="form-text">Kod kayıt sırasında otomatik atanır.</div>
                    </div>
                  )}
                  <div className={isEdit ? 'col-md-8' : 'col-md-8'}>
                    <label className="form-label">
                      Ürün Adı <span className="text-danger">*</span>
                    </label>
                    <div className="nl-field-icon">
                      <span className="nl-field-icon__icon">
                        <i className="ti ti-package" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Birim</label>
                    {isEdit ? (
                      <input type="text" className="form-control" value={unitName} readOnly disabled />
                    ) : (
                      <select
                        className="form-select"
                        value={baseUnitId}
                        onChange={(e) => setBaseUnitId(Number(e.target.value))}
                        disabled={saving}
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">KDV Oranı</label>
                    <select
                      className="form-select"
                      value={taxRateId}
                      onChange={(e) => setTaxRateId(Number(e.target.value))}
                      disabled={saving || taxRates.length === 0}
                    >
                      {taxRates.map((t) => (
                        <option key={t.id} value={t.id}>
                          %{t.rate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Barkod</label>
                    <input
                      type="text"
                      className="form-control"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  {isEdit && (
                    <div className="col-md-4">
                      <label className="form-label">Miktar</label>
                      <input
                        type="text"
                        className="form-control"
                        value={props.item?.stockQuantity ?? 0}
                        readOnly
                        disabled
                      />
                      <div className="form-text">Miktar depo hareketleri ile güncellenir.</div>
                    </div>
                  )}
                  {isEdit && (
                    <div className="col-md-4">
                      <div className="form-check form-switch mt-4">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="stokAktif"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          disabled={saving}
                        />
                        <label className="form-check-label" htmlFor="stokAktif">
                          Aktif stok
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title">Fiyat Bilgileri</div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Alış Fiyatı (₺)</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      step={0.01}
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Satış Fiyatı (₺)</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      step={0.01}
                      value={salesPrice}
                      onChange={(e) => setSalesPrice(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal" disabled={saving}>
                İptal
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
                <i className={`ti ${isEdit ? 'ti-device-floppy' : 'ti-plus'} me-1`} />
                {saving ? 'Kaydediliyor…' : isEdit ? 'Kaydet' : 'Stok Ekle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
