import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchInvoice, updateInvoiceDates, type InvInvoiceDetail } from '../../api/inv'
import { apiErrorMessage } from '../../utils/apiError'
import { formatDate, formatMoneyOptional, formatQuantity, formatTry, statusBadge } from '../../utils/format'

export default function FaturaOnizlemePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<InvInvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [savingDates, setSavingDates] = useState(false)
  const [dateMessage, setDateMessage] = useState('')

  const invoiceId = Number(id)
  const isSales = invoice?.invoiceType === 'SALES' || invoice?.invoiceType === 'SALES_RETURN'
  const listPath =
    invoice?.invoiceType === 'PURCHASE'
      ? '/fatura/alis'
      : invoice?.invoiceType === 'PURCHASE_RETURN'
        ? '/fatura/alis-iade'
        : invoice?.invoiceType === 'SALES_RETURN'
          ? '/fatura/satis-iade'
          : '/fatura/satis'

  useEffect(() => {
    if (!invoiceId || Number.isNaN(invoiceId)) {
      setError('Geçersiz fatura.')
      setLoading(false)
      return
    }
    fetchInvoice(invoiceId)
      .then((data) => {
        setInvoice(data)
        setDocumentDate(data.documentDate)
        setDueDate(data.dueDate ?? data.documentDate)
      })
      .catch(() => setError('Fatura yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [invoiceId])

  useEffect(() => {
    if (invoice && (location.state as { print?: boolean } | null)?.print) {
      window.setTimeout(() => window.print(), 300)
    }
  }, [invoice, location.state])

  function handlePrint() {
    window.print()
  }

  async function handleSaveDates() {
    if (!invoice) return
    setSavingDates(true)
    setDateMessage('')
    setError('')
    try {
      const updated = await updateInvoiceDates(invoice.id, {
        documentDate,
        dueDate: invoice.paymentStatusKey === 'odendi' ? documentDate : dueDate,
      })
      setInvoice(updated)
      setDocumentDate(updated.documentDate)
      setDueDate(updated.dueDate ?? updated.documentDate)
      setDateMessage('Tarihler güncellendi.')
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Tarih güncellenemedi.'))
    } finally {
      setSavingDates(false)
    }
  }

  if (loading) {
    return (
      <div className="app-page-content">
        <p className="text-body-secondary">Yükleniyor...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="app-page-content">
        <div className="alert alert-danger">{error || 'Fatura bulunamadı.'}</div>
        <button type="button" className="btn btn-label-secondary" onClick={() => navigate(-1)}>
          Geri
        </button>
      </div>
    )
  }

  const badge = statusBadge(invoice.paymentStatusKey)
  const companyBlock = (
    <>
      <strong>{invoice.sellerLegalName}</strong>
      {invoice.sellerAddress && (
        <>
          <br />
          {invoice.sellerAddress}
        </>
      )}
    </>
  )
  const cariBlock = (
    <>
      <strong>{invoice.accountTitle}</strong>
      {invoice.accountTaxNumber && (
        <>
          <br />
          VKN/TCKN: {invoice.accountTaxNumber}
        </>
      )}
    </>
  )

  return (
    <div className="app-page-content">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 d-print-none">
        <div>
          <h4 className="mb-1">Fatura Önizleme</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={listPath}>{isSales ? 'Satış Fatura' : 'Alış Fatura'}</Link>
              </li>
              <li className="breadcrumb-item active">{invoice.documentNo}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button type="button" className="btn btn-label-secondary" onClick={handlePrint}>
            <i className="ti ti-printer me-1" /> Yazdır
          </button>
          <Link to={listPath} className="btn btn-label-secondary">
            <i className="ti ti-arrow-left me-1" /> Listeye Dön
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-4 p-md-5">
          <div className="d-flex justify-content-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-primary mb-1">FATURA</h3>
              <p className="mb-1">
                <strong>#{invoice.documentNo}</strong>
              </p>
              <span className={`badge ${badge.className}`}>{badge.label}</span>
            </div>
            <div className="text-md-end d-print-none">
              <div className="mb-2">
                <label className="form-label small mb-1">Fatura Tarihi</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                />
              </div>
              {invoice.paymentStatusKey !== 'odendi' && (
                <div className="mb-2">
                  <label className="form-label small mb-1">Vade Tarihi</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              )}
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={savingDates}
                onClick={handleSaveDates}
              >
                Tarihi Kaydet
              </button>
              {dateMessage && <div className="small text-success mt-1">{dateMessage}</div>}
            </div>
            <div className="text-md-end d-none d-print-block">
              <h6 className="mb-1">Fatura Tarihi: {formatDate(invoice.documentDate)}</h6>
              <p className="mb-0 text-body-secondary">Vade: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <h6>{isSales ? 'Satıcı' : 'Tedarikçi'}</h6>
              <p className="mb-0">{isSales ? companyBlock : cariBlock}</p>
            </div>
            <div className="col-md-6">
              <h6>{isSales ? 'Alıcı' : 'Alıcı (Şirket)'}</h6>
              <p className="mb-0">{isSales ? cariBlock : companyBlock}</p>
            </div>
          </div>

          {invoice.notes && (
            <p className="text-body-secondary small mb-4">
              <strong>Not:</strong> {invoice.notes}
            </p>
          )}

          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <thead className="table-light">
                <tr>
                  <th>Açıklama</th>
                  <th className="text-end">Miktar</th>
                  <th className="text-end">Birim Fiyat</th>
                  <th className="text-end">KDV</th>
                  <th className="text-end">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-body-secondary py-3">
                      Kalem detayı bulunamadı.
                    </td>
                  </tr>
                )}
                {invoice.lines.map((line) => (
                  <tr key={line.lineNo}>
                    <td>{line.description}</td>
                    <td className="text-end">
                      {formatQuantity(line.quantity)} {line.unitName}
                    </td>
                    <td className="text-end">{formatTry(line.unitPrice)}</td>
                    <td className="text-end">{formatTry(line.taxAmount)}</td>
                    <td className="text-end">{formatTry(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row justify-content-end mt-4">
            <div className="col-md-4">
              <table className="table table-sm table-borderless table-no-search mb-0">
                <tbody>
                  <tr>
                    <td>Ara Toplam</td>
                    <td className="text-end">{formatMoneyOptional(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td>KDV</td>
                    <td className="text-end">{formatMoneyOptional(invoice.taxTotal)}</td>
                  </tr>
                  <tr className="fw-bold">
                    <td>Genel Toplam</td>
                    <td className="text-end">{formatTry(invoice.grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
