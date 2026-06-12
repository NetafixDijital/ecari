import { Link } from 'react-router-dom'

export default function ModuleStubPage({ title }: { title: string }) {
  return (
    <div className="app-page-content">
      <div className="page-header">
        <h4>{title}</h4>
      </div>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="ti ti-tool text-body-secondary mb-3" style={{ fontSize: '3rem' }} />
          <h5>{title}</h5>
          <p className="text-body-secondary mb-4">Bu modül yapım aşamasında.</p>
          <Link to="/" className="btn btn-primary">
            Dashboard&apos;a Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
