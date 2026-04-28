import { db } from "../db/database";
import { APP_VERSION } from "../version";

export async function exportData() {
  const accounts = await db.accounts.toArray();
  const categories = await db.categories.toArray();
  const transactions = await db.transactions.toArray();
  const errorLogs = await db.errorLogs.toArray(); // optional, but useful for debugging

  const backup = {
    version: APP_VERSION,
    exportDate: new Date().toISOString(),
    accounts,
    categories,
    transactions,
    errorLogs,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-tracker-backup-${
    new Date().toISOString().split("T")[0]
  }.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.accounts || !data.categories || !data.transactions) {
          throw new Error("Invalid backup file: missing required tables");
        }

        await db.transaction(
          "rw",
          db.accounts,
          db.categories,
          db.transactions,
          async () => {
            await db.accounts.clear();
            await db.categories.clear();
            await db.transactions.clear();

            // Use bulkAdd with auto-incremented ids (ignore provided ids to avoid conflicts)
            if (data.accounts.length) await db.accounts.bulkAdd(data.accounts);
            if (data.categories.length)
              await db.categories.bulkAdd(data.categories);
            if (data.transactions.length)
              await db.transactions.bulkAdd(data.transactions);
          },
        );

        resolve({
          success: true,
          message: "Data imported successfully. Reloading...",
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
