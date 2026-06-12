import { type FormEvent, useEffect, useState } from 'react'
import type { City, District, PaymentTerm } from '../../api/core'
import { fetchDistricts } from '../../api/core'
import { fetchCariAccount, type CariAccountDetail, type UpdateCariAccountRequest } from '../../api/cari'
import { COUNTRIES } from '../../data/countries'

interface DuzenleCariModalProps {
  accountId: number | null
  cities: City[]
  paymentTerms: PaymentTerm[]
  onClose: () => void
  onSave: (id: number, body: UpdateCariAccountRequest) => Promise<void>
  saving: boolean
  saveError: string
}

export default function DuzenleCariModal({
  accountId,
  cities,
  paymentTerms,
  onClose,
  onSave,
  saving,
  saveError,
}: DuzenleCariModalProps) {
  const [detail, setDetail] = useState<CariAccountDetail | null>(null)
  const [districts, setDistricts] = useState<District[]>([])
  const [title, setTitle] = useState('')
  const [taxOffice, setTaxOffice] = useState('')
  const [address, setAddress] = useState('')
  const [cityId, setCityId] = useState<number | ''>('')
  const [districtId, setDistrictId] = useState<number | ''>('')
  const [countryCode, setCountryCode] = useState('TR')
  const [postalCode, setPostalCode] = useState('')
  const [paymentTermId, setPaymentTermId] = useState<number | ''>('')
  const [dueDays, setDueDays] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const isTuzel = detail?.personType === 'TUZEL_KISI'
  const taxId = isTuzel ? detail?.taxNumber : detail?.identityNumber

  useEffect(() => {
    if (!accountId) return
    setLoading(true)
    fetchCariAccount(accountId)
      .then((d) => {
        setDetail(d)
        setTitle(d.title)
        setTaxOffice(d.taxOffice ?? '')
        setAddress(d.addressLine ?? '')
        setCityId(d.cityId ?? '')
        setDistrictId(d.districtId ?? '')
        setCountryCode(d.countryCode || 'TR')
        setPostalCode(d.postalCode ?? '')
        setPaymentTermId(d.paymentTermId ?? '')
        setDueDays(d.dueDays != null ? String(d.dueDays) : '')
        setPhone(d.phone ?? '')
        setEmail(d.email ?? '')
        setIsActive(d.isActive)
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [accountId])

  useEffect(() => {
    if (cityId === '') {
      setDistricts([])
      return
    }
    fetchDistricts(cityId).then(setDistricts).catch(() => setDistricts([]))
  }, [cityId])

  useEffect(() => {
    if (!accountId) return
    const el = document.getElementById('modalDuzenleCari')
    if (!el || !window.bootstrap) return
    const modal = window.bootstrap.Modal.getOrCreateInstance(el)
    modal.show()
    const onHidden = () => onClose()
    el.addEventListener('hidden.bs.modal', onHidden)
    return () => el.removeEventListener('hidden.bs.modal', onHidden)
  }, [accountId, onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!accountId || !detail || !title.trim()) return
    const body: UpdateCariAccountRequest = {
      title: title.trim(),
      taxNumber: isTuzel ? detail.taxNumber ?? undefined : undefined,
      identityNumber: !isTuzel ? detail.identityNumber ?? undefined : undefined,
      taxOffice: isTuzel ? taxOffice.trim() || undefined : undefined,
      addressLine: address.trim() || undefined,
      cityId: cityId === '' ? undefined : cityId,
      districtId: districtId === '' ? undefined : districtId,
      countryCode: countryCode || 'TR',
      postalCode: postalCode.trim() || undefined,
      paymentTermId: paymentTermId === '' ? undefined : paymentTermId,
      dueDays: dueDays ? Number(dueDays) : undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      isActive,
    }
    try {
      await onSave(accountId, body)
      const el = document.getElementById('modalDuzenleCari')
      if (el && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(el).hide()
    } catch {
      /* üst bileşen */
    }
  }

  if (!accountId) return null

  return (
    <div className="modal fade nl-modal-form" id="modalDuzenleCari" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div className="pe-3">
              <h5 className="modal-title">Cari Düzenle</h5>
              <p className="modal-desc mb-0">
                {detail ? (
                  <>
                    <span className="font-mono">{detail.code}</span> — {isTuzel ? 'Tüzel Kişi' : 'Gerçek Kişi'}
                  </>
                ) : (
                  'Cari bilgilerini güncelleyin.'
                )}
              </p>
            </div>
            <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loading && <p className="text-body-secondary small">Yükleniyor…</p>}
              {saveError && <div className="alert alert-danger py-2 small">{saveError}</div>}
              {detail && !loading && (
                <>
                  <div className="form-section">
                    <div className="form-section-title">Kimlik Bilgileri</div>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label">{isTuzel ? 'VKN' : 'TCKN'}</label>
                        <input type="text" className="form-control font-mono" value={taxId ?? ''} readOnly disabled />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label">
                          {isTuzel ? 'Unvan' : 'Ad Soyad'} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          disabled={saving}
                        />
                      </div>
                      {isTuzel && (
                        <div className="col-md-6">
                          <label className="form-label">Vergi Dairesi</label>
                          <input
                            type="text"
                            className="form-control"
                            value={taxOffice}
                            onChange={(e) => setTaxOffice(e.target.value)}
                            disabled={saving}
                          />
                        </div>
                      )}
                      <div className="col-md-6">
                        <div className="form-check form-switch mt-4">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="cariAktif"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            disabled={saving}
                          />
                          <label className="form-check-label" htmlFor="cariAktif">
                            Aktif cari
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-section">
                    <div className="form-section-title">Adres &amp; İletişim</div>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Adres</label>
                        <input
                          type="text"
                          className="form-control"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Ülke</label>
                        <select
                          className="form-select"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          disabled={saving}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">İl</label>
                        <select
                          className="form-select"
                          value={cityId}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : ''
                            setCityId(val)
                            setDistrictId('')
                          }}
                          disabled={saving}
                        >
                          <option value="">İl seçin</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">İlçe</label>
                        <select
                          className="form-select"
                          value={districtId}
                          onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : '')}
                          disabled={saving || cityId === ''}
                        >
                          <option value="">İlçe seçin</option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Posta Kodu</label>
                        <input
                          type="text"
                          className="form-control"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Telefon"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="E-posta"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-section">
                    <div className="form-section-title">Ödeme Koşulları</div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Ödeme Vadesi</label>
                        <select
                          className="form-select"
                          value={paymentTermId}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : ''
                            const term = paymentTerms.find((t) => t.id === val)
                            setPaymentTermId(val)
                            if (term) setDueDays(String(term.dueDays))
                          }}
                          disabled={saving}
                        >
                          <option value="">Seçin...</option>
                          {paymentTerms.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Vade Gün</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          value={dueDays}
                          onChange={(e) => setDueDays(e.target.value)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal" disabled={saving}>
                İptal
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || loading || !detail}>
                <i className="ti ti-device-floppy me-1" /> {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
