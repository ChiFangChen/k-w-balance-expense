/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import type { AppState, Expense, Template, Settings, Person, OperationLog } from '../types'
import { loadState, saveState } from '../utils/storage'
import { generateId } from '../utils/id'
import { performBalance } from '../utils/balance'
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
  syncSettings,
  batchReplaceExpenses,
} from '../utils/firebase'
import type { Firestore } from 'firebase/firestore'

type Action =
  | { type: 'SET_EXPENSES'; expenses: Expense[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'UPDATE_EXPENSE'; expense: Expense }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'SET_TEMPLATES'; templates: Template[] }
  | { type: 'ADD_TEMPLATE'; template: Template }
  | { type: 'UPDATE_TEMPLATE'; template: Template }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'SET_OPERATION_LOGS'; logs: OperationLog[] }
  | { type: 'SET_SETTINGS'; settings: Settings }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'BALANCE'; expenses: Expense[]; log: OperationLog }
  | { type: 'RESET' }
  | { type: 'SET_IDENTITY'; person: Person | null }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_EXPENSES':
      return { ...state, expenses: action.expenses }
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] }
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.expense.id ? action.expense : e)),
      }
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) }
    case 'SET_TEMPLATES':
      return { ...state, templates: action.templates }
    case 'ADD_TEMPLATE':
      return { ...state, templates: [action.template, ...state.templates] }
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) => (t.id === action.template.id ? action.template : t)),
      }
    case 'DELETE_TEMPLATE':
      return { ...state, templates: state.templates.filter((t) => t.id !== action.id) }
    case 'SET_OPERATION_LOGS':
      return { ...state, operationLogs: action.logs }
    case 'SET_SETTINGS':
      return { ...state, settings: action.settings }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'BALANCE':
      return { ...state, expenses: action.expenses, operationLogs: [action.log, ...state.operationLogs] }
    case 'RESET':
      return { ...state, expenses: [], operationLogs: [] }
    case 'SET_IDENTITY':
      return { ...state, identity: action.person }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  addExpense: (expense: Expense) => void
  updateExpense: (expense: Expense) => void
  deleteExpense: (id: string) => void
  addTemplate: (template: Template) => void
  updateTemplate: (template: Template) => void
  deleteTemplate: (id: string) => void
  updateSettings: (settings: Partial<Settings>) => void
  performBalance: () => void
  performReset: () => void
  setIdentity: (person: Person | null) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const dbRef = useRef<Firestore | null>(null)
  const firebaseListeningRef = useRef(false)

  // Initialize Firebase
  useEffect(() => {
    if (isFirebaseConfigured() && !firebaseListeningRef.current) {
      let cleanups: (() => void)[] = []
      initFirebase().then((db) => {
        dbRef.current = db
        if (db) {
          firebaseListeningRef.current = true
          const unsub1 = subscribeToExpenses(db, (expenses) => dispatch({ type: 'SET_EXPENSES', expenses }))
          const unsub2 = subscribeToTemplates(db, (templates) => dispatch({ type: 'SET_TEMPLATES', templates }))
          const unsub3 = subscribeToOperationLogs(db, (logs) => dispatch({ type: 'SET_OPERATION_LOGS', logs }))
          const unsub4 = subscribeToSettings(db, (remoteSettings) => {
            // Preserve local-only settings when syncing from Firebase
            const { theme, colorKiki, colorWayne, exchangeRatesUpdatedAt, ...rest } = remoteSettings as Settings
            void theme; void colorKiki; void colorWayne;
            dispatch({ type: 'UPDATE_SETTINGS', settings: {
              ...rest,
              ...(exchangeRatesUpdatedAt ? { exchangeRatesUpdatedAt } : {}),
            } })
          })
          cleanups = [unsub1, unsub2, unsub3, unsub4]
        }
      })
      return () => {
        cleanups.forEach((fn) => fn())
        firebaseListeningRef.current = false
      }
    }
  }, [])

  useEffect(() => {
    saveState(state)
  }, [state])

  const addExpenseAction = useCallback((expense: Expense) => {
    dispatch({ type: 'ADD_EXPENSE', expense })
    if (dbRef.current) syncExpense(dbRef.current, expense)
  }, [])

  const updateExpenseAction = useCallback((expense: Expense) => {
    dispatch({ type: 'UPDATE_EXPENSE', expense })
    if (dbRef.current) syncExpense(dbRef.current, expense)
  }, [])

  const deleteExpenseAction = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', id })
    if (dbRef.current) deleteExpenseFromFirestore(dbRef.current, id)
  }, [])

  const addTemplate = useCallback((template: Template) => {
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
    const settingsToSync = { ...state.settings, ...settings }
    const { theme, colorKiki, colorWayne, ...rest } = settingsToSync as Settings
    void theme; void colorKiki; void colorWayne;
    if (dbRef.current) syncSettings(dbRef.current, rest as Settings)
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
    }
  }, [state.expenses, state.settings])

  const performResetAction = useCallback(() => {
    dispatch({ type: 'RESET' })
    if (dbRef.current) {
      batchReplaceExpenses(dbRef.current, [])
    }
  }, [])

  const setIdentity = useCallback((person: Person | null) => {
    dispatch({ type: 'SET_IDENTITY', person })
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        addExpense: addExpenseAction,
        updateExpense: updateExpenseAction,
        deleteExpense: deleteExpenseAction,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        updateSettings: updateSettingsAction,
        performBalance: performBalanceAction,
        performReset: performResetAction,
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
