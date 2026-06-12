import { cariCreditBalanceAmount, cariDebtBalanceAmount, formatTry } from '../../utils/format'
import type { City, PaymentTerm } from '../../api/core'
import type { CariAccountListItem, CreateCariAccountRequest } from '../../api/cari'
import type { BnkAccountListItem } from '../../api/bnk'
import type { CshAccountListItem } from '../../api/csh'

export type TahsilatPaymentMethod = 'CASH' | 'BANK' | 'CHECK'
import YeniCariModal from './YeniCariModal'

export type PaymentModalState = {
  type: 'tahsilat' | 'tediye'
  cari: CariAccountListItem
}

export type VirmanModalState = {
  source: CariAccountListItem
}

interface CariListModalsProps {
  cities: City[]
  paymentTerms: PaymentTerm[]
  onCreate: (body: CreateCariAccountRequest) => Promise<void>
  creating: boolean
  createError: string
  kasaAccounts: CshAccountListItem[]
  bankAccounts: BnkAccountListItem[]
  paymentModal: PaymentModalState | null
  paymentAmount: string
  paymentMethod: TahsilatPaymentMethod
  paymentCashAccountId: number | ''
  paymentBankAccountId: number | ''
  checkInstrumentNo: string
  checkBankName: string
  checkDueDate: string
  paymentDescription: string
  paymentDate: string
  paymentSaving: boolean
  paymentError: string
  onPaymentAmountChange: (value: string) => void
  onPaymentMethodChange: (value: TahsilatPaymentMethod) => void
  onPaymentCashAccountChange: (value: number | '') => void
  onPaymentBankAccountChange: (value: number | '') => void
  onCheckInstrumentNoChange: (value: string) => void
  onCheckBankNameChange: (value: string) => void
  onCheckDueDateChange: (value: string) => void
  onPaymentDescriptionChange: (value: string) => void
  onPaymentDateChange: (value: string) => void
  onPaymentSubmit: () => void
  virmanModal: VirmanModalState | null
  virmanTargetId: number | ''
  virmanAmount: string
  virmanDescription: string
  virmanTargetOptions: CariAccountListItem[]
  virmanSaving: boolean
  virmanError: string
  onVirmanTargetChange: (value: number | '') => void
  onVirmanAmountChange: (value: string) => void
  onVirmanDescriptionChange: (value: string) => void
  onVirmanSubmit: () => void
  reportMovements: Array<{
    id: number
    movementDate: string
    movementTypeLabel: string
    description: string | null
    debit: number
    credit: number
    runningBalance: number
  }>
  reportLoading: boolean
}

