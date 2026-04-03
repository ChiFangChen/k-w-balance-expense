import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/', label: '總覽', icon: '📊' },
  { path: '/expenses', label: '記帳', icon: '💰' },
  { path: '/templates', label: '模板', icon: '📋' },
  { path: '/logs', label: '紀錄', icon: '📜' },
  { path: '/settings', label: '設定', icon: '⚙️' },
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
          <span className="navbar-icon">{tab.icon}</span>
          <span className="navbar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
