import { db } from "../db/database";

export async function exportData() {
  const accounts = await db.accounts.toArray();
  const categories = await db.categories.toArray();
  const transactions = await db.transactions.toArray();

  const backup = {
    accounts,
    categories,
    transactions,
    exportDate: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expense-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        await db.transaction(
          "rw",
          db.accounts,
          db.categories,
          db.transactions,
          async () => {
            await db.accounts.clear();
            await db.categories.clear();
            await db.transactions.clear();

            if (data.accounts) await db.accounts.bulkAdd(data.accounts);
            if (data.categories) await db.categories.bulkAdd(data.categories);
            if (data.transactions)
              await db.transactions.bulkAdd(data.transactions);
          },
        );

        resolve({ success: true, message: "Data imported successfully" });
      } catch (error) {
        reject({ success: false, message: error.message });
      }
    };
    reader.onerror = () =>
      reject({ success: false, message: "Error reading file" });
    reader.readAsText(file);
  });
}
