// src/utils/backup.js
import { dexieDB } from "../db/database";
import {
  initSQLiteDB,
  migrateDataToSQLite,
  shouldUseSQLite,
  queryAccounts,
  queryCategories,
  queryTransactions,
} from "../db/sqlite";
import { showToast, showErrorAlert } from "./alerts";

// Check if running on Android
const isAndroid = () => window.Capacitor?.isNativePlatform() === true;

// Export data (works on both web and Android)
export async function exportData() {
  try {
    let accounts, categories, transactions;

    if (isAndroid() && shouldUseSQLite()) {
      // Use SQLite for faster export
      const { getDB } = await import("../db/sqlite");
      const db = getDB();
      accounts = (await db.query("SELECT * FROM accounts")).values || [];
      categories = (await db.query("SELECT * FROM categories")).values || [];
      transactions =
        (await db.query("SELECT * FROM transactions")).values || [];
    } else {
      // Fallback to Dexie
      accounts = await dexieDB.accounts.toArray();
      categories = await dexieDB.categories.toArray();
      transactions = await dexieDB.transactions.toArray();
    }

    const backup = {
      version: "2.0.0",
      exportDate: new Date().toISOString(),
      accounts,
      categories,
      transactions,
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-tracker-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("Backup exported successfully!", "success");
  } catch (error) {
    console.error("Export error:", error);
    showErrorAlert("Export Failed", error.message);
  }
}

// Import data
export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.accounts || !data.categories || !data.transactions) {
          throw new Error("Invalid backup file");
        }

        if (isAndroid() && shouldUseSQLite()) {
          const { getDB } = await import("../db/sqlite");
          const db = getDB();

          await db.execute("BEGIN TRANSACTION");
          await db.execute("DELETE FROM transactions");
          await db.execute("DELETE FROM accounts");
          await db.execute("DELETE FROM categories");

          // Insert accounts
          for (const acc of data.accounts) {
            await db.run(
              `INSERT INTO accounts (id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?)`,
              [
                acc.id,
                acc.name,
                acc.type,
                acc.balance || 0,
                acc.currency || "BDT",
              ],
            );
          }

          // Insert categories
          for (const cat of data.categories) {
            await db.run(
              `INSERT INTO categories (id, name, type) VALUES (?, ?, ?)`,
              [cat.id, cat.name, cat.type],
            );
          }

          // Insert transactions
          for (const tx of data.transactions) {
            await db.run(
              `INSERT INTO transactions (
                id, date, time, timestamp, type, amount, status, direction, person,
                accountId, fromAccountId, toAccountId, categoryId, title, details, fee
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                tx.id,
                tx.date,
                tx.time,
                tx.timestamp,
                tx.type,
                tx.amount,
                tx.status || "paid",
                tx.direction,
                tx.person,
                tx.accountId,
                tx.fromAccountId,
                tx.toAccountId,
                tx.categoryId,
                tx.title || "",
                tx.details || "",
                tx.fee || null,
              ],
            );
          }

          await db.execute("COMMIT");
        } else {
          // Dexie fallback
          await dexieDB.accounts.clear();
          await dexieDB.categories.clear();
          await dexieDB.transactions.clear();

          await dexieDB.accounts.bulkAdd(data.accounts);
          await dexieDB.categories.bulkAdd(data.categories);
          await dexieDB.transactions.bulkAdd(data.transactions);
        }

        resolve({
          success: true,
          message: "Data imported successfully! Reloading...",
        });
      } catch (error) {
        reject({ success: false, message: error.message });
      }
    };
    reader.onerror = () =>
      reject({ success: false, message: "Error reading file" });
    reader.readAsText(file);
  });
}
