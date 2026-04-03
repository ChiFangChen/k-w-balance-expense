import { useState } from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
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
        backgroundColor: ['#FF6B9D', '#4ECDC4'],
        borderColor: ['#FF6B9D', '#4ECDC4'],
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

      {/* Target Ratio */}
      <div className="target-ratio">
        目標比例: Kiki {settings.ratioKiki}% / Wayne {settings.ratioWayne}%
      </div>

      {/* Quick Add Buttons */}
      <div className="quick-add">
        <button className="btn quick-add-btn kiki-color" onClick={() => openForm('Kiki')}>
          K
        </button>
        <button className="btn quick-add-btn neutral-color" onClick={() => openForm()}>
          +
        </button>
        <button className="btn quick-add-btn wayne-color" onClick={() => openForm('Wayne')}>
          W
        </button>
      </div>

      {/* Totals */}
      <div className="totals-row">
        <div className="total-card kiki-card">
          <div className="total-label">Kiki</div>
          <div className="total-amount">${totals.kiki.toLocaleString()}</div>
          <div className="total-ratio">{ratio.kiki}%</div>
        </div>
        <div className="total-card wayne-card">
          <div className="total-label">Wayne</div>
          <div className="total-amount">${totals.wayne.toLocaleString()}</div>
          <div className="total-ratio">{ratio.wayne}%</div>
        </div>
      </div>

      {/* Total */}
      <div className="grand-total">
        總計: ${total.toLocaleString()} {settings.defaultCurrency}
      </div>

      {/* Gap */}
      {gap.person && (
        <div className="gap-info">
          💡 {gap.person} 還需要花 <strong>${gap.amount.toLocaleString()}</strong> {settings.defaultCurrency} 才能達到目標比例
        </div>
      )}

      {/* Pie Chart */}
      {total > 0 && (
        <div className="chart-container">
          <Pie data={pieData} options={pieOptions} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons gap-3">
        <button
          className="btn btn-warning"
          onClick={() => setShowBalanceConfirm(true)}
          disabled={total === 0}
        >
          ⚖️ 平衡
        </button>
        <button
          className="btn btn-danger"
          onClick={() => setShowResetConfirm(true)}
          disabled={total === 0}
        >
          🗑️ 重置
        </button>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showBalanceConfirm}
        title="平衡帳目"
        message={`將等比例縮小帳目金額，Kiki: $${totals.kiki.toLocaleString()}, Wayne: $${totals.wayne.toLocaleString()}`}
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
