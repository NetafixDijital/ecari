import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchKdvReport, type InvKdvReport } from '../../api/inv'
import { formatDate, formatTry } from '../../utils/format'

export default function KdvRaporPage() {
  const [report, setReport] = useState<InvKdvReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchKdvReport()
      .then(setReport)
      .catch(() => setError('KDV raporu yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const salesRows = useMemo(
    () => report?.rows.filter((r) => r.invoiceType === 'SALES') ?? [],
    [report],
  )
  const purchaseRows = useMemo(
    () => report?.rows.filter((r) => r.invoiceType === 'PURCHASE') ?? [],
    [report],
  )

  return (
    <div className="app-page-content">
      <div className="page-header mb-4">
        <h4 className="mb-1">KDV Raporu</h4>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Ana Sayfa</Link>
            </li>
            <li className="breadcrumb-item">
              <span>Raporlar</span>
            </li>
            <li className="breadcrumb-item active">KDV</li>
          </ol>
        </nav>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card h-100 border-success">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Hesaplanan KDV (satış)</p>
              <h4 className="text-success mb-0">{loading ? '…' : formatTry(report?.salesTaxTotal ?? 0)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100 border-danger">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">İndirilecek KDV (alış)</p>
              <h4 className="text-danger mb-0">{loading ? '…' : formatTry(report?.deductibleTaxTotal ?? 0)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Net ödenecek KDV</p>
              <h4 className={`mb-0 ${(report?.netPayableTax ?? 0) >= 0 ? 'text-primary' : 'text-success'}`}>
                {loading ? '…' : formatTry(report?.netPayableTax ?? 0)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <p className="text-body-secondary mb-1 small">Fatura sayısı</p>
              <h4 className="mb-0">{loading ? '…' : report?.rows.length ?? 0}</h4>
            </div>
          </div>
        </div>
      </div>

      {!loading && report && report.rateGroups.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">KDV oranına göre özet</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="border-top">
                <tr>
                  <th>KDV Oranı</th>
                  <th className="text-end">Satış Matrahı</th>
                  <th className="text-end">Satış KDV</th>
                  <th className="text-end">Alış Matrahı</th>
                  <th className="text-end">Alış KDV</th>
                </tr>
              </thead>
              <tbody>
                {report.rateGroups.map((group) => (
                  <tr key={group.taxRate}>
                    <td className="fw-medium">{group.taxRateLabel}</td>
                    <td className="text-end">{formatTry(group.salesBase)}</td>
                    <td className="text-end text-success">{formatTry(group.salesTax)}</td>
                    <td className="text-end">{formatTry(group.purchaseBase)}</td>
                    <td className="text-end text-danger">{formatTry(group.purchaseTax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h6 className="mb-0">Fatura bazlı KDV detayı</h6>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="border-top">
              <tr>
                <th>Fatura No</th>
                <th>Tip</th>
                <th>Cari</th>
                <th>Tarih</th>
                <th className="text-end">Matrah</th>
                <th className="text-end">KDV</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-body-secondary">
                    Yükleniyor...
                  </td>
                </tr>
              )}
              {!loading &&
                report?.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link to={`/fatura/onizleme/${row.id}`}>{row.documentNo}</Link>
                    </td>
                    <td>{row.invoiceType === 'SALES' ? 'Satış' : 'Alış'}</td>
                    <td>{row.accountTitle}</td>
                    <td>{formatDate(row.documentDate)}</td>
                    <td className="text-end">{formatTry(row.subtotal)}</td>
                    <td className="text-end">{formatTry(row.taxTotal)}</td>
                  </tr>
                ))}
              {!loading && !report?.rows.length && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-body-secondary">
                    Kayıt yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && report && (
        <div className="row g-3 mt-1">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <p className="text-body-secondary small mb-1">Satış faturaları ({salesRows.length})</p>
                <h5 className="text-success mb-0">{formatTry(report.salesTaxTotal)}</h5>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <p className="text-body-secondary small mb-1">Alış faturaları ({purchaseRows.length})</p>
                <h5 className="text-danger mb-0">{formatTry(report.purchaseTaxTotal)}</h5>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
