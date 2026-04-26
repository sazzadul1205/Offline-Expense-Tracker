import Dexie from "dexie";

export const db = new Dexie("ExpenseTrackerDB");

// Version 2 - Added timestamp and time fields
db.version(2).stores({
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
export const CURRENCY = "BDT";
export const CURRENCY_SYMBOL = "৳";

export async function initSampleData() {
  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    await db.accounts.bulkAdd([
      { name: "Cash", type: "cash", balance: 0, currency: CURRENCY },
      { name: "bKash", type: "bkash", balance: 0, currency: CURRENCY },
      { name: "Credit Card", type: "card", balance: 0, currency: CURRENCY },
      { name: "Bank Account", type: "bank", balance: 0, currency: CURRENCY },
    ]);
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd([
      { name: "Food & Dining", type: "expense" },
      { name: "Transport", type: "expense" },
      { name: "Salary", type: "income" },
      { name: "Shopping", type: "expense" },
      { name: "Utilities", type: "expense" },
      { name: "Rent", type: "expense" },
      { name: "Entertainment", type: "expense" },
      { name: "Healthcare", type: "expense" },
      { name: "Education", type: "expense" },
      { name: "Freelance", type: "income" },
      { name: "Business", type: "income" },
      { name: "Investment", type: "income" },
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

    // Migrate accounts to add currency field
    const accounts = await db.accounts.toArray();
    for (const account of accounts) {
      if (!account.currency) {
        await db.accounts.update(account.id, { currency: CURRENCY });
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      console.log(
        "Migration completed: Added timestamps and currency to existing data",
      );
    }
  } catch (error) {
    console.error("Migration error:", error);
  }
}
