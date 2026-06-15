import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { globalSearch, type GlobalSearchResultItem } from '../../api/core'

const MODULE_LABELS: Record<string, string> = {
  cari: 'Cari',
  stok: 'Stok',
  fatura: 'Fatura',
  siparis: 'Sipariş',
  irsaliye: 'İrsaliye',
  teklif: 'Teklif',
  masraf: 'Masraf',
  gorev: 'Görev',
}

const MODULE_ICONS: Record<string, string> = {
  cari: 'ti-users',
  stok: 'ti-packages',
  fatura: 'ti-file-invoice',
  siparis: 'ti-shopping-cart',
  irsaliye: 'ti-truck-delivery',
  teklif: 'ti-file-description',
  masraf: 'ti-receipt-2',
  gorev: 'ti-checklist',
}

function searchResultPath(item: GlobalSearchResultItem): string {
  switch (item.module) {
    case 'cari':
      return '/cari'
    case 'stok':
      return '/stok'
    case 'fatura':
      return `/fatura/onizleme/${item.id}`
    case 'siparis':
      return `/siparis/${item.id}`
    case 'irsaliye':
      return `/irsaliye/${item.id}`
    case 'teklif':
      return `/teklif/${item.id}`
    case 'masraf':
      return `/masraf/${item.id}`
    case 'gorev':
      return '/gorev'
    default:
      return '/'
  }
}

export default function SearchResultsModal() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = window.setTimeout(() => {
      globalSearch(term)
        .then((data) => {
          setResults(data.results)
          setSearched(true)
        })
        .catch(() => {
          setResults([])
          setSearched(true)
        })
        .finally(() => setLoading(false))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query])

  return (
    <div className="modal fade" id="searchResultsModal" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header py-1 px-3">
            <form className="d-flex align-items-center position-relative w-100" onSubmit={(e) => e.preventDefault()}>
              <button type="button" className="btn btn-sm border-0 position-absolute start-0 p-0">
                <i className="ti ti-search" />
              </button>
              <input
                type="text"
                className="form-control form-control-lg ps-4 border-0 shadow-none"
                id="searchInput"
                placeholder="Ara... (fatura, cari, ürün)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </form>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
          </div>
          <div className="modal-body pb-2 nl-notify-scroll">
            {loading && <p className="text-body-secondary small mb-2">Aranıyor...</p>}
            {!loading && query.trim().length < 2 && (
              <p className="text-body-secondary small mb-2">Aramak için en az 2 karakter yazın.</p>
            )}
            {!loading && searched && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-body-secondary small mb-2">Sonuç bulunamadı.</p>
            )}
            {!loading && results.length > 0 && (
              <>
                <span className="text-uppercase text-2xs fw-semibold text-muted d-block mb-2">Sonuçlar:</span>
                <ul className="list-inline search-list mb-0">
                  {results.map((item) => (
                    <li key={`${item.module}-${item.id}`}>
                      <Link className="search-item" to={searchResultPath(item)} data-bs-dismiss="modal">
                        <i className={`ti ${MODULE_ICONS[item.module] ?? 'ti-search'}`} />
                        <span className="d-inline-block">
                          <span className="d-block">{item.label}</span>
                          <span className="text-body-secondary small">
                            {[MODULE_LABELS[item.module] ?? item.module, item.sublabel, item.documentNo]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
