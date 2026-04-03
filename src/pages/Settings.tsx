import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun, faRotate, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useApp } from '../context/AppContext'
import { fetchExchangeRates } from '../utils/currency'
import { clearIdentity } from '../utils/storage'

const CURRENCY_WHITELIST = ['TWD', 'JPY', 'THB', 'USD', 'CNY']

export function SettingsPage() {
  const { state, updateSettings } = useApp()
  const { settings } = state

  const [ratioWayne, setRatioWayne] = useState(settings.ratioWayne.toString())
  const [ratioKiki, setRatioKiki] = useState(settings.ratioKiki.toString())
  const [loadingRates, setLoadingRates] = useState(false)
  const [showAddCurrency, setShowAddCurrency] = useState(false)
  const [allRates, setAllRates] = useState<Record<string, number>>({})

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
      // Only update rates for currencies we're tracking
      const trackedCodes = Object.keys(settings.exchangeRates)
      const updatedRates: Record<string, number> = {}
      for (const code of trackedCodes) {
        if (rates[code]) {
          updatedRates[code] = rates[code]
        }
      }
      updateSettings({ exchangeRates: { ...settings.exchangeRates, ...updatedRates } })
      setAllRates(rates) // Store all rates for the "add" dialog
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

  const handleRemoveCurrency = (code: string) => {
    const newRates = { ...settings.exchangeRates }
    delete newRates[code]
    updateSettings({ exchangeRates: newRates })
  }

  const handleAddCurrency = async (code: string) => {
    // If we have fetched rates, use them; otherwise set to 1
    const rate = allRates[code] || settings.exchangeRates[code] || 1
    updateSettings({
      exchangeRates: { ...settings.exchangeRates, [code]: rate },
    })
    setShowAddCurrency(false)
  }

  const handleOpenAddCurrency = async () => {
    if (Object.keys(allRates).length === 0) {
      // Fetch rates first to populate the dropdown
      try {
        const rates = await fetchExchangeRates(settings.defaultCurrency)
        setAllRates(rates)
      } catch {
        // Fallback: show common currencies
      }
    }
    setShowAddCurrency(true)
  }

  const handleSwitchIdentity = () => {
    clearIdentity()
    window.location.reload()
  }

  const themes = [
    { value: 'dark' as const, label: '深色', icon: faMoon },
    { value: 'light' as const, label: '亮色', icon: faSun },
  ]

  const trackedCurrencies = Object.entries(settings.exchangeRates)
    .filter(([code]) => code !== settings.defaultCurrency)
    .sort(([a], [b]) => {
      const aIdx = CURRENCY_WHITELIST.indexOf(a)
      const bIdx = CURRENCY_WHITELIST.indexOf(b)
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
      if (aIdx >= 0) return -1
      if (bIdx >= 0) return 1
      return a.localeCompare(b)
    })

  // Currencies available to add (from API rates, not already tracked)
  const availableToAdd = Object.keys(allRates)
    .filter((code) => code !== settings.defaultCurrency && !settings.exchangeRates[code])
    .sort()

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
        <button className="btn btn-primary" onClick={handleRatioSave} style={{ marginTop: '0.75rem' }}>
          儲存
        </button>
      </section>

      {/* Default Currency */}
      <section className="settings-section">
        <h2>預設幣別</h2>
        <div className="form-group">
          <select
            value={settings.defaultCurrency}
            onChange={(e) => updateSettings({ defaultCurrency: e.target.value })}
          >
            {CURRENCY_WHITELIST.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Exchange Rates */}
      <section className="settings-section">
        <h2>匯率管理</h2>
        <p className="settings-hint">1 外幣 = ? {settings.defaultCurrency}</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleFetchRates}
            disabled={loadingRates}
            style={{ flex: 1 }}
          >
            <FontAwesomeIcon icon={faRotate} spin={loadingRates} />
            {loadingRates ? ' 取得中...' : ' 更新匯率'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleOpenAddCurrency}
          >
            <FontAwesomeIcon icon={faPlus} /> 新增
          </button>
        </div>

        <div className="rate-list">
          {trackedCurrencies.map(([code, rate]) => (
            <div key={code} className="rate-item">
              <span className="rate-code">{code}</span>
              <input
                type="number"
                className="rate-input"
                defaultValue={rate}
                step="any"
                onBlur={(e) => handleUpdateRate(code, e.target.value)}
              />
              <button
                className="btn-icon btn-delete"
                onClick={() => handleRemoveCurrency(code)}
                title="移除"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          ))}
          {trackedCurrencies.length === 0 && (
            <div className="empty-state" style={{ padding: '1rem 0' }}>尚未追蹤任何外幣</div>
          )}
        </div>
      </section>

      {/* Add Currency Dialog */}
      {showAddCurrency && (
        <div className="dialog-overlay" onClick={() => setShowAddCurrency(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>新增追蹤幣別</h3>
            {availableToAdd.length === 0 && Object.keys(allRates).length === 0 ? (
              <p className="settings-hint">載入幣別中...</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {(availableToAdd.length > 0 ? availableToAdd : CURRENCY_WHITELIST.filter(c => c !== settings.defaultCurrency && !settings.exchangeRates[c])).map((code) => (
                  <button
                    key={code}
                    className="btn btn-secondary"
                    onClick={() => handleAddCurrency(code)}
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {code} {allRates[code] ? `(${allRates[code].toFixed(4)})` : ''}
                  </button>
                ))}
              </div>
            )}
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddCurrency(false)}>
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

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
              <FontAwesomeIcon icon={t.icon} /> {t.label}
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
