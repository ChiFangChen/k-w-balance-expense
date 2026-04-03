import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { IdentitySelect } from './pages/IdentitySelect'
import { Dashboard } from './pages/Dashboard'
import { Expenses } from './pages/Expenses'
import { Templates } from './pages/Templates'
import { SettingsPage } from './pages/Settings'
import { OperationLogs } from './pages/OperationLogs'
import { NavBar } from './components/NavBar'
import './App.css'

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function AppContent() {
  const { state } = useApp()

  if (!state.identity) {
    return <IdentitySelect />
  }

  const kikiRgb = hexToRgb(state.settings.colorKiki)
  const wayneRgb = hexToRgb(state.settings.colorWayne)

  return (
    <BrowserRouter basename="/k-w-balance-expense">
      <div
        className={`app theme-${state.settings.theme}`}
        style={{
          '--color-kiki': state.settings.colorKiki,
          '--color-kiki-light': `rgba(${kikiRgb.r}, ${kikiRgb.g}, ${kikiRgb.b}, 0.15)`,
          '--color-wayne': state.settings.colorWayne,
          '--color-wayne-light': `rgba(${wayneRgb.r}, ${wayneRgb.g}, ${wayneRgb.b}, 0.15)`,
        } as React.CSSProperties}
      >
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/logs" element={<OperationLogs />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <NavBar />
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
