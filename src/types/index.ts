export type Person = 'Kiki' | 'Wayne'

export interface Expense {
  id: string
  payer: Person
  amount: number
  item: string
  currency: string
  exchangeRate: number // rate to default currency at time of creation
  convertedAmount: number // amount in default currency
  createdAt: string // ISO string
  updatedAt: string // ISO string
}

export interface Template {
  id: string
  payer: Person
  amount: number
  item: string
  currency: string
}

export type OperationType = 'balance' | 'reset'

export interface SnapshotExpense {
  payer: Person
  item: string
  amount: number
  currency: string
  convertedAmount: number
}

export interface OperationLog {
  id: string
  type: OperationType
  timestamp: string // ISO string
  beforeKiki: number
  beforeWayne: number
  afterKiki: number
  afterWayne: number
  snapshot?: SnapshotExpense[] // expenses at the time of the operation
}

export interface Settings {
  ratioWayne: number // default 67
  ratioKiki: number // default 33
  defaultCurrency: string // default 'TWD'
  exchangeRates: Record<string, number> // e.g. { USD: 31.5, JPY: 0.22 } — rate means 1 unit of foreign = X TWD
  exchangeRatesUpdatedAt?: string // ISO string — last time rates were synced
  timezone: string // IANA timezone e.g. "Asia/Taipei"
  theme: 'dark' | 'light'
  colorKiki: string // default '#FF6B9D'
  colorWayne: string // default '#4ECDC4'
}

export interface AppState {
  expenses: Expense[]
  templates: Template[]
  operationLogs: OperationLog[]
  settings: Settings
  identity: Person | null
}
