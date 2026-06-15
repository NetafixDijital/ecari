import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import SearchResultsModal from './SearchResultsModal'
import { FullscreenProvider, useFullscreenState } from '../../context/FullscreenContext'

function FullscreenRouteSync() {
  const location = useLocation()
  const { setFullscreen } = useFullscreenState()

  useEffect(() => {
    setFullscreen(false)
  }, [location.pathname, setFullscreen])

  return null
}

function syncSidebarOverlay(panelOpen: boolean) {
  const layout = document.querySelector('.page-layout')
  if (!layout) return
  const w = window.innerWidth
  if (!panelOpen) {
    layout.classList.remove('sidebar-open')
    return
  }
  if (w < 1480) layout.classList.add('sidebar-open')
  else layout.classList.remove('sidebar-open')
}

function closeSidebarPanel(setPanelOpen: (v: boolean) => void) {
  const toggler = document.getElementById('nl-sidebar-toggle')
  toggler?.classList.remove('active')
  setPanelOpen(false)
  syncSidebarOverlay(false)
}

export default function AppLayout() {
  const [panelOpen, setPanelOpen] = useState(false)

  const toggleSidebar = useCallback(() => {
    const toggler = document.getElementById('nl-sidebar-toggle')
    toggler?.classList.toggle('active')

    setPanelOpen((prev) => {
      const next = !prev
      syncSidebarOverlay(next)
      return next
    })

    if (window.innerWidth >= 1280) {
      const docEl = document.documentElement
      const current = docEl.getAttribute('data-app-sidebar')
      if (current === 'mini' || current === 'mini-hover') {
        docEl.setAttribute('data-app-sidebar', 'full')
      } else {
        docEl.setAttribute('data-app-sidebar', 'mini')
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-app-sidebar', 'full')
  }, [])

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
      const w = window.innerWidth
      if (w >= 1480) {
        closeSidebarPanel(setPanelOpen)
        return
      }
      if (w >= 1200 && w < 1480) {
        setPanelOpen(false)
        syncSidebarOverlay(false)
        return
      }
      syncSidebarOverlay(panelOpen)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [panelOpen])

  return (
    <FullscreenProvider>
    <FullscreenRouteSync />
    <div className="page-layout">
      <AppSidebar panelOpen={panelOpen} />
      <div
        className="layout-overlay"
        onClick={() => closeSidebarPanel(setPanelOpen)}
        onKeyDown={() => undefined}
        role="presentation"
      />
      <AppHeader onToggleSidebar={toggleSidebar} />
      <main className="app-wrapper" id="appMainContent">
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
    </FullscreenProvider>
  )
}
