import { useEffect, useState } from 'react'
import { fetchActiveWarehouses, type Warehouse } from '../../api/cfg'
import { createStkManualMovement, type StkItemListItem } from '../../api/stk'
import { apiErrorMessage } from '../../utils/apiError'

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export default function StokMovementModal({
  item,
  onSaved,
}: {
  item: StkItemListItem | null
  onSaved: () => void
}) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [warehouseId, setWarehouseId] = useState<number | ''>('')
  const [movementType, setMovementType] = useState<MovementType>('IN')
  const [quantity, setQuantity] = useState('1')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActiveWarehouses()
      .then((data) => {
        setWarehouses(data)
        const defaultWh = data.find((w) => w.isDefault) ?? data[0]
        if (defaultWh) setWarehouseId(defaultWh.id)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!item) {
      setQuantity('1')
      setDescription('')
      setMovementType('IN')
      setError('')
    }
  }, [item])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!item || !warehouseId) return

    setSaving(true)
    setError('')
    try {
      await createStkManualMovement({
        itemId: item.id,
        warehouseId: Number(warehouseId),
        movementType,
        quantity: Number(quantity),
        description: description.trim() || undefined,
      })
      onSaved()
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Stok hareketi kaydedilemedi.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal fade nl-modal-form" id="modalStokHareket" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <div className="pe-3">
                <h5 className="modal-title">Stok Hareketi</h5>
                <p className="modal-desc mb-0">{item ? `${item.code} — ${item.name}` : 'Stok seçilmedi'}</p>
              </div>
              <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Hareket Tipi</label>
                <select
                  className="form-select"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as MovementType)}
                >
                  <option value="IN">Stok Girişi</option>
                  <option value="OUT">Stok Çıkışı</option>
                  <option value="ADJUSTMENT">Manuel Düzeltme</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Depo</label>
                <select
                  className="form-select"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Seçin...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  {movementType === 'ADJUSTMENT' ? 'Düzeltme Miktarı (+/-)' : 'Miktar'}
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Açıklama</label>
                <input className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                İptal
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !item}>
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

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

export function openStokMovementModal(item: StkItemListItem, setItem: (item: StkItemListItem) => void) {
  setItem(item)
  openModal('modalStokHareket')
}

export function closeStokMovementModal() {
  closeModal('modalStokHareket')
}
