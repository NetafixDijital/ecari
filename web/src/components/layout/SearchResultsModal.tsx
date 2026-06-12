import { Link } from 'react-router-dom'

const SEARCH_LINKS = [
  { to: '/', icon: 'ti-smart-home', label: 'Ana Sayfa' },
  { to: '/fatura/satis', icon: 'ti-file-invoice', label: 'Satış Fatura' },
  { to: '/cari', icon: 'ti-users', label: 'Cari Listesi' },
  { to: '/stok', icon: 'ti-packages', label: 'Stok Listesi' },
  { to: '/gorev', icon: 'ti-checklist', label: 'Görev Listesi' },
  { to: '/masraf/yonetim', icon: 'ti-receipt-2', label: 'Masraf Yönetimi' },
  { to: '/kasa', icon: 'ti-cash', label: 'Kasa' },
  { to: '/kasa/gun-sonu', icon: 'ti-report-money', label: 'Gün Sonu Raporu' },
]

export default function SearchResultsModal() {
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
              />
            </form>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Kapat" />
          </div>
          <div className="modal-body pb-2 nl-notify-scroll">
            <span className="text-uppercase text-2xs fw-semibold text-muted d-block mb-2">Son Aramalar:</span>
            <ul className="list-inline search-list mb-0">
              {SEARCH_LINKS.map((item) => (
                <li key={item.to}>
                  <Link className="search-item" to={item.to} data-bs-dismiss="modal">
                    <i className={`ti ${item.icon}`} /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
