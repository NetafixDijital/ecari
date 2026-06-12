import { useMemo, useState } from 'react'
import type { CariAccountListItem } from '../../api/cari'
import { displayTaxId, formatCariBalance, personTypeBadge } from '../../utils/format'

type CariSecModalProps = {
  modalId: string
  description: string
  cariler: CariAccountListItem[]
  loading: boolean
  accountTypeFilter?: 'CUSTOMER' | 'SUPPLIER'
  onSelect: (cari: CariAccountListItem) => void
}

export function closeCariSecModal(modalId: string) {
  const el = document.getElementById(modalId)
  if (el && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(el).hide()
}

export default function CariSecModal({
  modalId,
  description,
  cariler,
  loading,
  accountTypeFilter,
  onSelect,
}: CariSecModalProps) {
  const [modalSearch, setModalSearch] = useState('')

  const filteredCariler = useMemo(() => {
    let list = cariler
    if (accountTypeFilter) {
      const typed = list.filter((c) => c.accountType === accountTypeFilter)
      if (typed.length > 0) list = typed
    }
    const q = modalSearch.trim().toLowerCase()
    if (!q) return list
    return list.filter((c) =>
      [c.code, c.title, displayTaxId(c), c.phone, c.email].filter(Boolean).join(' ').toLowerCase().includes(q),
    )
  }, [cariler, accountTypeFilter, modalSearch])

  function handleSelect(cari: CariAccountListItem) {
    onSelect(cari)
    closeCariSecModal(modalId)
    setModalSearch('')
  }

  return (
    <div className="modal fade nl-modal-form" id={modalId} tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div className="pe-3">
              <h5 className="modal-title">Cari Seç</h5>
              <p className="modal-desc mb-0">{description}</p>
            </div>
            <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" />
          </div>
          <div className="modal-body pt-2">
            <div className="mb-3">
              <div className="nl-field-icon">
                <span className="nl-field-icon__icon">
                  <i className="ti ti-search" />
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Cari kodu, ünvan veya VKN ile ara..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="table-responsive rounded-3 border">
              <table className="table table-hover mb-0 nl-cari-sec-table">
                <thead className="table-light">
                  <tr>
                    <th>Kod</th>
                    <th>Tip</th>
                    <th>Ünvan</th>
                    <th>VKN/TCKN</th>
                    <th className="text-end">Bakiye</th>
                    <th className="text-end" style={{ width: '5rem' }} />
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-body-secondary">
                        Yükleniyor…
                      </td>
                    </tr>
                  )}
                  {!loading && filteredCariler.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-body-secondary">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredCariler.map((row) => {
                      const tip = personTypeBadge(row.personType)
                      const balance = formatCariBalance(row.balance, row.balanceSide)
                      return (
                        <tr key={row.id}>
                          <td className="font-mono">{row.code}</td>
                          <td>
                            <span className={`badge ${tip.className}`}>{tip.label}</span>
                          </td>
                          <td>{row.title}</td>
                          <td>{displayTaxId(row)}</td>
                          <td className="text-end">
                            <span className={balance.className}>{balance.text}</span>
                          </td>
                          <td className="text-end">
                            <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSelect(row)}>
                              Seç
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
