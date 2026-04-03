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

function AppContent() {
  const { state } = useApp()

  if (!state.identity) {
    return <IdentitySelect />
  }

  return (
    <BrowserRouter basename="/k-w-balance-expense">
      <div className={`app theme-${state.settings.theme}`}>
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
