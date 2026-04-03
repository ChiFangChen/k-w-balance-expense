import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Person, Expense } from '../types'
import { convertToDefault } from '../utils/currency'

interface ExpenseFormProps {
  defaultPayer?: Person
  editingExpense?: Expense
  onClose: () => void
}

export function ExpenseForm({ defaultPayer, editingExpense, onClose }: ExpenseFormProps) {
  const { state, addExpense, updateExpense } = useApp()
  const { settings } = state

  const [payer, setPayer] = useState<Person>(editingExpense?.payer || defaultPayer || 'Kiki')
  const [item, setItem] = useState(editingExpense?.item || '')
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '')
  const [currency, setCurrency] = useState(editingExpense?.currency || settings.defaultCurrency)
  const [datetime, setDatetime] = useState(
    editingExpense
      ? editingExpense.createdAt.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  )

  const availableCurrencies = [settings.defaultCurrency, ...Object.keys(settings.exchangeRates)]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (!item.trim() || isNaN(numAmount) || numAmount <= 0) return

    const { convertedAmount, exchangeRate } = convertToDefault(
      numAmount,
      currency,
      settings.defaultCurrency,
      settings.exchangeRates
    )

    if (editingExpense) {
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
    }
    onClose()
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog expense-form" onClick={(e) => e.stopPropagation()}>
        <h3>{editingExpense ? '編輯帳目' : '新增帳目'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>誰付的</label>
            <div className="payer-select">
              <button
                type="button"
                className={`btn ${payer === 'Kiki' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPayer('Kiki')}
              >
                Kiki
              </button>
              <button
                type="button"
                className={`btn ${payer === 'Wayne' ? 'btn-primary' : 'btn-secondary'}`}
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
              placeholder="例如：錢都"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>金額</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="any"
                required
              />
            </div>
            <div className="form-group">
              <label>幣別</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {availableCurrencies.map((c) => (
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

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {editingExpense ? '更新' : '新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
