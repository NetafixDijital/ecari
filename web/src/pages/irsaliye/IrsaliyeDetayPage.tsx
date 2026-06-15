import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  convertDeliveryNoteToInvoice,
  deleteDeliveryNote,
  fetchDeliveryNote,
  type DlnDeliveryNoteDetail,
} from '../../api/dln'
import { apiErrorMessage } from '../../utils/apiError'
import { deliveryStatusBadge, formatDate, formatQuantity } from '../../utils/format'

export default function IrsaliyeDetayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const noteId = Number(id)
  const [item, setItem] = useState<DlnDeliveryNoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState(false)

  const loadItem = useCallback(() => {
    if (!noteId) return
    setLoading(true)
    setError('')
    fetchDeliveryNote(noteId)
      .then(setItem)
      .catch(() => setError('İrsaliye detayı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [noteId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  async function handleConvertInvoice() {
    if (!item) return
    setActing(true)
    setError('')
    try {
      const result = await convertDeliveryNoteToInvoice(item.id)
      navigate(`/fatura/onizleme/${result.invoiceId}`)
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Faturaya dönüştürülemedi.'))
    } finally {
      setActing(false)
    }
  }

  async function handleDelete() {
    if (!item || !window.confirm(`${item.documentNo} irsaliyesi silinsin mi?`)) return
    setActing(true)
    setError('')
    try {
      await deleteDeliveryNote(item.id)
      navigate(item.documentType === 'SALES' ? '/irsaliye/satis' : '/irsaliye/alis')
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'İrsaliye silinemedi.'))
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <div className="app-page-content"><p className="text-body-secondary">Yükleniyor...</p></div>
  }

  if (!item) {
    return (
      <div className="app-page-content">
        <div className="alert alert-danger">{error || 'Kayıt bulunamadı.'}</div>
        <Link to="/irsaliye/satis" className="btn btn-label-secondary">Listeye Dön</Link>
      </div>
    )
  }

  const badge = deliveryStatusBadge(item.statusKey)
  const listPath = item.documentType === 'SALES' ? '/irsaliye/satis' : '/irsaliye/alis'

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">İrsaliye Detayı</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/">Ana Sayfa</Link></li>
              <li className="breadcrumb-item"><Link to={listPath}>İrsaliye</Link></li>
              <li className="breadcrumb-item active">{item.documentNo}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button type="button" className="btn btn-label-success" disabled={acting} onClick={handleConvertInvoice}>
            Faturaya Dönüştür
          </button>
          <button type="button" className="btn btn-label-danger" disabled={acting} onClick={handleDelete}>
            Sil
          </button>
          <Link to={listPath} className="btn btn-label-secondary">Listeye Dön</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card mb-4">
        <div className="card-body row g-3">
          <div className="col-md-3"><div className="text-body-secondary small">İrsaliye No</div><div className="fw-medium">{item.documentNo}</div></div>
          <div className="col-md-3"><div className="text-body-secondary small">Cari</div><div>{item.accountTitle}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Tip</div><div>{item.documentType === 'SALES' ? 'Satış' : 'Alış'}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Tarih</div><div>{formatDate(item.documentDate)}</div></div>
          <div className="col-md-2"><div className="text-body-secondary small">Durum</div><span className={`badge ${badge.className}`}>{badge.label}</span></div>
          {item.warehouseName && (
            <div className="col-md-4"><div className="text-body-secondary small">Depo</div><div>{item.warehouseName}</div></div>
          )}
          {item.shippingAddress && (
            <div className="col-md-8"><div className="text-body-secondary small">Sevk Adresi</div><div>{item.shippingAddress}</div></div>
          )}
          {item.notes && (
            <div className="col-12"><div className="text-body-secondary small">Not</div><div>{item.notes}</div></div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">Kalemler</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr><th>#</th><th>Açıklama</th><th>Miktar</th></tr>
            </thead>
            <tbody>
              {item.lines.map((line) => (
                <tr key={line.lineNo}>
                  <td>{line.lineNo}</td>
                  <td>{line.description}</td>
                  <td>{formatQuantity(line.quantity)} {line.unitName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