export default function CariListModals({
  cities,
  paymentTerms,
  onCreate,
  creating,
  createError,
  kasaAccounts,
  bankAccounts,
  paymentModal,
  paymentAmount,
  paymentMethod,
  paymentCashAccountId,
  paymentBankAccountId,
  checkInstrumentNo,
  checkBankName,
  checkDueDate,
  paymentDescription,
  paymentDate,
  paymentSaving,
  paymentError,
  onPaymentAmountChange,
  onPaymentMethodChange,
  onPaymentCashAccountChange,
  onPaymentBankAccountChange,
  onCheckInstrumentNoChange,
  onCheckBankNameChange,
  onCheckDueDateChange,
  onPaymentDescriptionChange,
  onPaymentDateChange,
  onPaymentSubmit,
  virmanModal,
  virmanTargetId,
  virmanAmount,
  virmanDescription,
  virmanTargetOptions,
  virmanSaving,
  virmanError,
  onVirmanTargetChange,
  onVirmanAmountChange,
  onVirmanDescriptionChange,
  onVirmanSubmit,
  reportMovements,
  reportLoading,
}: CariListModalsProps) {
  const tahsilatCari = paymentModal?.type === 'tahsilat' ? paymentModal.cari : null
  const tediyeCari = paymentModal?.type === 'tediye' ? paymentModal.cari : null

  return (
    <>
      <YeniCariModal
        cities={cities}
        paymentTerms={paymentTerms}
        onCreate={onCreate}
        creating={creating}
        createError={createError}
      />

      <div className="modal fade nl-modal-form" id="modalExcelCari" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="pe-3">
                <h5 className="modal-title">Excel&apos;den Cari Aktar</h5>
                <p className="modal-desc mb-0">.xlsx, .xls veya .csv dosyanızı yükleyin. İlk satır sütun başlıkları olmalıdır.</p>
              </div>
              <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              <div className="nl-excel-dropzone" role="button" tabIndex={0}>
                <i className="ti ti-file-spreadsheet" />
                <p className="mb-1 fw-medium">Dosyayı sürükleyin veya tıklayarak seçin</p>
                <p className="file-name mb-0 text-body-secondary small">Yakında</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                İptal
              </button>
              <button type="button" className="btn btn-primary" disabled>
                <i className="ti ti-upload me-1" /> İçe Aktar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalTahsilat" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-cash me-2 text-success" />
                Tahsilat
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {tahsilatCari && (
                <p className="text-body-secondary small mb-3">
                  Cari: <strong>{tahsilatCari.title}</strong> ({tahsilatCari.code})
                  <span className="ms-2">
                    Borç bakiyesi:{' '}
                    <span className={cariDebtBalanceAmount(tahsilatCari.balance) > 0 ? 'text-success fw-semibold' : ''}>
                      {formatTry(cariDebtBalanceAmount(tahsilatCari.balance))}
                    </span>
                  </span>
                </p>
              )}
              {paymentError && <div className="alert alert-danger py-2">{paymentError}</div>}
              <div className="mb-3">
                <label className="form-label">Tutar (₺)</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    step="0.01"
                    min={0}
                    placeholder="0,00"
                    value={paymentAmount}
                    onChange={(e) => onPaymentAmountChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    title="Cari borç bakiyesini tutar alanına yaz"
                    disabled={!tahsilatCari || cariDebtBalanceAmount(tahsilatCari.balance) <= 0}
                    onClick={() => {
                      if (!tahsilatCari) return
                      const amount = cariDebtBalanceAmount(tahsilatCari.balance)
                      onPaymentAmountChange(amount > 0 ? String(amount) : '')
                    }}
                  >
                    Bakiyesini aktar
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Ödeme Yöntemi</label>
                <div className="d-flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'CASH', label: 'Kasa', icon: 'ti-cash' },
                      { value: 'BANK', label: 'Banka', icon: 'ti-building-bank' },
                      { value: 'CHECK', label: 'Çek / Senet', icon: 'ti-file-check' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`btn btn-sm ${paymentMethod === opt.value ? 'btn-success' : 'btn-outline-secondary'}`}
                      onClick={() => onPaymentMethodChange(opt.value)}
                    >
                      <i className={`ti ${opt.icon} me-1`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {paymentMethod === 'CASH' && (
                <div className="mb-3">
                  <label className="form-label">Kasa</label>
                  <select
                    className="form-select"
                    value={paymentCashAccountId}
                    onChange={(e) =>
                      onPaymentCashAccountChange(e.target.value ? Number(e.target.value) : '')
                    }
                  >
                    <option value="">Seçin...</option>
                    {kasaAccounts.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {paymentMethod === 'BANK' && (
                <div className="mb-3">
                  <label className="form-label">Banka Hesabı</label>
                  <select
                    className="form-select"
                    value={paymentBankAccountId}
                    onChange={(e) =>
                      onPaymentBankAccountChange(e.target.value ? Number(e.target.value) : '')
                    }
                  >
                    <option value="">Seçin...</option>
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} — {b.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {paymentMethod === 'CHECK' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Çek / Senet No</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="CHK-2026-0001"
                      value={checkInstrumentNo}
                      onChange={(e) => onCheckInstrumentNoChange(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Banka</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Banka adı"
                      value={checkBankName}
                      onChange={(e) => onCheckBankNameChange(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Vade Tarihi</label>
                    <input
                      type="date"
                      className="form-control"
                      value={checkDueDate}
                      onChange={(e) => onCheckDueDateChange(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="mb-3">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Tahsilat açıklaması"
                  value={paymentDescription}
                  onChange={(e) => onPaymentDescriptionChange(e.target.value)}
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Tarih</label>
                <input
                  type="date"
                  className="form-control"
                  value={paymentDate}
                  onChange={(e) => onPaymentDateChange(e.target.value)}
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
                disabled={paymentSaving || paymentModal?.type !== 'tahsilat'}
                onClick={onPaymentSubmit}
              >
                {paymentSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalTediye" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-cash-off me-2 text-danger" />
                Tediye
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {tediyeCari && (
                <p className="text-body-secondary small mb-3">
                  Cari: <strong>{tediyeCari.title}</strong> ({tediyeCari.code})
                  <span className="ms-2">
                    Alacak bakiyesi:{' '}
                    <span className={cariCreditBalanceAmount(tediyeCari.balance) > 0 ? 'text-danger fw-semibold' : ''}>
                      {formatTry(cariCreditBalanceAmount(tediyeCari.balance))}
                    </span>
                  </span>
                </p>
              )}
              {paymentError && <div className="alert alert-danger py-2">{paymentError}</div>}
              <div className="mb-3">
                <label className="form-label">Tutar (₺)</label>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    step="0.01"
                    min={0}
                    placeholder="0,00"
                    value={paymentAmount}
                    onChange={(e) => onPaymentAmountChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    title="Cari alacak bakiyesini tutar alanına yaz"
                    disabled={!tediyeCari || cariCreditBalanceAmount(tediyeCari.balance) <= 0}
                    onClick={() => {
                      if (!tediyeCari) return
                      const amount = cariCreditBalanceAmount(tediyeCari.balance)
                      onPaymentAmountChange(amount > 0 ? String(amount) : '')
                    }}
                  >
                    Bakiyesini aktar
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Kasa</label>
                <select
                  className="form-select"
                  value={paymentCashAccountId}
                  onChange={(e) =>
                    onPaymentCashAccountChange(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Seçin...</option>
                  {kasaAccounts.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Tediye açıklaması"
                  value={paymentDescription}
                  onChange={(e) => onPaymentDescriptionChange(e.target.value)}
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Tarih</label>
                <input
                  type="date"
                  className="form-control"
                  value={paymentDate}
                  onChange={(e) => onPaymentDateChange(e.target.value)}
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
                disabled={paymentSaving || paymentModal?.type !== 'tediye'}
                onClick={onPaymentSubmit}
              >
                {paymentSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalVirman" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-arrows-exchange me-2 text-primary" />
                Virman
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              {virmanModal && (
                <p className="text-body-secondary small mb-3">
                  Kaynak: <strong>{virmanModal.source.title}</strong> ({virmanModal.source.code})
                </p>
              )}
              {virmanError && <div className="alert alert-danger py-2">{virmanError}</div>}
              <div className="mb-3">
                <label className="form-label">Hedef Cari</label>
                <select
                  className="form-select"
                  value={virmanTargetId}
                  onChange={(e) =>
                    onVirmanTargetChange(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Seçin...</option>
                  {virmanTargetOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Tutar (₺)</label>
                <input
                  type="number"
                  className="form-control"
                  step="0.01"
                  min={0}
                  placeholder="0,00"
                  value={virmanAmount}
                  onChange={(e) => onVirmanAmountChange(e.target.value)}
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Virman açıklaması"
                  value={virmanDescription}
                  onChange={(e) => onVirmanDescriptionChange(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                İptal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={virmanSaving || !virmanModal}
                onClick={onVirmanSubmit}
              >
                {virmanSaving ? 'Kaydediliyor...' : 'Virman Yap'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" id="modalHareketRaporu" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="ti ti-report-analytics me-2 text-info" />
                Hareket Raporu
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table table-sm table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Tarih</th>
                      <th>İşlem</th>
                      <th>Açıklama</th>
                      <th className="text-end">Borç</th>
                      <th className="text-end">Alacak</th>
                      <th className="text-end">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportLoading && (
                      <tr>
                        <td colSpan={6} className="text-center text-body-secondary py-4">
                          Yükleniyor...
                        </td>
                      </tr>
                    )}
                    {!reportLoading && reportMovements.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-body-secondary py-4">
                          Hareket kaydı bulunamadı.
                        </td>
                      </tr>
                    )}
                    {!reportLoading &&
                      reportMovements.map((m) => (
                        <tr key={m.id}>
                          <td>{m.movementDate}</td>
                          <td>{m.movementTypeLabel}</td>
                          <td>{m.description || '—'}</td>
                          <td className="text-end">{m.debit > 0 ? m.debit.toFixed(2) : '—'}</td>
                          <td className="text-end">{m.credit > 0 ? m.credit.toFixed(2) : '—'}</td>
                          <td className="text-end">{m.runningBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal">
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
