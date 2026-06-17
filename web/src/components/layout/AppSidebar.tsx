import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  detectActiveTab,
  financeLinks,
  reportsLinks,
  settingsLinks,
  type SidebarTab,
} from '../../config/menu'
import {
  getVisibleDashboardLinks,
  loadMenuOrder,
  loadShortcutState,
  MENU_CONFIG_EVENT,
  sortModuleGroups,
} from '../../config/menuPreferences'
import MenuLinkItem from './MenuLinkItem'
import { useAuth } from '../../context/AuthContext'

const MODULE_TONES = ['primary', 'success', 'warning', 'info', 'danger', 'purple']

function MenuHeading({ label }: { label: string }) {
  return (
    <li className="menu-heading">
      <span className="menu-label">{label}</span>
    </li>
  )
}

function TabPane({
  id,
  activeTab,
  tabKey,
  children,
}: {
  id: string
  activeTab: SidebarTab
  tabKey: SidebarTab
  children: React.ReactNode
}) {
  const show = activeTab === tabKey ? ' show active' : ''
  return (
    <div className={`tab-pane fade${show}`} id={id} role="tabpanel">
      <nav className="app-navbar">
        <ul className="side-menubar">{children}</ul>
      </nav>
    </div>
  )
}

export default function AppSidebar({ panelOpen }: { panelOpen: boolean }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout, hasPermission } = useAuth()
  const visibleSettingsLinks = settingsLinks.filter(
    (item) => item.id !== 'ayarlar-kullanicilar' || hasPermission('AUTH.USER.VIEW'),
  )
  const [menuOrder, setMenuOrder] = useState(loadMenuOrder)
  const [shortcuts, setShortcuts] = useState(loadShortcutState)
  const orderedModuleGroups = useMemo(() => sortModuleGroups(menuOrder), [menuOrder])
  const visibleDashboardLinks = useMemo(() => getVisibleDashboardLinks(shortcuts), [shortcuts])
  const activeTab = detectActiveTab(pathname)
  const [openTab, setOpenTab] = useState<SidebarTab>(activeTab)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const isGroupActive = (group: (typeof orderedModuleGroups)[number]) => {
    if (group.to && pathname.startsWith(group.to)) return true
    return group.children?.some((child) => pathname.startsWith(child.to)) ?? false
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  useEffect(() => {
    const refreshMenu = () => {
      setMenuOrder(loadMenuOrder())
      setShortcuts(loadShortcutState())
    }
    window.addEventListener(MENU_CONFIG_EVENT, refreshMenu)
    window.addEventListener('storage', refreshMenu)
    return () => {
      window.removeEventListener(MENU_CONFIG_EVENT, refreshMenu)
      window.removeEventListener('storage', refreshMenu)
    }
  }, [])

  useEffect(() => {
    setOpenTab(activeTab)
  }, [activeTab])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function railTab(tabId: SidebarTab, icon: string, title: string) {
    const active = openTab === tabId ? ' active' : ''
    return (
      <li className="nav-item" title={title}>
        <button
          type="button"
          className={`menu-link border-0 bg-transparent w-100${active}`}
          onClick={() => setOpenTab(tabId)}
          aria-controls={tabId}
        >
          <i className={`ti ${icon}`} />
        </button>
      </li>
    )
  }

  return (
    <aside className={`app-menubar-tabs${panelOpen ? ' open' : ''}`} id="appMenubar">
      <div className="app-navbar-brand">
        <Link className="navbar-brand-logo" to="/">
          eC
        </Link>
      </div>
      <div className="app-navbar-tabs">
        <ul className="nav" role="tablist">
          {railTab('dashboardTab', 'ti-smart-home', 'Dashboard')}
          {railTab('modulesTab', 'ti-apps', 'Modüller')}
          {railTab('financeTab', 'ti-chart-pie', 'Finans')}
          {railTab('reportsTab', 'ti-report-analytics', 'Raporlar')}
          <li className="nav-item-hr" />
          {railTab('settingsTab', 'ti-settings', 'Ayarlar')}
          <li className="nav-item mb-auto" />
          <li className="nav-item" title="Yeni Satış Faturası">
            <Link to="/fatura/yeni" className="btn-add-module">
              <i className="ti ti-plus" />
            </Link>
          </li>
          <li className="nav-item-hr" />
          <li className="nav-item" title="Çıkış">
            <button type="button" className="menu-link border-0 bg-transparent w-100" onClick={handleLogout}>
              <i className="ti ti-logout" />
            </button>
          </li>
        </ul>
      </div>
      <div className="app-tab-content">
        <div className="app-side-brands">
          <Link className="navbar-brand-text" to="/">
            e-Cari
          </Link>
        </div>
        <div className="app-content-inner">
          <div className="tab-content" id="appMenubarTabsContent">
            <TabPane id="dashboardTab" activeTab={openTab} tabKey="dashboardTab">
              <MenuHeading label="Dashboard" />
              {visibleDashboardLinks.slice(0, 3).map((item) => (
                <MenuLinkItem key={item.id} item={item} />
              ))}
              <MenuHeading label="Hızlı Erişim" />
              {visibleDashboardLinks.slice(3, 6).map((item) => (
                <MenuLinkItem key={item.id} item={item} />
              ))}
              <MenuHeading label="Özet" />
              {visibleDashboardLinks.slice(6).map((item) => (
                <MenuLinkItem key={item.id} item={item} />
              ))}
            </TabPane>

            <TabPane id="modulesTab" activeTab={openTab} tabKey="modulesTab">
              <MenuHeading label="Modüller" />
              {orderedModuleGroups.map((group, idx) => {
                const tone = MODULE_TONES[idx % MODULE_TONES.length]
                const expanded = expandedGroups[group.id] ?? isGroupActive(group)
                return (
                  <li key={group.id}>
                    {group.children ? (
                      <>
                        <li className="menu-item">
                          <button
                            type="button"
                            className="menu-link border-0 bg-transparent w-100 text-start d-flex align-items-center gap-2"
                            onClick={() => toggleGroup(group.id)}
                          >
                            <i className={`ti ${group.icon}`} />
                            <span className="flex-grow-1">{group.label}</span>
                            <i className={`ti ${expanded ? 'ti-chevron-down' : 'ti-chevron-right'} small`} />
                          </button>
                        </li>
                        {expanded &&
                          group.children.map((child) => (
                            <MenuLinkItem key={child.id} item={{ ...child, icon: group.icon, tone }} />
                          ))}
                        <li>
                          <div className="menu-divider" />
                        </li>
                      </>
                    ) : group.to ? (
                      <MenuLinkItem
                        item={{
                          id: group.id,
                          label: group.label,
                          icon: group.icon,
                          to: group.to,
                          tone,
                        }}
                      />
                    ) : null}
                  </li>
                )
              })}
            </TabPane>

            <TabPane id="financeTab" activeTab={openTab} tabKey="financeTab">
              <MenuHeading label="Finans" />
              {financeLinks.slice(0, 3).map((item) => (
                <MenuLinkItem key={item.id} item={item} />
              ))}
              <MenuHeading label="Tahsilat" />
              {financeLinks.slice(3).map((item) => (
                <MenuLinkItem key={item.id} item={item} />
              ))}
            </TabPane>

            <TabPane id="reportsTab" activeTab={openTab} tabKey="reportsTab">
              <MenuHeading label="Raporlar" />
              {reportsLinks.map((item) => (
                <MenuLinkItem key={item.id} item={item} />
              ))}
            </TabPane>

            <TabPane id="settingsTab" activeTab={openTab} tabKey="settingsTab">
              <MenuHeading label="Sistem" />
              {visibleSettingsLinks.map((item) => (
                <MenuLinkItem key={item.id} item={item} />
              ))}
            </TabPane>
          </div>
          <div className="card-gradient d-none d-xl-block">
            <h6>e-Cari Pro</h6>
            <p>Gelişmiş raporlar, e-fatura entegrasyonu ve çoklu kullanıcı desteği.</p>
            <Link to="/ayarlar/ozel" className="btn btn-light btn-sm">
              Detaylar
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
