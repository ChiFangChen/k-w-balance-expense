import test from "node:test";
import assert from "node:assert/strict";
import type { Expense } from "../types";
import { findDuplicateExpense } from "./expenseDuplicate";

const baseExpense: Expense = {
  id: "expense-1",
  payer: "Kiki",
  item: "Lunch",
  amount: 100,
  currency: "TWD",
  exchangeRate: 1,
  convertedAmount: 100,
  createdAt: "2026-04-25T02:00:00.000Z",
  updatedAt: "2026-04-25T02:00:00.000Z",
};

test("finds duplicate when same local day, amount, currency, and payer match", () => {
  const duplicate = findDuplicateExpense({
    expenses: [baseExpense],
    draft: {
      payer: "Kiki",
      amount: 100,
      currency: "TWD",
      createdAt: "2026-04-25T15:30:00.000Z",
    },
    timezone: "Asia/Taipei",
  });

  assert.equal(duplicate?.id, baseExpense.id);
});

test("ignores records with different payer, amount, currency, or local day", () => {
  const duplicate = findDuplicateExpense({
    expenses: [
      baseExpense,
      { ...baseExpense, id: "expense-2", payer: "Wayne" },
      { ...baseExpense, id: "expense-3", amount: 200 },
      { ...baseExpense, id: "expense-4", currency: "JPY" },
      {
        ...baseExpense,
        id: "expense-5",
        createdAt: "2026-04-24T02:00:00.000Z",
      },
    ],
    draft: {
      payer: "Wayne",
      amount: 100,
      currency: "TWD",
      createdAt: "2026-04-25T15:30:00.000Z",
    },
    timezone: "Asia/Taipei",
  });

  assert.equal(duplicate?.id, "expense-2");
});

test("skips the current record while editing", () => {
  const duplicate = findDuplicateExpense({
    expenses: [baseExpense],
    draft: {
      payer: "Kiki",
      amount: 100,
      currency: "TWD",
      createdAt: "2026-04-25T15:30:00.000Z",
    },
    timezone: "Asia/Taipei",
    excludeExpenseId: baseExpense.id,
  });

  assert.equal(duplicate, undefined);
});
