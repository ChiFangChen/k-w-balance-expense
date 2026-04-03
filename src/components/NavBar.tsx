import { useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartPie, faWallet, faCopy, faClockRotateLeft, faGear } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const tabs: { path: string; label: string; icon: IconDefinition }[] = [
  { path: '/', label: '總覽', icon: faChartPie },
  { path: '/expenses', label: '記帳', icon: faWallet },
  { path: '/templates', label: '模板', icon: faCopy },
  { path: '/logs', label: '紀錄', icon: faClockRotateLeft },
  { path: '/settings', label: '設定', icon: faGear },
]

export function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="navbar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`navbar-tab ${location.pathname === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="navbar-icon">
            <FontAwesomeIcon icon={tab.icon} />
          </span>
          <span className="navbar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
