import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchCariAccounts, type CariAccountListItem } from '../../api/cari'
import { fetchTaxRates, fetchUnits, type LookupItem, type TaxRate } from '../../api/core'
import { createInvoice } from '../../api/inv'
import { fetchStkItems, type StkItemListItem } from '../../api/stk'
import CariSecModal from '../../components/cari/CariSecModal'
import { formatTry } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { apiErrorMessage } from '../../utils/apiError'
import { useFullscreenState } from '../../context/FullscreenContext'
import FullscreenIcon from '../../components/icons/FullscreenIcon'

type CartLine = {
  key: string
  item: StkItemListItem
  quantity: number
  unitId: number
  unitPrice: number
  taxRateId: number
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function findPerakendeCari(cariler: CariAccountListItem[]) {
  return (
    cariler.find((c) => c.code === 'M00001') ??
    cariler.find((c) => c.title.toLowerCase().includes('perakende')) ??
    null
  )
}

function calcLineTotal(line: CartLine, taxRates: TaxRate[]) {
  const net = Math.round(line.quantity * line.unitPrice * 100) / 100
  const rate = taxRates.find((t) => t.id === line.taxRateId)?.rate ?? 0
  const tax = Math.round(net * rate) / 100
  return net + tax
}

export default function HizliSatisPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isFullscreen, toggleFullscreen } = useFullscreenState()

  useEffect(() => {
    document.body.classList.add('hs-fullscreen-pos')
    return () => document.body.classList.remove('hs-fullscreen-pos')
  }, [])
  const [items, setItems] = useState<StkItemListItem[]>([])
  const [cariler, setCariler] = useState<CariAccountListItem[]>([])
  const [units, setUnits] = useState<LookupItem[]>([])
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [selectedCari, setSelectedCari] = useState<CariAccountListItem | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutSaving, setCheckoutSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchStkItems(), fetchCariAccounts(), fetchUnits(), fetchTaxRates()])
      .then(([stkData, cariData, unitData, taxData]) => {
        setItems(stkData.filter((i) => i.isActive))
        setCariler(cariData)
        setUnits(unitData)
        setTaxRates(taxData)
      })
      .catch(() => setError('Satış verileri yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter((row) =>
      [row.code, row.barcode, row.name, row.brandName].filter(Boolean).join(' ').toLowerCase().includes(q),
    )
  }, [items, productSearch])

  const cartTotals = useMemo(() => {
    let subtotal = 0
    let taxTotal = 0
    for (const line of cart) {
      const net = Math.round(line.quantity * line.unitPrice * 100) / 100
      const rate = taxRates.find((t) => t.id === line.taxRateId)?.rate ?? 0
      const tax = Math.round(net * rate) / 100
      subtotal += net
      taxTotal += tax
    }
    return { subtotal, taxTotal, grandTotal: subtotal + taxTotal }
  }, [cart, taxRates])

  function addToCart(item: StkItemListItem) {
    const unit = units.find((u) => u.name === item.baseUnitName)
    const defaultTax = taxRates.find((t) => t.rate === 20) ?? taxRates[0]
    const price = item.salesPrice ?? 0
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id)
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          item,
          quantity: 1,
          unitId: unit?.id ?? units[0]?.id ?? 0,
          unitPrice: price,
          taxRateId: defaultTax?.id ?? 0,
        },
      ]
    })
  }

  function updateQuantity(key: string, quantity: number) {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((l) => l.key !== key))
      return
    }
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity } : l)))
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key))
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setError('Sepet boş.')
      return
    }
    const account = selectedCari ?? findPerakendeCari(cariler)
    if (!account) {
      setError('Perakende cari bulunamadı. Lütfen bir müşteri seçin.')
      return
    }
    setCheckoutSaving(true)
    setError('')
    try {
      const invoice = await createInvoice({
        invoiceType: 'SALES',
        accountId: account.id,
        documentDate: todayIso(),
        lines: cart.map((line) => ({
          itemId: line.item.id,
          description: line.item.name,
          quantity: line.quantity,
          unitId: line.unitId,
          unitPrice: line.unitPrice,
          taxRateId: line.taxRateId,
        })),
      })
      setCart([])
      toast.success('Satış tamamlandı', invoice.documentNo ?? 'Fatura oluşturuldu.')
      navigate(`/fatura/onizleme/${invoice.id}`)
    } catch (err: unknown) {
      const message = apiErrorMessage(err, 'Satış faturası oluşturulamadı.')
      setError(message)
      toast.error('Satış başarısız', message)
    } finally {
      setCheckoutSaving(false)
    }
  }

  return (
    <div className="app-page-content">
      <div
        className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4 hs-page-header"
        id="hsPageHeader"
      >
        <div>
          <h4 className="mb-1">
            <i className="ti ti-bolt text-primary me-1" /> Hızlı Satış
          </h4>
          {!isFullscreen && (
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <Link to="/">Ana Sayfa</Link>
                </li>
                <li className="breadcrumb-item active">Hızlı Satış</li>
              </ol>
            </nav>
          )}
          {isFullscreen && (
            <p className="text-body-secondary mb-0 small">Perakende satış ve anında fatura</p>
          )}
        </div>
        <div className="d-flex align-items-center flex-wrap gap-2">
          {isFullscreen && (
            <button
              type="button"
              className="btn btn-icon btn-action-gray rounded-circle border border-primary"
              title="Tam ekrandan çık"
              aria-label="Tam ekrandan çık"
              onClick={toggleFullscreen}
            >
              <FullscreenIcon active />
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-label-danger"
            id="hsClearCart"
            disabled={cart.length === 0}
            onClick={() => setCart([])}
          >
            <i className="ti ti-trash me-1" /> Sepeti Temizle
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="hs-pos" id="hsPos">
      <div className="row g-4 hizli-satis-layout">
        <div className="col-lg-8">
          <div className="card hs-products-panel">
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span>Ürünler</span>
              <div className="nl-field-icon" style={{ maxWidth: '20rem' }}>
                <span className="nl-field-icon__icon">
                  <i className="ti ti-search" />
                </span>
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Ürün ara..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body">
              {loading && <p className="text-body-secondary mb-0">Yükleniyor...</p>}
              {!loading && filteredProducts.length === 0 && (
                <p className="text-body-secondary mb-0">Ürün bulunamadı.</p>
              )}
              {!loading && (
                <div className="row g-3 hs-product-grid">
                  {filteredProducts.map((item) => (
                    <div key={item.id} className="col-md-4 col-sm-6">
                      <button
                        type="button"
                        className="card h-100 w-100 text-start border shadow-none"
                        onClick={() => addToCart(item)}
                      >
                        <div className="card-body p-3">
                          <p className="fw-medium mb-1 text-truncate">{item.name}</p>
                          <p className="text-body-secondary small mb-2">{item.code}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-primary fw-semibold">
                              {formatTry(item.salesPrice ?? 0)}
                            </span>
                            <span className="badge bg-label-secondary">{item.baseUnitName}</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card sticky-top hs-cart-panel" style={{ top: isFullscreen ? '1rem' : '5rem' }}>
            <div className="card-header">Sepet</div>
            <div className="card-body hs-cart-items">
              <div className="mb-3">
                <label className="form-label small">Müşteri (isteğe bağlı)</label>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    readOnly
                    value={selectedCari ? selectedCari.title : 'Perakende (varsayılan)'}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-label-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#modalCariSecHizliSatis"
                  >
                    Seç
                  </button>
                </div>
                {selectedCari && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 mt-1"
                    onClick={() => setSelectedCari(null)}
                  >
                    Perakende cariye dön
                  </button>
                )}
              </div>

              {cart.length === 0 && (
                <p className="text-body-secondary small mb-0">Sepetiniz boş. Ürünlere tıklayarak ekleyin.</p>
              )}
              {cart.map((line) => (
                <div key={line.key} className="d-flex align-items-start gap-2 mb-3 pb-3 border-bottom">
                  <div className="flex-grow-1">
                    <p className="mb-1 fw-medium small">{line.item.name}</p>
                    <p className="text-body-secondary small mb-2">{formatTry(line.unitPrice)}</p>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-label-secondary"
                        onClick={() => updateQuantity(line.key, line.quantity - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="form-control form-control-sm text-center"
                        style={{ width: '3.5rem' }}
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateQuantity(line.key, Number(e.target.value) || 1)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-label-secondary"
                        onClick={() => updateQuantity(line.key, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-label-danger ms-auto"
                        onClick={() => removeLine(line.key)}
                      >
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </div>
                  <span className="fw-medium small">{formatTry(calcLineTotal(line, taxRates))}</span>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="card-footer">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-body-secondary">Ara Toplam</span>
                  <span>{formatTry(cartTotals.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-body-secondary">KDV</span>
                  <span>{formatTry(cartTotals.taxTotal)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold mb-3">
                  <span>Genel Toplam</span>
                  <span>{formatTry(cartTotals.grandTotal)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  disabled={checkoutSaving}
                  onClick={handleCheckout}
                >
                  {checkoutSaving ? 'İşleniyor...' : 'Satışı Tamamla'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      <CariSecModal
        modalId="modalCariSecHizliSatis"
        description="Fatura kesilecek müşteriyi seçin (boş bırakılırsa perakende cari kullanılır)."
        cariler={cariler}
        loading={loading}
        accountTypeFilter="CUSTOMER"
        onSelect={setSelectedCari}
      />
    </div>
  )
}
