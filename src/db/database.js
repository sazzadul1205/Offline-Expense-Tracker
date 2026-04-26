import Dexie from "dexie";

export const db = new Dexie("ExpenseTrackerDB");

db.version(1).stores({
  accounts: "++id, name, type, balance",
  categories: "++id, name, type",
  transactions: `
    ++id,
    date,
    type,
    amount,
    status,
    direction,
    person,
    accountId,
    fromAccountId,
    toAccountId,
    categoryId,
    relatedTransactionId,
    settlesTransactionId,
    title,
    details,
    fee
  `,
});

export const ACCOUNT_TYPES = ["cash", "bkash", "card", "bank"];
export const TRANSACTION_TYPES = [
  "expense",
  "income",
  "transfer",
  "credit",
  "debt_settlement",
];
export const STATUSES = ["pending", "paid"];
export const DIRECTIONS = ["owe_me", "i_owe"];

export async function initSampleData() {
  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    await db.accounts.bulkAdd([
      { name: "Cash", type: "cash", balance: 0 },
      { name: "bKash", type: "bkash", balance: 0 },
      { name: "Credit Card", type: "card", balance: 0 },
    ]);
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd([
      { name: "Food", type: "expense" },
      { name: "Transport", type: "expense" },
      { name: "Salary", type: "income" },
      { name: "Shopping", type: "expense" },
      { name: "Utilities", type: "expense" },
    ]);
  }
}
