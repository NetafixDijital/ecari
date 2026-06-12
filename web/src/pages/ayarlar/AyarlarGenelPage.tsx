import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCompanyProfile,
  updateCompanyProfile,
  type CompanyProfile,
  type UpdateCompanyProfileRequest,
} from '../../api/cfg'

export default function AyarlarGenelPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [form, setForm] = useState<UpdateCompanyProfileRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchCompanyProfile()
      .then((data) => {
        setProfile(data)
        const { id: _id, ...rest } = data
        setForm(rest)
      })
      .catch(() => setError('Şirket profili yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateCompanyProfile(form)
      setProfile(updated)
      const { id: _id, ...rest } = updated
      setForm(rest)
      setSuccess('Firma bilgileri kaydedildi.')
    } catch {
      setError('Kayıt sırasında hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  function updateField<K extends keyof UpdateCompanyProfileRequest>(
    key: K,
    value: UpdateCompanyProfileRequest[K],
  ) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
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
      <h4 className="mb-4">Genel Ayarlar</h4>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      <form onSubmit={handleSave}>
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">Firma Bilgileri</div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Firma Adı</label>
                  <input
                    className="form-control"
                    value={form?.legalName ?? ''}
                    onChange={(e) => updateField('legalName', e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Ticari Unvan</label>
                  <input
                    className="form-control"
                    value={form?.tradeName ?? ''}
                    onChange={(e) => updateField('tradeName', e.target.value || null)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Vergi Dairesi</label>
                  <input
                    className="form-control"
                    value={form?.taxOffice ?? ''}
                    onChange={(e) => updateField('taxOffice', e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Vergi No</label>
                  <input
                    className="form-control"
                    value={form?.taxNumber ?? ''}
                    onChange={(e) => updateField('taxNumber', e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Adres</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={form?.address ?? ''}
                    onChange={(e) => updateField('address', e.target.value || null)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Telefon</label>
                  <input
                    className="form-control"
                    value={form?.phone ?? ''}
                    onChange={(e) => updateField('phone', e.target.value || null)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">E-posta</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form?.email ?? ''}
                    onChange={(e) => updateField('email', e.target.value || null)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">E-Belge Ayarları</div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form?.isEinvoiceUser ?? false}
                    onChange={(e) => updateField('isEinvoiceUser', e.target.checked)}
                    id="swEinvoice"
                  />
                  <label className="form-check-label" htmlFor="swEinvoice">
                    e-Fatura kullanıcısı
                  </label>
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form?.isEarchiveUser ?? false}
                    onChange={(e) => updateField('isEarchiveUser', e.target.checked)}
                    id="swEarchive"
                  />
                  <label className="form-check-label" htmlFor="swEarchive">
                    e-Arşiv kullanıcısı
                  </label>
                </div>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={form?.isEwaybillUser ?? false}
                    onChange={(e) => updateField('isEwaybillUser', e.target.checked)}
                    id="swEwaybill"
                  />
                  <label className="form-check-label" htmlFor="swEwaybill">
                    e-İrsaliye kullanıcısı
                  </label>
                </div>
                {profile && (
                  <p className="text-body-secondary small mb-0">
                    Varsayılan para birimi ID: {profile.defaultCurrencyId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="card">
              <div className="card-header">Arayüz &amp; Menü</div>
              <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <p className="mb-1 fw-medium">Menü sıralaması ve dashboard kısayolları</p>
                  <p className="text-body-secondary small mb-0">
                    Modüllerin sırasını değiştirin, sık kullandıklarınızı ana sayfaya ekleyin.
                  </p>
                </div>
                <Link to="/ayarlar/menu" className="btn btn-primary">
                  <i className="ti ti-layout-sidebar me-1" /> Menü Düzenine Git
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
