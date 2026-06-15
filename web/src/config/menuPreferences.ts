import { dashboardLinks, moduleGroups, type MenuGroup, type MenuLink } from './menu'

export const MENU_ORDER_KEY = 'ecari_menu_order'
export const DASHBOARD_SHORTCUTS_KEY = 'ecari_dashboard_shortcuts'
export const MENU_CONFIG_EVENT = 'ecari-menu-config-changed'

export function loadMenuOrder(): string[] {
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

export function loadShortcutState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DASHBOARD_SHORTCUTS_KEY)
    if (!raw) {
      return Object.fromEntries(dashboardLinks.map((l) => [l.id, true]))
    }
    const parsed = JSON.parse(raw) as Record<string, boolean>
    const state: Record<string, boolean> = {}
    for (const link of dashboardLinks) {
      state[link.id] = parsed[link.id] ?? true
    }
    return state
  } catch {
    return Object.fromEntries(dashboardLinks.map((l) => [l.id, true]))
  }
}

export function sortModuleGroups(order: string[]): MenuGroup[] {
  const map = new Map(moduleGroups.map((g) => [g.id, g]))
  return order.map((id) => map.get(id)).filter((g): g is MenuGroup => Boolean(g))
}

export function getVisibleDashboardLinks(shortcuts: Record<string, boolean>): MenuLink[] {
  return dashboardLinks.filter((link) => shortcuts[link.id] !== false)
}

export function notifyMenuConfigChanged() {
  window.dispatchEvent(new CustomEvent(MENU_CONFIG_EVENT))
}
