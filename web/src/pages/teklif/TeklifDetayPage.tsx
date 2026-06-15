import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  convertQuotationToOrder,
  deleteQuotation,
  fetchQuotation,
  type QotQuotationDetail,
} from '../../api/qot'
import {
  formatDate,
  formatMoneyOptional,
  formatQuantity,
  formatTry,
  quotationStatusBadge,
} from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'

export default function TeklifDetayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const quotationId = Number(id)
  const [item, setItem] = useState<QotQuotationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const loadItem = useCallback(() => {
    if (!quotationId) return
    setLoading(true)
    setError('')
    fetchQuotation(quotationId)
      .then(setItem)
      .catch(() => setError('Teklif detayı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [quotationId])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  async function handleConvert() {
    if (!quotationId) return
    setBusy(true)
    setError('')
    try {
      const result = await convertQuotationToOrder(quotationId)
      toast.success('Sipariş oluşturuldu', result.orderDocumentNo)
      navigate('/siparis')
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Siparişe dönüştürülemedi.')
      setError(message)
      toast.error('Dönüşüm başarısız', message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!quotationId || !confirm('Bu teklifi silmek istediğinize emin misiniz?')) return
    setBusy(true)
    setError('')
    try {
      await deleteQuotation(quotationId)
      toast.success('Silindi', 'Teklif kaydı kaldırıldı.')
      navigate('/teklif')
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Teklif silinemedi.')
      setError(message)
      toast.error('Silme başarısız', message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="app-page-content">
        <p className="text-body-secondary">Yükleniyor...</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="app-page-content">
        <div className="alert alert-danger">{error || 'Teklif bulunamadı.'}</div>
        <Link to="/teklif" className="btn btn-label-secondary">
          Listeye Dön
        </Link>
      </div>
    )
  }

  const badge = quotationStatusBadge(item.statusKey)
  const canConvert = item.statusKey !== 'donusturuldu' && item.statusKey !== 'iptal'

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Teklif Detayı</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/teklif">Teklif</Link>
              </li>
              <li className="breadcrumb-item active">{item.documentNo}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {canConvert && (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={handleConvert}>
              Siparişe Dönüştür
            </button>
          )}
          {item.statusKey !== 'donusturuldu' && (
            <button type="button" className="btn btn-label-danger" disabled={busy} onClick={handleDelete}>
              Sil
            </button>
          )}
          <Link to="/teklif" className="btn btn-label-secondary">
            Listeye Dön
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="text-body-secondary small">Teklif No</div>
              <div className="fw-medium">{item.documentNo}</div>
            </div>
            <div className="col-md-3">
              <div className="text-body-secondary small">Cari</div>
              <div className="fw-medium">{item.accountTitle}</div>
            </div>
            <div className="col-md-2">
              <div className="text-body-secondary small">Tarih</div>
              <div>{formatDate(item.documentDate)}</div>
            </div>
            <div className="col-md-2">
              <div className="text-body-secondary small">Geçerlilik</div>
              <div>{formatDate(item.validUntil)}</div>
            </div>
            <div className="col-md-2">
              <div className="text-body-secondary small">Durum</div>
              <span className={`badge ${badge.className}`}>{badge.label}</span>
            </div>
            {item.convertedOrderId && (
              <div className="col-12">
                <span className="badge bg-label-primary">Sipariş #{item.convertedOrderId}</span>
              </div>
            )}
            {item.notes && (
              <div className="col-12">
                <div className="text-body-secondary small">Not</div>
                <div>{item.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Kalemler</div>
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Açıklama</th>
                <th>Miktar</th>
                <th>Birim Fiyat</th>
                <th>KDV</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {item.lines.map((line) => (
                <tr key={line.lineNo}>
                  <td>{line.lineNo}</td>
                  <td>{line.description}</td>
                  <td>
                    {formatQuantity(line.quantity)} {line.unitName}
                  </td>
                  <td>{formatTry(line.unitPrice)}</td>
                  <td>{formatMoneyOptional(line.taxAmount)}</td>
                  <td>{formatTry(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-body text-end">
          <p className="mb-1">
            Ara Toplam: <strong>{formatMoneyOptional(item.subtotal)}</strong>
          </p>
          <p className="mb-1">
            KDV: <strong>{formatMoneyOptional(item.taxTotal)}</strong>
          </p>
          <h5 className="mb-0">Genel Toplam: {formatTry(item.grandTotal)}</h5>
        </div>
      </div>
    </div>
  )
}
