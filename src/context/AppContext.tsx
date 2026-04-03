import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import type { AppState, Expense, Template, Settings, Person, OperationLog } from '../types'
import { loadState, saveState } from '../utils/storage'
import { generateId } from '../utils/id'
import { performBalance, calculateTotals } from '../utils/balance'
import { fetchExchangeRates } from '../utils/currency'
import {
  initFirebase,
  isFirebaseConfigured,
  subscribeToExpenses,
  subscribeToTemplates,
  subscribeToOperationLogs,
  subscribeToSettings,
  syncExpense,
  deleteExpenseFromFirestore,
  syncTemplate,
  deleteTemplateFromFirestore,
  syncOperationLog,
  syncSettings,
  batchReplaceExpenses,
  batchDeleteAllExpenses,
} from '../utils/firebase'

type Action =
  | { type: 'SET_EXPENSES'; expenses: Expense[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'UPDATE_EXPENSE'; expense: Expense }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'SET_TEMPLATES'; templates: Template[] }
  | { type: 'ADD_TEMPLATE'; template: Template }
  | { type: 'UPDATE_TEMPLATE'; template: Template }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'SET_SETTINGS'; settings: Settings }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'SET_OPERATION_LOGS'; logs: OperationLog[] }
  | { type: 'ADD_OPERATION_LOG'; log: OperationLog }
  | { type: 'BALANCE'; expenses: Expense[]; log: OperationLog }
  | { type: 'RESET'; log: OperationLog }
  | { type: 'SET_IDENTITY'; identity: Person }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_EXPENSES':
      return { ...state, expenses: action.expenses }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] }
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.expense.id ? action.expense : e
        ),
      }
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      }
    case 'SET_TEMPLATES':
      return { ...state, templates: action.templates }
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.template] }
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.template.id ? action.template : t
        ),
      }
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.id),
      }
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'SET_OPERATION_LOGS':
      return { ...state, operationLogs: action.logs }
    case 'ADD_OPERATION_LOG':
      return { ...state, operationLogs: [action.log, ...state.operationLogs] }
    case 'BALANCE':
      return {
        ...state,
        expenses: action.expenses,
        operationLogs: [action.log, ...state.operationLogs],
      }
    case 'RESET':
      return {
        ...state,
        expenses: [],
        operationLogs: [action.log, ...state.operationLogs],
      }
    case 'SET_IDENTITY':
      return { ...state, identity: action.identity }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  addTemplate: (template: Omit<Template, 'id'>) => void
  updateTemplate: (template: Template) => void
  deleteTemplate: (id: string) => void
  updateSettings: (settings: Partial<Settings>) => void
  performBalanceAction: () => void
  performResetAction: () => void
  setIdentity: (person: Person) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const dbRef = useRef<ReturnType<typeof initFirebase>>(null)
  const firebaseListeningRef = useRef(false)

  // Initialize Firebase
  useEffect(() => {
    if (isFirebaseConfigured() && !firebaseListeningRef.current) {
      const db = initFirebase()
      dbRef.current = db
      if (db) {
        firebaseListeningRef.current = true
        const unsub1 = subscribeToExpenses(db, (expenses) => dispatch({ type: 'SET_EXPENSES', expenses }))
        const unsub2 = subscribeToTemplates(db, (templates) => dispatch({ type: 'SET_TEMPLATES', templates }))
        const unsub3 = subscribeToOperationLogs(db, (logs) => dispatch({ type: 'SET_OPERATION_LOGS', logs }))
        const unsub4 = subscribeToSettings(db, (remoteSettings) => {
          // Preserve local-only settings when syncing from Firebase
          const { theme: _, colorKiki: _ck, colorWayne: _cw, ...rest } = remoteSettings
          dispatch({ type: 'UPDATE_SETTINGS', settings: rest })
        })
        return () => {
          unsub1()
          unsub2()
          unsub3()
          unsub4()
          firebaseListeningRef.current = false
        }
      }
    }
  }, [])

  // Fetch exchange rates on first launch — only for whitelisted currencies
  useEffect(() => {
    if (Object.keys(state.settings.exchangeRates).length === 0) {
      const CURRENCY_WHITELIST = ['JPY', 'THB', 'USD', 'CNY']
      fetchExchangeRates(state.settings.defaultCurrency)
        .then((rates) => {
          const filtered: Record<string, number> = {}
          for (const code of CURRENCY_WHITELIST) {
            if (rates[code]) filtered[code] = rates[code]
          }
          dispatch({ type: 'UPDATE_SETTINGS', settings: { exchangeRates: filtered } })
        })
        .catch(() => {
          // Silently fail — user can manually set rates
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage on state change
  useEffect(() => {
    saveState(state)
  }, [state])

  const addExpense = useCallback((data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const expense: Expense = { ...data, id: generateId(), createdAt: now, updatedAt: now }
    dispatch({ type: 'ADD_EXPENSE', expense })
    if (dbRef.current) syncExpense(dbRef.current, expense)
  }, [])

  const updateExpense = useCallback((expense: Expense) => {
    const updated = { ...expense, updatedAt: new Date().toISOString() }
    dispatch({ type: 'UPDATE_EXPENSE', expense: updated })
    if (dbRef.current) syncExpense(dbRef.current, updated)
  }, [])

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', id })
    if (dbRef.current) deleteExpenseFromFirestore(dbRef.current, id)
  }, [])

  const addTemplate = useCallback((data: Omit<Template, 'id'>) => {
    const template: Template = { ...data, id: generateId() }
    dispatch({ type: 'ADD_TEMPLATE', template })
    if (dbRef.current) syncTemplate(dbRef.current, template)
  }, [])

  const updateTemplate = useCallback((template: Template) => {
    dispatch({ type: 'UPDATE_TEMPLATE', template })
    if (dbRef.current) syncTemplate(dbRef.current, template)
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TEMPLATE', id })
    if (dbRef.current) deleteTemplateFromFirestore(dbRef.current, id)
  }, [])

  const updateSettingsAction = useCallback((settings: Partial<Settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings })
    // Sync settings to Firebase, but exclude local-only preferences
    const merged = { ...state.settings, ...settings }
    const { theme: _, colorKiki: _ck, colorWayne: _cw, ...settingsToSync } = merged
    if (dbRef.current) syncSettings(dbRef.current, settingsToSync as Settings)
  }, [state.settings])

  const performBalanceAction = useCallback(() => {
    const snapshot = state.expenses.map((e) => ({
      payer: e.payer,
      item: e.item,
      amount: e.amount,
      currency: e.currency,
      convertedAmount: e.convertedAmount,
    }))
    const result = performBalance(state.expenses, state.settings)
    const log: OperationLog = { ...result.log, id: generateId(), snapshot }
    dispatch({ type: 'BALANCE', expenses: result.newExpenses, log })
    if (dbRef.current) {
      batchReplaceExpenses(dbRef.current, result.newExpenses)
      syncOperationLog(dbRef.current, log)
    }
  }, [state.expenses, state.settings])

  const performResetAction = useCallback(() => {
    const snapshot = state.expenses.map((e) => ({
      payer: e.payer,
      item: e.item,
      amount: e.amount,
      currency: e.currency,
      convertedAmount: e.convertedAmount,
    }))
    const totals = calculateTotals(state.expenses)
    const now = new Date().toISOString()
    const log: OperationLog = {
      id: generateId(),
      type: 'reset',
      timestamp: now,
      beforeKiki: totals.kiki,
      beforeWayne: totals.wayne,
      afterKiki: 0,
      afterWayne: 0,
      snapshot,
    }
    dispatch({ type: 'RESET', log })
    if (dbRef.current) {
      batchDeleteAllExpenses(dbRef.current)
      syncOperationLog(dbRef.current, log)
    }
  }, [state.expenses])

  const setIdentity = useCallback((person: Person) => {
    dispatch({ type: 'SET_IDENTITY', identity: person })
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        addExpense,
        updateExpense,
        deleteExpense,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        updateSettings: updateSettingsAction,
        performBalanceAction,
        performResetAction,
        setIdentity,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
