import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun, faRotate, faPlus, faTrash, faSync, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
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
  const [editingRate, setEditingRate] = useState<string | null>(null)
  const [editingRateValue, setEditingRateValue] = useState('')
  const [currencySearch, setCurrencySearch] = useState('')

  const TRACKED_KEY = 'kw-tracked-currencies'
  const [trackedList, setTrackedList] = useState<string[]>(() => {
    const saved = localStorage.getItem(TRACKED_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const saveTrackedList = (list: string[]) => {
    setTrackedList(list)
    localStorage.setItem(TRACKED_KEY, JSON.stringify(list))
  }

  const handleWayneChange = (value: string) => {
    setRatioWayne(value)
    const w = parseInt(value)
    if (!isNaN(w) && w >= 0 && w <= 100) {
      setRatioKiki((100 - w).toString())
    }
  }

  const handleKikiChange = (value: string) => {
    setRatioKiki(value)
    const k = parseInt(value)
    if (!isNaN(k) && k >= 0 && k <= 100) {
      setRatioWayne((100 - k).toString())
    }
  }

  const handleRatioBlur = () => {
    const w = parseInt(ratioWayne)
    const k = parseInt(ratioKiki)
    if (!isNaN(w) && !isNaN(k) && w + k === 100 && w >= 0 && k >= 0) {
      updateSettings({ ratioWayne: w, ratioKiki: k })
    }
  }

  const handleFetchRates = async () => {
    setLoadingRates(true)
    try {
      const rates = await fetchExchangeRates(settings.defaultCurrency)
      // Update all rate values without changing the tracked list
      updateSettings({
        exchangeRates: { ...settings.exchangeRates, ...rates },
        exchangeRatesUpdatedAt: new Date().toISOString(),
      })
      setAllRates(rates)
    } catch {
      alert('取得匯率失敗，請稍後再試')
    } finally {
      setLoadingRates(false)
    }
  }

  const handleRemoveCurrency = (code: string) => {
    saveTrackedList(trackedList.filter((c) => c !== code))
  }

  const handleAddCurrency = (code: string) => {
    if (!trackedList.includes(code)) {
      saveTrackedList([...trackedList, code])
    }
    if (!settings.exchangeRates[code] && allRates[code]) {
      updateSettings({ exchangeRates: { ...settings.exchangeRates, [code]: allRates[code] } })
    }
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

  const trackedCurrencies = trackedList
    .map((code) => [code, settings.exchangeRates[code] || 0] as [string, number])
    .sort(([a], [b]) => {
      const aIdx = CURRENCY_WHITELIST.indexOf(a)
      const bIdx = CURRENCY_WHITELIST.indexOf(b)
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
      if (aIdx >= 0) return -1
      if (bIdx >= 0) return 1
      return a.localeCompare(b)
    })

  const availableToAdd = Object.keys(allRates).length > 0
    ? Object.keys(allRates).filter((code) => code !== settings.defaultCurrency && !trackedList.includes(code)).sort()
    : CURRENCY_WHITELIST.filter((c) => c !== settings.defaultCurrency && !trackedList.includes(c))

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
              onChange={(e) => handleWayneChange(e.target.value)}
              onBlur={handleRatioBlur}
              min="0"
              max="100"
            />
          </div>
          <div className="form-group flex-1">
            <label>Kiki %</label>
            <input
              type="number"
              value={ratioKiki}
              onChange={(e) => handleKikiChange(e.target.value)}
              onBlur={handleRatioBlur}
              min="0"
              max="100"
            />
          </div>
        </div>
      </section>

      {/* Default Currency */}
      <section className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>主幣別</h2>
          <span className="settings-value" style={{ marginLeft: 'auto' }}>TWD</span>
        </div>
      </section>

      {/* Exchange Rates */}
      <section className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0 }}>匯率</h2>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleFetchRates}
            disabled={loadingRates}
            title="同步匯率"
            style={{ marginLeft: '0.5rem' }}
          >
            <FontAwesomeIcon icon={faRotate} spin={loadingRates} />
          </button>
          {settings.exchangeRatesUpdatedAt && (
            <span className="settings-hint" style={{ margin: 0, marginLeft: 'auto', opacity: 0.7 }}>
              同步於 {new Date(settings.exchangeRatesUpdatedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <p className="settings-hint" style={{ margin: 0 }}>1 外幣 = ? {settings.defaultCurrency}</p>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleOpenAddCurrency}
            style={{ marginLeft: 'auto' }}
            title="新增幣別"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>

        <div className="rate-list">
          {trackedCurrencies.map(([code, rate]) => (
            <div key={code} className="rate-item">
              <span className="rate-code">{code}</span>
              {editingRate === code ? (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="rate-edit-input"
                    value={editingRateValue}
                    onChange={(e) => setEditingRateValue(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="btn-icon"
                    onClick={() => setEditingRate(null)}
                    title="取消"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                  <button
                    className="btn-icon btn-save"
                    onClick={() => {
                      const val = parseFloat(editingRateValue)
                      if (!isNaN(val) && val > 0) {
                        updateSettings({ exchangeRates: { ...settings.exchangeRates, [code]: val } })
                      }
                      setEditingRate(null)
                    }}
                    title="儲存"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="rate-value rate-value-editable"
                    onClick={() => {
                      setEditingRate(code)
                      setEditingRateValue(String(rate))
                    }}
                  >
                    {rate}
                  </span>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleRemoveCurrency(code)}
                    title="移除"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </>
              )}
            </div>
          ))}
          {trackedCurrencies.length === 0 && (
            <div className="empty-state" style={{ padding: '1rem 0' }}>尚未追蹤任何外幣</div>
          )}
        </div>
      </section>

      {/* Add Currency Dialog */}
      {showAddCurrency && (() => {
        const q = currencySearch.toUpperCase()
        const filtered = availableToAdd.filter((code) => code.includes(q))
        return (
          <div className="dialog-overlay" onClick={() => { setShowAddCurrency(false); setCurrencySearch('') }}>
            <div className="dialog" onClick={(e) => e.stopPropagation()}>
              <h3>新增追蹤幣別</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  placeholder="搜尋幣別..."
                  autoFocus
                />
              </div>
              <div style={{ height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {filtered.length === 0 ? (
                <p className="settings-hint">沒有符合的幣別</p>
              ) : (
                <>
                  {filtered.map((code) => (
                    <button
                      key={code}
                      className="btn btn-secondary"
                      onClick={() => { handleAddCurrency(code); setCurrencySearch('') }}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      {code} {allRates[code] ? `(${allRates[code].toFixed(4)})` : ''}
                    </button>
                  ))}
                </>
              )}
              </div>
              <div className="dialog-actions">
                <button className="btn btn-secondary" onClick={() => { setShowAddCurrency(false); setCurrencySearch('') }}>
                  關閉
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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

      {/* Colors */}
      <section className="settings-section">
        <h2>代表色</h2>
        <div className="color-pickers">
          <div className="color-picker-item">
            <label>Kiki</label>
            <label className="color-picker-btn" style={{ backgroundColor: settings.colorKiki }}>
              <FontAwesomeIcon icon={faSync} className="color-picker-icon" />
              <input
                type="color"
                value={settings.colorKiki}
                onChange={(e) => updateSettings({ colorKiki: e.target.value })}
                className="color-input-hidden"
              />
            </label>
          </div>
          <div className="color-picker-item">
            <label>Wayne</label>
            <label className="color-picker-btn" style={{ backgroundColor: settings.colorWayne }}>
              <FontAwesomeIcon icon={faSync} className="color-picker-icon" />
              <input
                type="color"
                value={settings.colorWayne}
                onChange={(e) => updateSettings({ colorWayne: e.target.value })}
                className="color-input-hidden"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Identity */}
      <section className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>目前身份: {state.identity}</h2>
          <button className="btn btn-sm btn-warning" onClick={handleSwitchIdentity} style={{ marginLeft: 'auto' }}>
            切換身份
          </button>
        </div>
      </section>
    </div>
  )
}
