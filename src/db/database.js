import Dexie from "dexie";

export const db = new Dexie("ExpenseTrackerDB");

// Version 2 - Added timestamp and time fields
db.version(2).stores({
  accounts: "++id, name, type, balance",
  categories: "++id, name, type",
  transactions: `
    ++id,
    date,
    time,
    timestamp,
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

// Version 1 - Original schema (kept for backward compatibility)
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

// Migration function to add timestamp to existing transactions
export async function migrateExistingTransactions() {
  try {
    const transactions = await db.transactions.toArray();
    let needsUpdate = false;

    for (const transaction of transactions) {
      let shouldUpdate = false;
      const updates = {};

      // Add timestamp if missing
      if (!transaction.timestamp && transaction.date) {
        const dateTime = transaction.time
          ? new Date(`${transaction.date}T${transaction.time}`)
          : new Date(transaction.date);
        updates.timestamp = dateTime.getTime();
        shouldUpdate = true;
        needsUpdate = true;
      }

      // Add default time if missing
      if (!transaction.time && transaction.date) {
        updates.time = "12:00";
        shouldUpdate = true;
        needsUpdate = true;
      }

      if (shouldUpdate) {
        await db.transactions.update(transaction.id, updates);
      }
    }

    if (needsUpdate) {
      console.log(
        "Migration completed: Added timestamps to existing transactions",
      );
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}
