import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBnkAccounts } from '../../api/bnk'
import { fetchCshAccounts } from '../../api/csh'
import { formatTry } from '../../utils/format'

export default function GunSonuRaporuPage() {
  const [kasaTotal, setKasaTotal] = useState(0)
  const [bankaTotal, setBankaTotal] = useState(0)
  const [kasaCount, setKasaCount] = useState(0)
  const [bankaCount, setBankaCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchCshAccounts(), fetchBnkAccounts()])
      .then(([kasa, banka]) => {
        setKasaTotal(kasa.reduce((s, a) => s + a.balance, 0))
        setBankaTotal(banka.reduce((s, a) => s + a.balance, 0))
        setKasaCount(kasa.filter((a) => a.isActive).length)
        setBankaCount(banka.filter((a) => a.isActive).length)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="app-page-content">
      <div className="page-header mb-4">
        <h4 className="mb-1">Gün Sonu Raporu</h4>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/">Ana Sayfa</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/kasa">Kasa</Link>
            </li>
            <li className="breadcrumb-item active">Gün Sonu</li>
          </ol>
        </nav>
      </div>

      {loading ? (
        <p className="text-body-secondary">Yükleniyor...</p>
      ) : (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Kasa özeti</div>
              <div className="card-body">
                <p className="mb-1 text-body-secondary">Aktif kasa: {kasaCount}</p>
                <h4 className="mb-0">{formatTry(kasaTotal)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Banka özeti</div>
              <div className="card-body">
                <p className="mb-1 text-body-secondary">Aktif hesap: {bankaCount}</p>
                <h4 className="mb-0">{formatTry(bankaTotal)}</h4>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <p className="text-body-secondary mb-1">Toplam nakit + banka</p>
                <h3 className="mb-0">{formatTry(kasaTotal + bankaTotal)}</h3>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
