import { AppState, Settings } from '../types'

const STORAGE_KEY = 'kw-balance-data'
const IDENTITY_KEY = 'kw-balance-identity'

export const defaultSettings: Settings = {
  ratioWayne: 67,
  ratioKiki: 33,
  defaultCurrency: 'TWD',
  exchangeRates: {},
  theme: 'light',
}

export const defaultState: AppState = {
  expenses: [],
  templates: [],
  operationLogs: [],
  settings: defaultSettings,
  identity: null,
}

export function loadState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const identity = localStorage.getItem(IDENTITY_KEY)
    if (data) {
      const parsed = JSON.parse(data) as Partial<AppState>
      return {
        ...defaultState,
        ...parsed,
        settings: { ...defaultSettings, ...parsed.settings },
        identity: identity as AppState['identity'],
      }
    }
    return { ...defaultState, identity: identity as AppState['identity'] }
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState): void {
  const { identity, ...rest } = state
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  if (identity) {
    localStorage.setItem(IDENTITY_KEY, identity)
  }
}

export function clearIdentity(): void {
  localStorage.removeItem(IDENTITY_KEY)
}
