import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import {
  fetchEblCredentials,
  fetchEblIntegrators,
  saveEblCredential,
  type EblCredential,
  type EblIntegrator,
} from '../../api/ebl'
import { fetchCompanyProfile, updateCompanyProfile } from '../../api/cfg'
import { apiErrorMessage } from '../../utils/apiError'

export default function AyarlarEdmPage() {
  const toast = useToast()
  const [integrators, setIntegrators] = useState<EblIntegrator[]>([])
  const [credentials, setCredentials] = useState<EblCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [integratorId, setIntegratorId] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [environment, setEnvironment] = useState('TEST')
  const [invoiceSerialPrefix, setInvoiceSerialPrefix] = useState('')
  const [einvoiceAlias, setEinvoiceAlias] = useState('')
  const [ewaybillAlias, setEwaybillAlias] = useState('')

  useEffect(() => {
    Promise.all([fetchEblIntegrators(), fetchEblCredentials(), fetchCompanyProfile()])
      .then(([ints, creds, profile]) => {
        setIntegrators(ints)
        setCredentials(creds)
        if (ints.length > 0) setIntegratorId(ints[0].id)
        const active = creds.find((c) => c.isActive) ?? creds[0]
        if (active) {
          setIntegratorId(active.integratorId)
          setUsername(active.username)
          setEnvironment(active.environment)
          setInvoiceSerialPrefix(active.invoiceSerialPrefix ?? '')
        }
        setEinvoiceAlias(profile.einvoiceAlias ?? '')
        setEwaybillAlias(profile.ewaybillAlias ?? '')
      })
      .catch(() => setError('E-Belge ayarları yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveCredential(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await saveEblCredential({
        integratorId,
        username,
        password: password || null,
        environment,
        invoiceSerialPrefix: invoiceSerialPrefix || null,
        isActive: true,
      })
      setCredentials((prev) => {
        const rest = prev.filter(
          (c) => !(c.integratorId === saved.integratorId && c.environment === saved.environment),
        )
        return [saved, ...rest]
      })
      setPassword('')
      toast.success('Kaydedildi', 'EDM kimlik bilgileri güncellendi.')
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, 'Kimlik bilgileri kaydedilemedi.')
      setError(msg)
      toast.error('Kayıt başarısız', msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAliases(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const profile = await fetchCompanyProfile()
      const { id: _id, ...rest } = profile
      await updateCompanyProfile({
        ...rest,
        einvoiceAlias: einvoiceAlias || null,
        ewaybillAlias: ewaybillAlias || null,
      })
      toast.success('Kaydedildi', 'GB/PK etiketleri güncellendi.')
    } catch (err: unknown) {
      const msg = apiErrorMessage(err, 'Etiketler kaydedilemedi.')
      setError(msg)
      toast.error('Kayıt başarısız', msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="app-page-content">
        <p className="text-body-secondary">Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="app-page-content">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1">E-Belge (EDM) Ayarları</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/ayarlar">Ayarlar</Link>
              </li>
              <li className="breadcrumb-item active">E-Belge</li>
            </ol>
          </nav>
        </div>
        <Link to="/ayarlar" className="btn btn-label-secondary">
          Geri
        </Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">EDM Portal Kimlik Bilgileri</div>
            <div className="card-body">
              <form onSubmit={handleSaveCredential}>
                <div className="mb-3">
                  <label className="form-label">Entegratör</label>
                  <select
                    className="form-select"
                    value={integratorId}
                    onChange={(e) => setIntegratorId(Number(e.target.value))}
                  >
                    {integrators.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Ortam</label>
                  <select
                    className="form-select"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                  >
                    <option value="TEST">Test</option>
                    <option value="PRODUCTION">Canlı</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Kullanıcı Adı</label>
                  <input
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Şifre</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={credentials.some((c) => c.hasPassword) ? 'Değiştirmek için yazın' : ''}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fatura Seri Öneki</label>
                  <input
                    className="form-control"
                    value={invoiceSerialPrefix}
                    onChange={(e) => setInvoiceSerialPrefix(e.target.value)}
                    placeholder="Örn: ABC"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kimlik Bilgilerini Kaydet'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">Firma GİB Etiketleri</div>
            <div className="card-body">
              <form onSubmit={handleSaveAliases}>
                <div className="mb-3">
                  <label className="form-label">e-Fatura GB Etiketi</label>
                  <input
                    className="form-control"
                    value={einvoiceAlias}
                    onChange={(e) => setEinvoiceAlias(e.target.value)}
                    placeholder="urn:mail:..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">e-İrsaliye GB Etiketi</label>
                  <input
                    className="form-control"
                    value={ewaybillAlias}
                    onChange={(e) => setEwaybillAlias(e.target.value)}
                    placeholder="urn:mail:..."
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Etiketleri Kaydet'}
                </button>
              </form>
              {integrators[0] && (
                <p className="text-body-secondary small mt-3 mb-0">
                  Test API: {integrators[0].apiBaseUrl}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
