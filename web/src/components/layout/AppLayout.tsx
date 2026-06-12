import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import SearchResultsModal from './SearchResultsModal'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = useCallback(() => {
    const toggler = document.getElementById('nl-sidebar-toggle')
    toggler?.classList.toggle('active')

    setSidebarOpen((v) => {
      const next = !v
      if (window.innerWidth >= 1280) {
        const docEl = document.documentElement
        const current = docEl.getAttribute('data-app-sidebar')
        if (current === 'mini' || current === 'mini-hover') {
          docEl.setAttribute('data-app-sidebar', 'full')
        } else {
          docEl.setAttribute('data-app-sidebar', 'mini')
        }
      }
      return next
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-app-sidebar', 'full')
  }, [])

  useEffect(() => {
    const menubar = document.getElementById('appMenubar')
    const layout = document.querySelector('.page-layout')
    if (!menubar || !layout) return

    if (sidebarOpen) {
      menubar.classList.add('open')
      if (window.innerWidth < 1480) layout.classList.add('sidebar-open')
    } else {
      menubar.classList.remove('open')
      layout.classList.remove('sidebar-open')
    }
  }, [sidebarOpen])

  useEffect(() => {
    const menubar = document.getElementById('appMenubar')
    const docEl = document.documentElement

    const onMouseEnter = () => {
      if (docEl.getAttribute('data-app-sidebar') === 'mini') {
        docEl.setAttribute('data-app-sidebar', 'mini-hover')
      }
    }
    const onMouseLeave = () => {
      if (docEl.getAttribute('data-app-sidebar') === 'mini-hover') {
        docEl.setAttribute('data-app-sidebar', 'mini')
      }
    }

    menubar?.addEventListener('mouseenter', onMouseEnter)
    menubar?.addEventListener('mouseleave', onMouseLeave)
    return () => {
      menubar?.removeEventListener('mouseenter', onMouseEnter)
      menubar?.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  useEffect(() => {
    const onResize = () => {
      const layout = document.querySelector('.page-layout')
      const menubar = document.getElementById('appMenubar')
      if (!layout || !menubar) return
      if (!sidebarOpen) {
        layout.classList.remove('sidebar-open')
        return
      }
      if (window.innerWidth < 1480) layout.classList.add('sidebar-open')
      else layout.classList.remove('sidebar-open')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [sidebarOpen])

  return (
    <div className="page-layout">
      <AppSidebar />
      <div
        className="layout-overlay"
        onClick={() => setSidebarOpen(false)}
        onKeyDown={() => undefined}
        role="presentation"
      />
      <AppHeader onToggleSidebar={toggleSidebar} />
      <main className="app-wrapper">
        <div className="container-fluid">
          <Outlet />
          <footer className="app-content-footer">
            <div className="d-flex flex-wrap justify-content-between gap-2">
              <span>
                &copy; {new Date().getFullYear()} <strong>e-Cari</strong> — Ön Muhasebe
              </span>
              <div className="d-flex gap-3">
                <Link to="/ayarlar" className="text-body-secondary text-decoration-none">
                  Ayarlar
                </Link>
                <span className="text-body-secondary">v2.0 NexLink</span>
              </div>
            </div>
          </footer>
        </div>
      </main>
      <SearchResultsModal />
    </div>
  )
}
