import type { Expense, Person } from "../types";

interface ExpenseDraft {
  payer: Person;
  amount: number;
  currency: string;
  createdAt: string;
}

interface FindDuplicateExpenseOptions {
  expenses: Expense[];
  draft: ExpenseDraft;
  timezone: string;
  excludeExpenseId?: string;
}

function getLocalDateKey(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function findDuplicateExpense({
  expenses,
  draft,
  timezone,
  excludeExpenseId,
}: FindDuplicateExpenseOptions): Expense | undefined {
  const targetDate = getLocalDateKey(draft.createdAt, timezone);

  return expenses.find((expense) => {
    if (expense.id === excludeExpenseId) return false;

    return (
      expense.payer === draft.payer &&
      expense.amount === draft.amount &&
      expense.currency === draft.currency &&
      getLocalDateKey(expense.createdAt, timezone) === targetDate
    );
  });
}
