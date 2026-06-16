import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { defaultProductionApiBase, getApiBaseUrl } from '../api/apiBaseUrl'

type StepResult = {
  name: string
  ok: boolean
  status?: number
  detail: string
  ms?: number
}

async function timedFetch(
  name: string,
  url: string,
  init?: RequestInit,
): Promise<StepResult> {
  const start = performance.now()
  try {
    const res = await fetch(url, init)
    const ms = Math.round(performance.now() - start)
    const cors = res.headers.get('access-control-allow-origin')
    let body = ''
    try {
      body = (await res.text()).slice(0, 300)
    } catch {
      body = '(gövde okunamadı)'
    }
    return {
      name,
      ok: res.ok,
      status: res.status,
      ms,
      detail: [
        `HTTP ${res.status}`,
        cors ? `CORS: ${cors}` : 'CORS başlığı yok',
        body ? `Gövde: ${body}` : 'Boş gövde',
      ].join(' · '),
    }
  } catch (err) {
    const ms = Math.round(performance.now() - start)
    const msg = err instanceof Error ? err.message : String(err)
    return {
      name,
      ok: false,
      ms,
      detail: `Ağ hatası: ${msg} (tarayıcı yanıtı engellemiş olabilir — CORS veya SSL)`,
    }
  }
}

export default function ApiTestPage() {
  const baseUrl = getApiBaseUrl()
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<StepResult[]>([])
  const [axiosLogin, setAxiosLogin] = useState<string>('—')

  const runTests = useCallback(async () => {
    setRunning(true)
    setAxiosLogin('—')
    const steps: StepResult[] = []

    steps.push(
      await timedFetch('Swagger UI', `${baseUrl}/swagger/index.html`, {
        method: 'GET',
        mode: 'cors',
      }),
    )

    steps.push(
      await timedFetch('CORS preflight (OPTIONS login)', `${baseUrl}/api/auth/login`, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          Origin: window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
        },
      }),
    )

    steps.push(
      await timedFetch('Login POST (fetch)', `${baseUrl}/api/auth/login`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({ email: 'admin@ecari.demo', password: 'Demo123!' }),
      }),
    )

    setResults(steps)

    try {
      const t0 = performance.now()
      const { data, status } = await api.post('/api/auth/login', {
        email: 'admin@ecari.demo',
        password: 'Demo123!',
      })
      const ms = Math.round(performance.now() - t0)
      setAxiosLogin(`OK HTTP ${status} (${ms}ms) — token: ${data.accessToken ? 'var' : 'yok'}`)
    } catch (err: unknown) {
      const e = err as {
        message?: string
        code?: string
        response?: { status?: number; data?: unknown }
      }
      if (e.response) {
        setAxiosLogin(
          `HTTP ${e.response.status} — ${JSON.stringify(e.response.data)?.slice(0, 200) || 'boş gövde'}`,
        )
      } else {
        setAxiosLogin(`Axios: ${e.message || e.code || 'Network Error'} (yanıt alınamadı)`)
      }
    }

    setRunning(false)
  }, [baseUrl])

  useEffect(() => {
    void runTests()
  }, [runTests])

  const allOk = results.length > 0 && results.every((r) => r.ok)

  return (
    <div className="container py-5" style={{ maxWidth: 720 }}>
      <h1 className="h4 mb-3">E-Cari API Bağlantı Testi</h1>
      <p className="text-muted small">
        Bu sayfa Vercel / tarayıcıdan API&apos;ye erişimi kontrol eder.{' '}
        <Link to="/login">Giriş sayfasına dön</Link>
      </p>

      <div className="card mb-3">
        <div className="card-body">
          <table className="table table-sm mb-0">
            <tbody>
              <tr>
                <th className="text-muted" style={{ width: 180 }}>
                  Sayfa (origin)
                </th>
                <td>
                  <code>{window.location.origin}</code>
                </td>
              </tr>
              <tr>
                <th className="text-muted">API base URL</th>
                <td>
                  <code>{baseUrl}</code>
                </td>
              </tr>
              <tr>
                <th className="text-muted">VITE_API_BASE_URL</th>
                <td>
                  <code>{import.meta.env.VITE_API_BASE_URL || '(boş — fallback kullanılıyor)'}</code>
                </td>
              </tr>
              <tr>
                <th className="text-muted">Production fallback</th>
                <td>
                  <code>{defaultProductionApiBase}</code>
                </td>
              </tr>
              <tr>
                <th className="text-muted">Ortam</th>
                <td>{import.meta.env.PROD ? 'production' : 'development'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3">
        <button type="button" className="btn btn-primary btn-sm" disabled={running} onClick={() => void runTests()}>
          {running ? 'Test ediliyor…' : 'Testleri yeniden çalıştır'}
        </button>
      </div>

      <div className={`alert ${allOk ? 'alert-success' : 'alert-warning'} py-2`}>
        {results.length === 0
          ? 'Testler çalışıyor…'
          : allOk
            ? 'Tüm fetch testleri başarılı.'
            : 'Bazı testler başarısız — aşağıdaki detaylara bakın.'}
      </div>

      <ul className="list-group mb-3">
        {results.map((r) => (
          <li
            key={r.name}
            className={`list-group-item ${r.ok ? 'list-group-item-success' : 'list-group-item-danger'}`}
          >
            <div className="d-flex justify-content-between">
              <strong>{r.name}</strong>
              <span className="small text-muted">{r.ms != null ? `${r.ms}ms` : ''}</span>
            </div>
            <div className="small mt-1">{r.detail}</div>
          </li>
        ))}
      </ul>

      <div className="card">
        <div className="card-header py-2 small fw-semibold">Axios (uygulamanın kullandığı istemci)</div>
        <div className="card-body small">
          <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{axiosLogin}</code>
        </div>
      </div>

      <p className="text-muted small mt-4 mb-0">
        Login POST 500 + CORS başlığı yoksa tarayıcı &quot;Network Error&quot; gösterir. Çözüm: Plesk&apos;te{' '}
        <code>appsettings.Production.json</code> SQL şifresi ve veritabanı kurulumu.
      </p>
    </div>
  )
}
