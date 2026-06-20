import { useEffect, useMemo, useState } from 'react'
import type { OrdOrderDetail } from '../../api/ord'
import { formatQuantity, formatTry } from '../../utils/format'

type ConvertMode = 'invoice' | 'delivery-note'

type LineSelection = {
  lineId: number
  selected: boolean
  quantity: string
}

export default function SiparisConvertModal({
  modalId,
  mode,
  order,
  acting,
  error,
  onSubmit,
}: {
  modalId: string
  mode: ConvertMode | null
  order: OrdOrderDetail | null
  acting: boolean
  error: string
  onSubmit: (lines: Array<{ lineId: number; quantity: number }>) => void
}) {
  const [selections, setSelections] = useState<LineSelection[]>([])

  useEffect(() => {
    if (!order || !mode) {
      setSelections([])
      return
    }

    setSelections(
      order.lines
        .filter((line) =>
          mode === 'invoice'
            ? line.remainingInvoiceQuantity > 0
            : line.remainingDeliveryQuantity > 0,
        )
        .map((line) => ({
          lineId: line.id,
          selected: true,
          quantity: String(
            mode === 'invoice' ? line.remainingInvoiceQuantity : line.remainingDeliveryQuantity,
          ),
        })),
    )
  }, [order, mode])

  const title =
    mode === 'invoice' ? 'Faturaya Dönüştür — Kalem Seçimi' : 'İrsaliyeye Dönüştür — Kalem Seçimi'

  const lineMap = useMemo(() => {
    const map = new Map<number, OrdOrderDetail['lines'][number]>()
    order?.lines.forEach((line) => map.set(line.id, line))
    return map
  }, [order])

  function handleSubmit() {
    const payload = selections
      .filter((row) => row.selected)
      .map((row) => ({
        lineId: row.lineId,
        quantity: Number(row.quantity),
      }))
      .filter((row) => row.quantity > 0)

    onSubmit(payload)
  }

  return (
    <div className="modal fade nl-modal-form" id={modalId} tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <div className="pe-3">
              <h5 className="modal-title">{title}</h5>
              <p className="modal-desc mb-0">Dönüştürülecek kalemleri ve miktarları seçin.</p>
            </div>
            <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '3rem' }} />
                    <th>Ürün/Hizmet</th>
                    <th>Kalan</th>
                    <th style={{ width: '8rem' }}>Miktar</th>
                  </tr>
                </thead>
                <tbody>
                  {selections.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-body-secondary py-3">
                        Dönüştürülecek kalem kalmadı.
                      </td>
                    </tr>
                  )}
                  {selections.map((row) => {
                    const line = lineMap.get(row.lineId)
                    if (!line) return null
                    const remaining =
                      mode === 'invoice'
                        ? line.remainingInvoiceQuantity
                        : line.remainingDeliveryQuantity
                    return (
                      <tr key={row.lineId}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={row.selected}
                            onChange={(e) =>
                              setSelections((prev) =>
                                prev.map((item) =>
                                  item.lineId === row.lineId
                                    ? { ...item, selected: e.target.checked }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                        <td>{line.description}</td>
                        <td>
                          {formatQuantity(remaining)} {line.unitName}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0.0001"
                            max={remaining}
                            step="any"
                            className="form-control form-control-sm"
                            value={row.quantity}
                            disabled={!row.selected}
                            onChange={(e) =>
                              setSelections((prev) =>
                                prev.map((item) =>
                                  item.lineId === row.lineId
                                    ? { ...item, quantity: e.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {order && (
              <p className="small text-body-secondary mt-3 mb-0">
                Sipariş toplamı: <strong>{formatTry(order.grandTotal)}</strong>
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
              İptal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={acting || selections.every((row) => !row.selected)}
              onClick={handleSubmit}
            >
              {acting ? 'İşleniyor...' : 'Dönüştür'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
