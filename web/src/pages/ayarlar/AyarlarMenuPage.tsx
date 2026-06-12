import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardLinks, moduleGroups, type MenuGroup, type MenuLink } from '../../config/menu'

const MENU_ORDER_KEY = 'ecari_menu_order'
const DASHBOARD_SHORTCUTS_KEY = 'ecari_dashboard_shortcuts'

type ShortcutState = Record<string, boolean>

function loadMenuOrder(): string[] {
  try {
    const raw = localStorage.getItem(MENU_ORDER_KEY)
    if (!raw) return moduleGroups.map((g) => g.id)
    const parsed = JSON.parse(raw) as string[]
    const ids = moduleGroups.map((g) => g.id)
    const valid = parsed.filter((id) => ids.includes(id))
    const missing = ids.filter((id) => !valid.includes(id))
    return [...valid, ...missing]
  } catch {
    return moduleGroups.map((g) => g.id)
  }
}

function loadShortcutState(): ShortcutState {
  try {
    const raw = localStorage.getItem(DASHBOARD_SHORTCUTS_KEY)
    if (!raw) {
      return Object.fromEntries(dashboardLinks.map((l) => [l.id, true]))
    }
    const parsed = JSON.parse(raw) as ShortcutState
    const state: ShortcutState = {}
    for (const link of dashboardLinks) {
      state[link.id] = parsed[link.id] ?? true
    }
    return state
  } catch {
    return Object.fromEntries(dashboardLinks.map((l) => [l.id, true]))
  }
}

function sortGroups(order: string[]): MenuGroup[] {
  const map = new Map(moduleGroups.map((g) => [g.id, g]))
  return order.map((id) => map.get(id)).filter((g): g is MenuGroup => Boolean(g))
}

export default function AyarlarMenuPage() {
  const [menuOrder, setMenuOrder] = useState<string[]>(loadMenuOrder)
  const [shortcuts, setShortcuts] = useState<ShortcutState>(loadShortcutState)
  const [saved, setSaved] = useState(false)

  const orderedGroups = sortGroups(menuOrder)

  useEffect(() => {
    localStorage.setItem(MENU_ORDER_KEY, JSON.stringify(menuOrder))
  }, [menuOrder])

  useEffect(() => {
    localStorage.setItem(DASHBOARD_SHORTCUTS_KEY, JSON.stringify(shortcuts))
  }, [shortcuts])

  function moveMenu(id: string, direction: -1 | 1) {
    setMenuOrder((prev) => {
      const idx = prev.indexOf(id)
      if (idx < 0) return prev
      const next = idx + direction
      if (next < 0 || next >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
      return copy
    })
    setSaved(false)
  }

  function toggleShortcut(link: MenuLink) {
    setShortcuts((prev) => ({ ...prev, [link.id]: !prev[link.id] }))
    setSaved(false)
  }

  function handleSave() {
    localStorage.setItem(MENU_ORDER_KEY, JSON.stringify(menuOrder))
    localStorage.setItem(DASHBOARD_SHORTCUTS_KEY, JSON.stringify(shortcuts))
    setSaved(true)
  }

  return (
    <div className="app-page-content">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h4 className="mb-1">Menü Düzeni</h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Ana Sayfa</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/ayarlar">Ayarlar</Link>
              </li>
              <li className="breadcrumb-item active">Menü Düzeni</li>
            </ol>
          </nav>
        </div>
        <Link to="/ayarlar" className="btn btn-label-secondary">
          <i className="ti ti-arrow-left me-1" /> Ayarlara Dön
        </Link>
      </div>

      {saved && <div className="alert alert-success py-2">Ayarlar kaydedildi.</div>}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">Modül Menü Sırası</div>
            <ul className="list-group list-group-flush">
              {orderedGroups.map((group, index) => (
                <li
                  key={group.id}
                  className="list-group-item d-flex align-items-center justify-content-between gap-2"
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className={`ti ${group.icon} text-body-secondary`} />
                    <span>{group.label}</span>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-label-secondary"
                      disabled={index === 0}
                      onClick={() => moveMenu(group.id, -1)}
                      aria-label="Yukarı taşı"
                    >
                      <i className="ti ti-chevron-up" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-label-secondary"
                      disabled={index === orderedGroups.length - 1}
                      onClick={() => moveMenu(group.id, 1)}
                      aria-label="Aşağı taşı"
                    >
                      <i className="ti ti-chevron-down" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">Dashboard Kısayolları</div>
            <ul className="list-group list-group-flush">
              {dashboardLinks.map((link) => (
                <li
                  key={link.id}
                  className="list-group-item d-flex align-items-center justify-content-between gap-3"
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className={`ti ${link.icon} text-body-secondary`} />
                    <span>{link.label}</span>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`shortcut-${link.id}`}
                      checked={shortcuts[link.id] ?? true}
                      onChange={() => toggleShortcut(link)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-12">
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <i className="ti ti-device-floppy me-1" /> Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
