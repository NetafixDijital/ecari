import { type FormEvent, useCallback, useEffect, useState } from 'react'
import type { City, District, PaymentTerm } from '../../api/core'
import type { CreateCariAccountRequest } from '../../api/cari'
import { fetchDistricts } from '../../api/core'
import { COUNTRIES } from '../../data/countries'
import { GIB_DEMO } from '../../data/gib-demo'

interface YeniCariModalProps {
  cities: City[]
  paymentTerms: PaymentTerm[]
  onCreate: (body: CreateCariAccountRequest) => Promise<void>
  creating: boolean
  createError: string
}

const EMPTY_FORM = {
  personType: 'tuzel' as 'tuzel' | 'gercek',
  vknTckn: '',
  title: '',
  taxOffice: '',
  address: '',
  countryCode: 'TR',
  cityId: '' as number | '',
  districtId: '' as number | '',
  postalCode: '',
  paymentTermId: '' as number | '',
  dueDays: '',
  phone: '',
  email: '',
}

export default function YeniCariModal({ cities, paymentTerms, onCreate, creating, createError }: YeniCariModalProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [districts, setDistricts] = useState<District[]>([])
  const [invalid, setInvalid] = useState<{ title?: boolean; vknTckn?: boolean }>({})

  const isTuzel = form.personType === 'tuzel'
  const expectedIdLen = isTuzel ? 10 : 11

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM)
    setDistricts([])
    setInvalid({})
  }, [])

  useEffect(() => {
    const el = document.getElementById('modalYeniCari')
    if (!el) return
    const onShow = () => resetForm()
    el.addEventListener('show.bs.modal', onShow)
    return () => el.removeEventListener('show.bs.modal', onShow)
  }, [resetForm])

  useEffect(() => {
    if (form.cityId === '') {
      setDistricts([])
      return
    }
    fetchDistricts(form.cityId)
      .then(setDistricts)
      .catch(() => setDistricts([]))
  }, [form.cityId])

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'title' || key === 'vknTckn') {
      setInvalid((prev) => ({ ...prev, [key]: false }))
    }
  }

  function handlePersonType(personType: 'tuzel' | 'gercek') {
    setForm((prev) => ({
      ...prev,
      personType,
      vknTckn: prev.vknTckn.replace(/\D/g, '').slice(0, personType === 'tuzel' ? 10 : 11),
      taxOffice: personType === 'gercek' ? '' : prev.taxOffice,
    }))
    setInvalid({})
  }

  function handleVknChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, expectedIdLen)
    setField('vknTckn', digits)
    if (digits.length === expectedIdLen) {
      const gib = GIB_DEMO[digits]
      if (gib) {
        setForm((prev) => ({
          ...prev,
          vknTckn: digits,
          title: gib.unvan,
          taxOffice: isTuzel && gib.vergi_dairesi ? gib.vergi_dairesi : prev.taxOffice,
        }))
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextInvalid = {
      title: !form.title.trim(),
      vknTckn: form.vknTckn.length !== expectedIdLen,
    }
    setInvalid(nextInvalid)
    if (nextInvalid.title || nextInvalid.vknTckn) return

    const body: CreateCariAccountRequest = {
      personType: isTuzel ? 'TUZEL_KISI' : 'GERCEK_KISI',
      title: form.title.trim(),
      taxNumber: isTuzel ? form.vknTckn : undefined,
      identityNumber: !isTuzel ? form.vknTckn : undefined,
      taxOffice: isTuzel ? form.taxOffice.trim() || undefined : undefined,
      addressLine: form.address.trim() || undefined,
      cityId: form.cityId === '' ? undefined : form.cityId,
      districtId: form.districtId === '' ? undefined : form.districtId,
      countryCode: form.countryCode || 'TR',
      postalCode: form.postalCode.trim() || undefined,
      paymentTermId: form.paymentTermId === '' ? undefined : form.paymentTermId,
      dueDays: form.dueDays ? Number(form.dueDays) : undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      accountType: 'CUSTOMER',
    }

    try {
      await onCreate(body)
      resetForm()
      const el = document.getElementById('modalYeniCari')
      if (el && window.bootstrap) {
        window.bootstrap.Modal.getOrCreateInstance(el).hide()
      }
    } catch {
      /* hata üst bileşende */
    }
  }

  return (
    <div className="modal fade nl-modal-form" id="modalYeniCari" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div className="pe-3">
              <h5 className="modal-title">Yeni Cari Ekle</h5>
              <p className="modal-desc mb-0">
                VKN/TCKN girildiğinde GİB üzerinden unvan/ad-soyad getirilir; kayıt sonrası e-Fatura durumu kontrol edilir.
              </p>
            </div>
            <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" aria-label="Kapat" />
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {createError && <div className="alert alert-danger py-2 small">{createError}</div>}
              <div className="form-section">
                <div className="form-section-title">Kimlik Bilgileri</div>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label d-block">Müşteri Tipi</label>
                    <div className="tip-toggle" role="group">
                      <input
                        className="btn-check"
                        type="radio"
                        name="cariTipi"
                        id="cariTipiTuzel"
                        checked={isTuzel}
                        onChange={() => handlePersonType('tuzel')}
                      />
                      <label className="btn btn-outline-primary" htmlFor="cariTipiTuzel">
                        <i className="ti ti-building me-1" /> Tüzel Kişi
                      </label>
                      <input
                        className="btn-check"
                        type="radio"
                        name="cariTipi"
                        id="cariTipiGercek"
                        checked={!isTuzel}
                        onChange={() => handlePersonType('gercek')}
                      />
                      <label className="btn btn-outline-primary" htmlFor="cariTipiGercek">
                        <i className="ti ti-user me-1" /> Gerçek Kişi
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="cariVknTckn">
                      {isTuzel ? 'VKN' : 'TCKN'} <span className="text-danger">*</span>
                    </label>
                    <div className="nl-field-icon">
                      <span className="nl-field-icon__icon" aria-hidden="true">
                        <i className="ti ti-id" />
                      </span>
                      <input
                        type="text"
                        className={`form-control${invalid.vknTckn ? ' is-invalid' : ''}`}
                        id="cariVknTckn"
                        inputMode="numeric"
                        maxLength={expectedIdLen}
                        placeholder={isTuzel ? '10 haneli VKN' : '11 haneli TCKN'}
                        value={form.vknTckn}
                        onChange={(e) => handleVknChange(e.target.value)}
                        required
                        disabled={creating}
                      />
                    </div>
                    <div className="form-text">
                      {isTuzel
                        ? '10 hane girildiğinde GİB üzerinden unvan getirilir.'
                        : '11 hane girildiğinde GİB üzerinden ad-soyad getirilir.'}
                    </div>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label" htmlFor="cariUnvan">
                      {isTuzel ? 'Unvan' : 'Ad Soyad'} <span className="text-danger">*</span>
                    </label>
                    <div className="nl-field-icon">
                      <span className="nl-field-icon__icon" aria-hidden="true">
                        <i className={`ti ${isTuzel ? 'ti-building' : 'ti-user'}`} />
                      </span>
                      <input
                        type="text"
                        className={`form-control${invalid.title ? ' is-invalid' : ''}`}
                        id="cariUnvan"
                        placeholder={isTuzel ? 'Şirket unvanı' : 'Ad soyad'}
                        value={form.title}
                        onChange={(e) => setField('title', e.target.value)}
                        required
                        disabled={creating}
                      />
                    </div>
                  </div>
                  {isTuzel && (
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="cariVergiDairesi">
                        Vergi Dairesi
                      </label>
                      <div className="nl-field-icon">
                        <span className="nl-field-icon__icon" aria-hidden="true">
                          <i className="ti ti-building-bank" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          id="cariVergiDairesi"
                          placeholder="Vergi dairesi"
                          value={form.taxOffice}
                          onChange={(e) => setField('taxOffice', e.target.value)}
                          disabled={creating}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-section">
                <div className="form-section-title">Adres &amp; İletişim</div>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="cariAdres">
                      Adres
                    </label>
                    <div className="nl-field-icon">
                      <span className="nl-field-icon__icon" aria-hidden="true">
                        <i className="ti ti-map-pin" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        id="cariAdres"
                        placeholder="Tam adres"
                        value={form.address}
                        onChange={(e) => setField('address', e.target.value)}
                        disabled={creating}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Ülke</label>
                    <select
                      className="form-select"
                      value={form.countryCode}
                      onChange={(e) => setField('countryCode', e.target.value)}
                      disabled={creating}
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
                      id="cariIl"
                      value={form.cityId}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : ''
                        setForm((prev) => ({ ...prev, cityId: val, districtId: '' }))
                      }}
                      disabled={creating}
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
                      id="cariIlce"
                      value={form.districtId}
                      onChange={(e) => setField('districtId', e.target.value ? Number(e.target.value) : '')}
                      disabled={creating || form.cityId === ''}
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
                      placeholder="34000"
                      value={form.postalCode}
                      onChange={(e) => setField('postalCode', e.target.value)}
                      disabled={creating}
                    />
                  </div>
                  <div className="col-md-4">
                    <div className="nl-field-icon">
                      <span className="nl-field-icon__icon" aria-hidden="true">
                        <i className="ti ti-phone" />
                      </span>
                      <input
                        type="tel"
                        className="form-control"
                        id="cariTelefon"
                        placeholder="Telefon"
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        disabled={creating}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="nl-field-icon">
                      <span className="nl-field-icon__icon" aria-hidden="true">
                        <i className="ti ti-mail" />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="cariEposta"
                        placeholder="E-posta"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        disabled={creating}
                      />
                    </div>
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
                      value={form.paymentTermId}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : ''
                        const term = paymentTerms.find((t) => t.id === val)
                        setForm((prev) => ({
                          ...prev,
                          paymentTermId: val,
                          dueDays: term ? String(term.dueDays) : prev.dueDays,
                        }))
                      }}
                      disabled={creating}
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
                      placeholder="30"
                      value={form.dueDays}
                      onChange={(e) => setField('dueDays', e.target.value)}
                      disabled={creating}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-label-secondary" data-bs-dismiss="modal" disabled={creating}>
                İptal
              </button>
              <button type="submit" className="btn btn-primary" id="btnCariEkle" disabled={creating}>
                <i className="ti ti-plus me-1" /> {creating ? 'Kaydediliyor…' : 'Cari Ekle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
