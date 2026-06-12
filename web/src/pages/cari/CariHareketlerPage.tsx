import { useCallback, useEffect, useState } from 'react'
import { fetchCariAccounts, fetchCariMovements, type CariAccountListItem, type CariMovementListItem } from '../../api/cari'
import CariSecModal from '../../components/cari/CariSecModal'
import TableSearchToolbar from '../../components/ui/TableSearchToolbar'
import { formatDate, formatTry } from '../../utils/format'

export default function CariHareketlerPage() {
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [movements, setMovements] = useState<CariMovementListItem[]>([])
  const [selected, setSelected] = useState<CariAccountListItem | null>(null)
  const [tableSearch, setTableSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [movementsLoading, setMovementsLoading] = useState(false)

  const loadCariler = useCallback(() => {
    setLoading(true)
    fetchCariAccounts()
      .then(setCariler)
      .finally(() => setLoading(false))
  }, [])

  const loadMovements = useCallback((accountId?: number, search?: string) => {
    setMovementsLoading(true)
    fetchCariMovements(accountId, search)
      .then(setMovements)
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false))
  }, [])

  useEffect(() => {
    loadCariler()
  }, [loadCariler])

  useEffect(() => {
    if (!selected) {
      setMovements([])
      return
    }
    loadMovements(selected.id, tableSearch || undefined)
  }, [selected, tableSearch, loadMovements])

  return (
    <div className="app-page-content">
      <div className="page-header d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <h4 className="mb-0">Cari Hareketler</h4>
        <div className="d-flex align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-body">
            <i className="ti ti-user text-primary" />
            <span className="small text-body-secondary">Seçili:</span>
            <span className="fw-medium">{selected ? selected.title : 'Tüm cariler'}</span>
            {selected && <span className="badge bg-label-primary font-mono">{selected.code}</span>}
          </div>
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalCariSec">
            <i className="ti ti-users me-1" /> Cari Seç
          </button>
          {selected && (
            <button type="button" className="btn btn-label-secondary" onClick={() => setSelected(null)}>
              <i className="ti ti-x me-1" /> Temizle
            </button>
          )}
        </div>
      </div>

      <div className="card datatables-toolbar-hidden">
        <TableSearchToolbar placeholder="Hareket ara..." onSearch={setTableSearch} />
        <div className="table-responsive">
          <table className="table table-hover datatables-ajax mb-0">
            <thead className="border-top">
              <tr>
                <th>Tarih</th>
                <th>Cari</th>
                <th>İşlem</th>
                <th className="text-end">Borç</th>
                <th className="text-end">Alacak</th>
                <th className="text-end">Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {!selected && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Hareketleri görüntülemek için bir cari seçin.
                  </td>
                </tr>
              )}
              {selected && movementsLoading && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {selected && !movementsLoading && movements.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-body-secondary py-4">
                    Hareket kaydı bulunamadı.
                  </td>
                </tr>
              )}
              {selected &&
                !movementsLoading &&
                movements.map((m) => (
                  <tr key={m.id}>
                    <td>{formatDate(m.movementDate)}</td>
                    <td>{m.accountTitle}</td>
                    <td>{m.movementTypeLabel}</td>
                    <td className="text-end">{m.debit > 0 ? formatTry(m.debit) : '—'}</td>
                    <td className="text-end">{m.credit > 0 ? formatTry(m.credit) : '—'}</td>
                    <td className="text-end">{formatTry(m.runningBalance)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <CariSecModal
        modalId="modalCariSec"
        description="Hareketlerini görüntülemek istediğiniz cariyi listeden seçin."
        cariler={cariler}
        loading={loading}
        onSelect={setSelected}
      />
    </div>
  )
}
