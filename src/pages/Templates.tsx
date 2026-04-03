import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt, faPenToSquare, faGear, faTrashCan, faPlus } from '@fortawesome/free-solid-svg-icons'
import { useApp } from '../context/AppContext'
import type { Template, Person } from '../types'
import { ExpenseForm } from '../components/ExpenseForm'
import { convertToDefault } from '../utils/currency'

const CURRENCY_WHITELIST = ['TWD', 'JPY', 'THB', 'USD', 'CNY']

export function Templates() {
  const { state, addTemplate, updateTemplate, deleteTemplate, addExpense } = useApp()
  const { templates, settings } = state

  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | undefined>()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseFromTemplate, setExpenseFromTemplate] = useState<Template | undefined>()

  // Template form state
  const [formPayer, setFormPayer] = useState<Person>('Kiki')
  const [formItem, setFormItem] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formCurrency, setFormCurrency] = useState(settings.defaultCurrency)

  const openTemplateForm = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setFormPayer(template.payer)
      setFormItem(template.item)
      setFormAmount(template.amount.toString())
      setFormCurrency(template.currency)
    } else {
      setEditingTemplate(undefined)
      setFormPayer('Kiki')
      setFormItem('')
      setFormAmount('')
      setFormCurrency(settings.defaultCurrency)
    }
    setShowTemplateForm(true)
  }

  const handleSaveTemplate = () => {
    const numAmount = parseFloat(formAmount)
    if (!formItem.trim() || isNaN(numAmount) || numAmount <= 0) return

    if (editingTemplate) {
      updateTemplate({
        ...editingTemplate,
        payer: formPayer,
        item: formItem.trim(),
        amount: numAmount,
        currency: formCurrency,
      })
    } else {
      addTemplate({
        payer: formPayer,
        item: formItem.trim(),
        amount: numAmount,
        currency: formCurrency,
      })
    }
    setShowTemplateForm(false)
  }

  const handleQuickCreate = (template: Template) => {
    const { convertedAmount, exchangeRate } = convertToDefault(
      template.amount,
      template.currency,
      settings.defaultCurrency,
      settings.exchangeRates
    )
    addExpense({
      payer: template.payer,
      item: template.item,
      amount: template.amount,
      currency: template.currency,
      exchangeRate,
      convertedAmount,
    })
  }

  const handleEditCreate = (template: Template) => {
    setExpenseFromTemplate(template)
    setShowExpenseForm(true)
  }

  return (
    <div className="page templates-page">
      <header className="page-header">
        <h1>模板</h1>
        <button className="btn btn-primary" onClick={() => openTemplateForm()}>
          <FontAwesomeIcon icon={faPlus} /> 新增模板
        </button>
      </header>

      <div className="template-list">
        {templates.length === 0 && (
          <div className="empty-state">還沒有模板</div>
        )}
        {templates.map((template) => (
          <div key={template.id} className="template-item">
            <div className="template-info">
              <span className={`payer-badge ${template.payer.toLowerCase()}`}>
                {template.payer === 'Kiki' ? 'K' : 'W'}
              </span>
              <div>
                <div className="template-item-name">{template.item}</div>
                <div className="template-amount">
                  ${template.amount.toLocaleString()} {template.currency}
                </div>
              </div>
            </div>
            <div className="template-actions">
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleQuickCreate(template)}
                title="快速創建"
              >
                <FontAwesomeIcon icon={faBolt} />
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleEditCreate(template)}
                title="編輯創建"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => openTemplateForm(template)}
                title="編輯模板"
              >
                <FontAwesomeIcon icon={faGear} />
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => deleteTemplate(template.id)}
                title="刪除模板"
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Form Dialog */}
      {showTemplateForm && (
        <div className="dialog-overlay" onClick={() => setShowTemplateForm(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTemplate ? '編輯模板' : '新增模板'}</h3>
            <div className="form-group">
              <label>誰付的</label>
              <div className="payer-select">
                <button
                  type="button"
                  className={`btn ${formPayer === 'Kiki' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFormPayer('Kiki')}
                >
                  Kiki
                </button>
                <button
                  type="button"
                  className={`btn ${formPayer === 'Wayne' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFormPayer('Wayne')}
                >
                  Wayne
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>品項</label>
              <input
                type="text"
                value={formItem}
                onChange={(e) => setFormItem(e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>金額</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  min="0"
                  step="any"
                />
              </div>
              <div className="form-group">
                <label>幣別</label>
                <select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)}>
                  {CURRENCY_WHITELIST.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setShowTemplateForm(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveTemplate}>
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Form from template */}
      {showExpenseForm && expenseFromTemplate && (
        <ExpenseForm
          defaultPayer={expenseFromTemplate.payer}
          editingExpense={{
            id: '',
            payer: expenseFromTemplate.payer,
            item: expenseFromTemplate.item,
            amount: expenseFromTemplate.amount,
            currency: expenseFromTemplate.currency,
            exchangeRate: 1,
            convertedAmount: expenseFromTemplate.amount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          onClose={() => setShowExpenseForm(false)}
        />
      )}
    </div>
  )
}
