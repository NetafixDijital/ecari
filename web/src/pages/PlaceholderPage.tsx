import { Link } from 'react-router-dom'

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="app-page-content">
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <h4 className="mb-0">{title}</h4>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <p className="text-body-secondary mb-3">Bu modül API tamamlandıkça eklenecek.</p>
          <Link to="/" className="btn btn-sm btn-primary">
            Ana Panele Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
