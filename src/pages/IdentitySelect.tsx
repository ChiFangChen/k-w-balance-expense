import { useApp } from '../context/AppContext'
import { Person } from '../types'

export function IdentitySelect() {
  const { setIdentity } = useApp()

  return (
    <div className="identity-page">
      <div className="identity-content">
        <h1 className="identity-title">KW Balance</h1>
        <p className="identity-subtitle">你是誰？</p>
        <div className="identity-buttons">
          <button
            className="identity-btn kiki-btn"
            onClick={() => setIdentity('Kiki')}
          >
            <span className="identity-emoji">👩</span>
            <span className="identity-name">Kiki</span>
          </button>
          <button
            className="identity-btn wayne-btn"
            onClick={() => setIdentity('Wayne')}
          >
            <span className="identity-emoji">👨</span>
            <span className="identity-name">Wayne</span>
          </button>
        </div>
      </div>
    </div>
  )
}
