import { useState } from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faScaleBalanced, faTrashCan, faPlus } from '@fortawesome/free-solid-svg-icons'
import { useApp } from '../context/AppContext'
import { calculateTotals, calculateCurrentRatio, calculateGap } from '../utils/balance'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ExpenseForm } from '../components/ExpenseForm'
import type { Person } from '../types'

ChartJS.register(ArcElement, Tooltip, Legend)

export function Dashboard() {
  const { state, performBalanceAction, performResetAction } = useApp()
  const { expenses, settings } = state

  const [showBalanceConfirm, setShowBalanceConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [defaultPayer, setDefaultPayer] = useState<Person | undefined>()

  const totals = calculateTotals(expenses)
  const ratio = calculateCurrentRatio(totals)
  const gap = calculateGap(totals, settings)
  const total = totals.kiki + totals.wayne

  const pieData = {
    labels: ['Kiki', 'Wayne'],
    datasets: [
      {
        data: [totals.kiki || 0, totals.wayne || 0],
        backgroundColor: [settings.colorKiki, settings.colorWayne],
        borderColor: [settings.colorKiki, settings.colorWayne],
        borderWidth: 2,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  const openForm = (payer?: Person) => {
    setDefaultPayer(payer)
    setShowExpenseForm(true)
  }

  return (
    <div className="page dashboard">
      <header className="page-header">
        <h1>KW Balance</h1>
        <span className="identity-badge">{state.identity}</span>
      </header>

      {/* Gap - most prominent */}
      {gap.person ? (
        <div className="gap-hero">
          <div className="gap-hero-person" style={{ color: gap.person === 'Kiki' ? 'var(--color-kiki)' : 'var(--color-wayne)' }}>
            {gap.person}
          </div>
          <div className="gap-hero-amount">
            還需花 <strong>${Math.ceil(gap.amount).toLocaleString()}</strong> {settings.defaultCurrency} 才能平衡
          </div>
        </div>
      ) : total > 0 ? (
        <div className="gap-hero gap-hero-balanced">
          <div className="gap-hero-label">目前已平衡</div>
        </div>
      ) : null}

      {/* Quick Add Buttons */}
      <div className="quick-add">
        <button className="btn quick-add-btn kiki-color" onClick={() => openForm('Kiki')}>
          K
        </button>
        <button className="btn quick-add-btn neutral-color" onClick={() => openForm()}>
          <FontAwesomeIcon icon={faPlus} />
        </button>
        <button className="btn quick-add-btn wayne-color" onClick={() => openForm('Wayne')}>
          W
        </button>
      </div>

      {/* Ratio Cards */}
      <div className="totals-row">
        <div className="total-card kiki-card">
          <div className="total-label">Kiki</div>
          <div className="total-ratio-main">{ratio.kiki}%</div>
          <div className="total-amount-sub">${Math.ceil(totals.kiki).toLocaleString()}</div>
        </div>
        <div className="total-card wayne-card">
          <div className="total-label">Wayne</div>
          <div className="total-ratio-main">{ratio.wayne}%</div>
          <div className="total-amount-sub">${Math.ceil(totals.wayne).toLocaleString()}</div>
        </div>
      </div>

      {/* Target Ratio Bar */}
      <div className="target-ratio-bar">
        <div className="target-ratio-label">目標比例</div>
        <div className="target-ratio-track">
          <div
            className="target-ratio-fill kiki-fill"
            style={{ width: `${settings.ratioKiki}%`, backgroundColor: settings.colorKiki }}
          >
            {settings.ratioKiki}%
          </div>
          <div
            className="target-ratio-fill wayne-fill"
            style={{ width: `${settings.ratioWayne}%`, backgroundColor: settings.colorWayne }}
          >
            {settings.ratioWayne}%
          </div>
        </div>
      </div>

      {/* Pie Chart */}
      {total > 0 && (
        <div className="chart-container">
          <Pie data={pieData} options={pieOptions} />
        </div>
      )}

      {/* Grand Total - de-emphasized */}
      {total > 0 && (
        <div className="grand-total-muted">
          總計: ${Math.ceil(total).toLocaleString()} {settings.defaultCurrency}
        </div>
      )}

      {/* Action Buttons - only show when there's data */}
      {total > 0 && (
        <div className="action-buttons">
          <button
            className="btn btn-warning"
            onClick={() => setShowBalanceConfirm(true)}
          >
            <FontAwesomeIcon icon={faScaleBalanced} /> 平衡
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setShowResetConfirm(true)}
          >
            <FontAwesomeIcon icon={faTrashCan} /> 重置
          </button>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showBalanceConfirm}
        title="平衡帳目"
        message={`將等比例縮小帳目金額，Kiki: $${Math.ceil(totals.kiki).toLocaleString()}, Wayne: $${Math.ceil(totals.wayne).toLocaleString()}`}
        confirmText="執行平衡"
        onConfirm={() => {
          performBalanceAction()
          setShowBalanceConfirm(false)
        }}
        onCancel={() => setShowBalanceConfirm(false)}
        danger
      />
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="重置帳目"
        message="將刪除所有帳目資料，此操作無法復原！"
        confirmText="執行重置"
        onConfirm={() => {
          performResetAction()
          setShowResetConfirm(false)
        }}
        onCancel={() => setShowResetConfirm(false)}
        danger
      />

      {/* Expense Form */}
      {showExpenseForm && (
        <ExpenseForm
          defaultPayer={defaultPayer}
          onClose={() => setShowExpenseForm(false)}
        />
      )}
    </div>
  )
}
