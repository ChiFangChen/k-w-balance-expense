import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { ExpenseForm } from '../components/ExpenseForm'
import type { Person, Expense } from '../types'

export function Expenses() {
  const { state, deleteExpense } = useApp()
  const { expenses, settings } = state

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Person>('all')
  const [showForm, setShowForm] = useState(false)
  const [defaultPayer, setDefaultPayer] = useState<Person | undefined>()
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filter !== 'all' && e.payer !== filter) return false
        if (search && !e.item.toLowerCase().includes(search.toLowerCase())) return false
        return true
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [expenses, filter, search])

  const openForm = (payer?: Person) => {
    setDefaultPayer(payer)
    setEditingExpense(undefined)
    setShowForm(true)
  }

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setDefaultPayer(undefined)
    setShowForm(true)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="page expenses-page">
      <header className="page-header">
        <h1>記帳</h1>
      </header>

      {/* Quick Add */}
      <div className="quick-add">
        <button className="btn quick-add-btn kiki-color" onClick={() => openForm('Kiki')}>K</button>
        <button className="btn quick-add-btn neutral-color" onClick={() => openForm()}>+</button>
        <button className="btn quick-add-btn wayne-color" onClick={() => openForm('Wayne')}>W</button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="搜尋品項..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={`btn btn-sm ${filter === 'Kiki' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('Kiki')}
        >
          Kiki
        </button>
        <button
          className={`btn btn-sm ${filter === 'Wayne' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('Wayne')}
        >
          Wayne
        </button>
      </div>

      {/* Expense List */}
      <div className="expense-list">
        {filtered.length === 0 && (
          <div className="empty-state">還沒有帳目</div>
        )}
        {filtered.map((expense) => (
          <div key={expense.id} className="expense-item" onClick={() => openEdit(expense)}>
            <div className="expense-left">
              <span className={`payer-badge ${expense.payer.toLowerCase()}`}>
                {expense.payer === 'Kiki' ? 'K' : 'W'}
              </span>
              <div className="expense-info">
                <div className="expense-item-name">{expense.item}</div>
                <div className="expense-date">{formatDate(expense.createdAt)}</div>
              </div>
            </div>
            <div className="expense-right">
              <div className="expense-amount">
                ${expense.amount.toLocaleString()} {expense.currency}
              </div>
              {expense.currency !== settings.defaultCurrency && (
                <div className="expense-converted">
                  ≈ ${expense.convertedAmount.toLocaleString()} {settings.defaultCurrency}
                </div>
              )}
              <button
                className="btn-icon btn-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteExpense(expense.id)
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <ExpenseForm
          defaultPayer={defaultPayer}
          editingExpense={editingExpense}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
