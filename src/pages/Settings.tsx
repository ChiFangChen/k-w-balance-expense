import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { fetchExchangeRates } from '../utils/currency'
import { clearIdentity } from '../utils/storage'

export function SettingsPage() {
  const { state, updateSettings } = useApp()
  const { settings } = state

  const [ratioWayne, setRatioWayne] = useState(settings.ratioWayne.toString())
  const [ratioKiki, setRatioKiki] = useState(settings.ratioKiki.toString())
  const [loadingRates, setLoadingRates] = useState(false)
  const CURRENCY_WHITELIST = ['TWD', 'JPY', 'THB', 'USD', 'CNY']

  const handleRatioSave = () => {
    const w = parseInt(ratioWayne)
    const k = parseInt(ratioKiki)
    if (isNaN(w) || isNaN(k) || w + k !== 100) {
      alert('比例總和必須為 100')
      return
    }
    updateSettings({ ratioWayne: w, ratioKiki: k })
  }

  const handleFetchRates = async () => {
    setLoadingRates(true)
    try {
      const rates = await fetchExchangeRates(settings.defaultCurrency)
      updateSettings({ exchangeRates: rates })
    } catch {
      alert('取得匯率失敗，請稍後再試')
    } finally {
      setLoadingRates(false)
    }
  }

  const handleUpdateRate = (code: string, newRate: string) => {
    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate <= 0) return
    updateSettings({
      exchangeRates: { ...settings.exchangeRates, [code]: rate },
    })
  }

  const handleSwitchIdentity = () => {
    clearIdentity()
    window.location.reload()
  }

  const themes = [
    { value: 'dark' as const, label: '🌙 深色簡約' },
    { value: 'light' as const, label: '☀️ 亮色簡約' },
  ]

  const displayedRates = Object.entries(settings.exchangeRates)
    .filter(([code]) => CURRENCY_WHITELIST.includes(code))
    .sort(([a], [b]) => CURRENCY_WHITELIST.indexOf(a) - CURRENCY_WHITELIST.indexOf(b))

  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1>設定</h1>
      </header>

      {/* Ratio */}
      <section className="settings-section">
        <h2>分擔比例</h2>
        <div className="form-row">
          <div className="form-group flex-1">
            <label>Wayne %</label>
            <input
              type="number"
              value={ratioWayne}
              onChange={(e) => setRatioWayne(e.target.value)}
              min="0"
              max="100"
            />
          </div>
          <div className="form-group flex-1">
            <label>Kiki %</label>
            <input
              type="number"
              value={ratioKiki}
              onChange={(e) => setRatioKiki(e.target.value)}
              min="0"
              max="100"
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleRatioSave}>
          儲存
        </button>
      </section>

      {/* Default Currency */}
      <section className="settings-section">
        <h2>預設幣別</h2>
        <div className="form-group">
          <input
            type="text"
            value={settings.defaultCurrency}
            onChange={(e) => updateSettings({ defaultCurrency: e.target.value.toUpperCase() })}
            placeholder="TWD"
          />
        </div>
      </section>

      {/* Exchange Rates */}
      <section className="settings-section">
        <h2>匯率管理</h2>
        <p className="settings-hint">1 外幣 = ? {settings.defaultCurrency}</p>
        <button
          className="btn btn-primary"
          onClick={handleFetchRates}
          disabled={loadingRates}
        >
          {loadingRates ? '取得中...' : '🔄 取得最新匯率'}
        </button>

        <div className="rate-list">
          {displayedRates.map(([code, rate]) => (
            <div key={code} className="rate-item">
              <span className="rate-code">{code}</span>
              <input
                type="number"
                className="rate-input"
                defaultValue={rate}
                step="any"
                onBlur={(e) => handleUpdateRate(code, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section className="settings-section">
        <h2>主題</h2>
        <div className="theme-buttons">
          {themes.map((t) => (
            <button
              key={t.value}
              className={`btn ${settings.theme === t.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => updateSettings({ theme: t.value })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Identity */}
      <section className="settings-section">
        <h2>目前身份: {state.identity}</h2>
        <button className="btn btn-warning" onClick={handleSwitchIdentity}>
          切換身份
        </button>
      </section>
    </div>
  )
}
