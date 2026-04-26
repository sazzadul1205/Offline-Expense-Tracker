import { db } from "../db/database";

// Only paid transactions affect balances
export async function applyTransaction(transaction, isNew = true) {
  if (transaction.status !== "paid")
    return {
      success: true,
      message: "Pending transaction - no balance change",
    };

  const { type, amount, accountId, fromAccountId, toAccountId, fee } =
    transaction;

  if (type === "expense") {
    const account = await db.accounts.get(accountId);
    if (account && account.balance >= amount) {
      await db.accounts.update(accountId, {
        balance: account.balance - amount,
      });
      return { success: true, message: "Expense recorded" };
    }
    return { success: false, message: "Insufficient balance" };
  }

  if (type === "income") {
    const account = await db.accounts.get(accountId);
    await db.accounts.update(accountId, {
      balance: (account?.balance || 0) + amount,
    });
    return { success: true, message: "Income recorded" };
  }

  if (type === "transfer") {
    const fromAccount = await db.accounts.get(fromAccountId);
    const toAccount = await db.accounts.get(toAccountId);

    const totalDeduction = amount + (fee || 0);
    if (fromAccount && fromAccount.balance >= totalDeduction) {
      await db.accounts.update(fromAccountId, {
        balance: fromAccount.balance - totalDeduction,
      });
      await db.accounts.update(toAccountId, {
        balance: (toAccount?.balance || 0) + amount,
      });

      if (fee && fee > 0) {
        await db.transactions.add({
          date: transaction.date,
          type: "expense",
          amount: fee,
          status: "paid",
          accountId: fromAccountId,
          title: "Transfer Fee",
          details: `Fee for transfer of ${amount}`,
        });
      }
      return { success: true, message: "Transfer completed" };
    }
    return { success: false, message: "Insufficient balance including fee" };
  }

  return { success: false, message: "Unknown transaction type" };
}
