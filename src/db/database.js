// src/db/database.js
import Dexie from "dexie";

export const db = new Dexie("ExpenseTrackerDB");

// Version 3 - Fixed schema
db.version(3).stores({
  accounts: "++id, name, type, balance, currency",
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
    fee,
    feeTransactionId,
    linkedTransferId,
    [date+type],
    [status+type],
    [person+status]
  `,
  errorLogs: `
    ++id,
    timestamp,
    timestampMs,
    level,
    category,
    message,
    resolved
  `,
});

export const ACCOUNT_TYPES = ["cash", "mobile", "card", "bank"];
export const TRANSACTION_TYPES = [
  "expense",
  "income",
  "transfer",
  "credit",
  "debt_settlement",
];
export const STATUSES = ["pending", "paid"];
export const DIRECTIONS = ["owe_me", "i_owe"];
export const CURRENCY = "BDT";
export const CURRENCY_SYMBOL = "৳";

// Initialize database with optional default data for first-time users
export async function initSampleData() {
  try {
    const accountCount = await db.accounts.count();
    const categoryCount = await db.categories.count();

    if (accountCount === 0) {
      await db.accounts.bulkAdd([
        { name: "Cash", type: "cash", balance: 0 },
        { name: "Mobile Banking", type: "mobile", balance: 0 },
      ]);
      console.log("Default accounts created");
    }

    if (categoryCount === 0) {
      await db.categories.bulkAdd([
        { name: "Food & Dining", type: "expense" },
        { name: "Transportation", type: "expense" },
        { name: "Shopping", type: "expense" },
        { name: "Bills & Utilities", type: "expense" },
        { name: "Entertainment", type: "expense" },
        { name: "Healthcare", type: "expense" },
        { name: "Salary", type: "income" },
        { name: "Freelance", type: "income" },
        { name: "Gift", type: "income" },
        { name: "Investment", type: "income" },
      ]);
      console.log("Default categories created");
    }

    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// Migration function
export async function migrateExistingTransactions() {
  console.log("Database ready - checking for migrations...");
  try {
    // Check if we need to add missing fields to existing transactions
    const transactions = await db.transactions.toArray();
    let needsUpdate = false;

    for (const tx of transactions) {
      const updates = {};
      if (tx.feeTransactionId === undefined) {
        updates.feeTransactionId = null;
        needsUpdate = true;
      }
      if (tx.linkedTransferId === undefined) {
        updates.linkedTransferId = null;
        needsUpdate = true;
      }
      if (Object.keys(updates).length > 0) {
        await db.transactions.update(tx.id, updates);
      }
    }

    if (needsUpdate) {
      console.log("Migration completed - added missing fields");
    }
    return true;
  } catch (error) {
    console.error("Migration error:", error);
    return false;
  }
}
