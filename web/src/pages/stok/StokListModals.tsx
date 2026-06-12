import type { LookupItem } from '../../api/core'
import type { CreateStkItemRequest, StkItemDetail, UpdateStkItemRequest } from '../../api/stk'
import StokFormModal from './StokFormModal'

interface StokListModalsProps {
  units: LookupItem[]
  editItem: StkItemDetail | null
  onEditClose: () => void
  onCreate: (body: CreateStkItemRequest) => Promise<void>
  onUpdate: (body: UpdateStkItemRequest) => Promise<void>
  creating: boolean
  updating: boolean
  createError: string
  updateError: string
}

export default function StokListModals({
  units,
  editItem,
  onEditClose,
  onCreate,
  onUpdate,
  creating,
  updating,
  createError,
  updateError,
}: StokListModalsProps) {
  return (
    <>
      <StokFormModal mode="create" item={null} units={units} onSubmit={onCreate} saving={creating} error={createError} />
      <StokFormModal
        mode="edit"
        item={editItem}
        units={units}
        onSubmit={onUpdate}
        saving={updating}
        error={updateError}
        onClose={onEditClose}
      />

      <div className="modal fade nl-modal-form" id="modalExcelStok" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <div className="pe-3">
                <h5 className="modal-title">Excel&apos;den Stok Aktar</h5>
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
              <p className="small text-body-secondary mt-3 mb-2">Beklenen sütunlar:</p>
              <p className="small text-body-secondary mb-0">Stok Kodu, Ürün Adı, Birim, Miktar, Alış, Satış</p>
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
    </>
  )
}
