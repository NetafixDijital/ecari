import { NavLink, useLocation } from 'react-router-dom'
import type { MenuLink } from '../../config/menu'

export default function MenuLinkItem({ item }: { item: MenuLink }) {
  const { pathname } = useLocation()
  const tone = item.tone ?? 'default'
  const isActive = item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`)

  const badge = item.badge ? (
    <span className={`menu-badge${item.badgeType ? ` menu-badge-${item.badgeType}` : ''}`}>{item.badge}</span>
  ) : null

  return (
    <li className={`menu-item${isActive ? ' active' : ''}`}>
      <NavLink to={item.to} className="menu-link" end={item.to === '/'}>
        <span className={`menu-icon menu-icon-${tone}`}>
          <i className={`ti ${item.icon}`} />
        </span>
        <span className="menu-label">{item.label}</span>
        {badge}
      </NavLink>
    </li>
  )
}
