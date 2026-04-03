import { Expense, OperationLog, Person, Settings } from '../types'

export function calculateTotals(expenses: Expense[]): { kiki: number; wayne: number } {
  let kiki = 0
  let wayne = 0
  for (const expense of expenses) {
    if (expense.payer === 'Kiki') {
      kiki += expense.convertedAmount
    } else {
      wayne += expense.convertedAmount
    }
  }
  return {
    kiki: Math.round(kiki * 100) / 100,
    wayne: Math.round(wayne * 100) / 100,
  }
}

export function calculateCurrentRatio(totals: { kiki: number; wayne: number }): { kiki: number; wayne: number } {
  const total = totals.kiki + totals.wayne
  if (total === 0) return { kiki: 0, wayne: 0 }
  return {
    kiki: Math.round((totals.kiki / total) * 100),
    wayne: Math.round((totals.wayne / total) * 100),
  }
}

export function calculateGap(
  totals: { kiki: number; wayne: number },
  settings: Settings
): { person: Person | null; amount: number } {
  const total = totals.kiki + totals.wayne
  if (total === 0) return { person: null, amount: 0 }

  const targetKiki = (total * settings.ratioKiki) / (settings.ratioKiki + settings.ratioWayne)
  const targetWayne = (total * settings.ratioWayne) / (settings.ratioKiki + settings.ratioWayne)

  const diffKiki = targetKiki - totals.kiki
  const diffWayne = targetWayne - totals.wayne

  if (diffKiki > 0.01) {
    return { person: 'Kiki', amount: Math.round(diffKiki * 100) / 100 }
  } else if (diffWayne > 0.01) {
    return { person: 'Wayne', amount: Math.round(diffWayne * 100) / 100 }
  }
  return { person: null, amount: 0 }
}

export function performBalance(
  expenses: Expense[],
  settings: Settings
): { newExpenses: Expense[]; log: Omit<OperationLog, 'id'> } {
  const totals = calculateTotals(expenses)
  const ratioK = settings.ratioKiki
  const ratioW = settings.ratioWayne

  // Find max N such that kiki - ratioK * N >= 0 AND wayne - ratioW * N >= 0
  const maxNByKiki = ratioK > 0 ? Math.floor(totals.kiki / ratioK) : Infinity
  const maxNByWayne = ratioW > 0 ? Math.floor(totals.wayne / ratioW) : Infinity
  const N = Math.min(maxNByKiki, maxNByWayne)

  const reduceKiki = ratioK * N
  const reduceWayne = ratioW * N

  const afterKiki = Math.round((totals.kiki - reduceKiki) * 100) / 100
  const afterWayne = Math.round((totals.wayne - reduceWayne) * 100) / 100

  // Create new adjusted expenses — replace all with two summary expenses
  const newExpenses: Expense[] = []
  const now = new Date().toISOString()

  if (afterKiki > 0) {
    newExpenses.push({
      id: crypto.randomUUID(),
      payer: 'Kiki',
      amount: afterKiki,
      item: '平衡後餘額',
      currency: settings.defaultCurrency,
      exchangeRate: 1,
      convertedAmount: afterKiki,
      createdAt: now,
      updatedAt: now,
    })
  }
  if (afterWayne > 0) {
    newExpenses.push({
      id: crypto.randomUUID(),
      payer: 'Wayne',
      amount: afterWayne,
      item: '平衡後餘額',
      currency: settings.defaultCurrency,
      exchangeRate: 1,
      convertedAmount: afterWayne,
      createdAt: now,
      updatedAt: now,
    })
  }

  return {
    newExpenses,
    log: {
      type: 'balance',
      timestamp: now,
      beforeKiki: totals.kiki,
      beforeWayne: totals.wayne,
      afterKiki,
      afterWayne,
    },
  }
}
