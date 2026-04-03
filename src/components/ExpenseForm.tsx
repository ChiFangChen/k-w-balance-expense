import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Person, Expense } from '../types'
import { convertToDefault } from '../utils/currency'

const CURRENCY_WHITELIST = ['TWD', 'JPY', 'THB', 'USD', 'CNY']

interface ExpenseFormProps {
  defaultPayer?: Person
  editingExpense?: Expense
  onClose: () => void
}

export function ExpenseForm({ defaultPayer, editingExpense, onClose }: ExpenseFormProps) {
  const { state, addExpense, updateExpense, addTemplate } = useApp()
  const { settings } = state

  const [payer, setPayer] = useState<Person | undefined>(editingExpense?.payer || defaultPayer)
  const [item, setItem] = useState(editingExpense?.item || '')
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '')
  const [currency, setCurrency] = useState(editingExpense?.currency || settings.defaultCurrency)
  const [datetime, setDatetime] = useState(
    editingExpense
      ? editingExpense.createdAt.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!payer || !item.trim() || isNaN(numAmount) || numAmount <= 0) return

    const { convertedAmount, exchangeRate } = convertToDefault(
      numAmount,
      currency,
      settings.defaultCurrency,
      settings.exchangeRates
    )

    if (editingExpense && editingExpense.id) {
      updateExpense({
        ...editingExpense,
        payer,
        item: item.trim(),
        amount: numAmount,
        currency,
        exchangeRate,
        convertedAmount,
        createdAt: new Date(datetime).toISOString(),
      })
    } else {
      addExpense({
        payer,
        item: item.trim(),
        amount: numAmount,
        currency,
        exchangeRate,
        convertedAmount,
      })

      if (saveAsTemplate) {
        addTemplate({
          payer,
          item: item.trim(),
          amount: numAmount,
          currency,
        })
      }
    }
    onClose()
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup expense-form" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>{editingExpense ? '編輯帳目' : '新增帳目'}</h3>
        </div>
        <div className="popup-body">
          <form id="expense-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>誰付的</label>
              <div className="payer-select">
                <button
                  type="button"
                  className={`btn ${payer === 'Kiki' ? 'btn-primary' : 'btn-secondary'}`}
                  style={payer === 'Kiki' ? { background: 'var(--color-kiki)', color: 'white' } : {}}
                  onClick={() => setPayer('Kiki')}
                >
                  Kiki
                </button>
                <button
                  type="button"
                  className={`btn ${payer === 'Wayne' ? 'btn-primary' : 'btn-secondary'}`}
                  style={payer === 'Wayne' ? { background: 'var(--color-wayne)', color: 'white' } : {}}
                  onClick={() => setPayer('Wayne')}
                >
                  Wayne
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>品項</label>
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>金額</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                  required
                />
              </div>
              <div className="form-group">
                <label>幣別</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCY_WHITELIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {currency !== settings.defaultCurrency && (
              <div className="exchange-info">
                匯率: 1 {currency} = {settings.exchangeRates[currency] || '?'} {settings.defaultCurrency}
              </div>
            )}

            <div className="form-group">
              <label>時間</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
            </div>

            {!editingExpense && (
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                同時儲存為模板
              </label>
            )}
          </form>
        </div>
        <div className="popup-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button type="submit" form="expense-form" className="btn btn-primary" disabled={!payer}>
            {editingExpense ? '更新' : '新增'}
          </button>
        </div>
      </div>
    </div>
  )
}
