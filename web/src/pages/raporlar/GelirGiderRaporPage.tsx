import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchInvoices } from '../../api/inv'
import { formatTry } from '../../utils/format'

export default function GelirGiderRaporPage() {
  const [salesTotal, setSalesTotal] = useState(0)
  const [purchaseTotal, setPurchaseTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchInvoices('SALES'), fetchInvoices('PURCHASE')])
      .then(([sales, purchase]) => {
        setSalesTotal(sales.reduce((s, r) => s + r.grandTotal, 0))
        setPurchaseTotal(purchase.reduce((s, r) => s + r.grandTotal, 0))
      })
      .finally(() => setLoading(false))
  }, [])

  const net = salesTotal - purchaseTotal

  return (
    <div className="app-page-content">
      <div className="page-header mb-4">
        <h4 className="mb-1">Gelir / Gider Raporu</h4>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Ana Sayfa</Link>
            </li>
            <li className="breadcrumb-item">
              <span>Raporlar</span>
            </li>
            <li className="breadcrumb-item active">Gelir / Gider</li>
          </ol>
        </nav>
      </div>

      {loading ? (
        <p className="text-body-secondary">Yükleniyor...</p>
      ) : (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card h-100 border-success">
              <div className="card-body">
                <p className="text-body-secondary mb-1">Satış faturaları (gelir)</p>
                <h4 className="text-success mb-0">{formatTry(salesTotal)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-danger">
              <div className="card-body">
                <p className="text-body-secondary mb-1">Alış faturaları (gider)</p>
                <h4 className="text-danger mb-0">{formatTry(purchaseTotal)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-body">
                <p className="text-body-secondary mb-1">Net fark</p>
                <h4 className={`mb-0 ${net >= 0 ? 'text-success' : 'text-danger'}`}>{formatTry(net)}</h4>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
