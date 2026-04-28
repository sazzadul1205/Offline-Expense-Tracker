// src/utils/accountingRules.js

import { db } from "../db/database";
import { logError, ERROR_CATEGORIES, ERROR_LEVELS } from "./errorLogger";

// Apply a transaction (only if paid)
export async function applyTransaction(transaction, isNew = true) {
  try {
    if (transaction.status !== "paid") {
      return {
        success: true,
        message: "Pending transaction - no balance change",
      };
    }

    const { type, amount, accountId, fromAccountId, toAccountId, fee } =
      transaction;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { success: false, message: "Invalid amount" };
    }

    // ---- EXPENSE ----
    if (type === "expense") {
      if (!accountId) return { success: false, message: "No account selected" };
      const account = await db.accounts.get(parseInt(accountId));
      if (!account) return { success: false, message: "Account not found" };
      if (account.balance >= amountNum) {
        await db.accounts.update(parseInt(accountId), {
          balance: account.balance - amountNum,
        });
        return { success: true, message: "Expense recorded" };
      }
      return {
        success: false,
        message: `Insufficient balance in ${account.name}`,
      };
    }

    // ---- INCOME ----
    if (type === "income") {
      if (!accountId) return { success: false, message: "No account selected" };
      const account = await db.accounts.get(parseInt(accountId));
      if (!account) return { success: false, message: "Account not found" };
      await db.accounts.update(parseInt(accountId), {
        balance: (account.balance || 0) + amountNum,
      });
      return { success: true, message: "Income recorded" };
    }

    // ---- TRANSFER (with fee as separate expense) ----
    if (type === "transfer") {
      if (!fromAccountId || !toAccountId) {
        return { success: false, message: "Missing transfer account info" };
      }
      const fromAccount = await db.accounts.get(parseInt(fromAccountId));
      const toAccount = await db.accounts.get(parseInt(toAccountId));
      if (!fromAccount || !toAccount) {
        return { success: false, message: "One or both accounts not found" };
      }

      const feeNum = parseFloat(fee) || 0;
      const totalNeeded = amountNum + feeNum;
      if (fromAccount.balance < totalNeeded) {
        return {
          success: false,
          message: `Insufficient balance in ${fromAccount.name}. Required: ${totalNeeded}`,
        };
      }

      // 1. Deduct only the transfer amount (fee will be taken by separate expense)
      await db.accounts.update(parseInt(fromAccountId), {
        balance: fromAccount.balance - amountNum,
      });
      // 2. Add amount to destination
      await db.accounts.update(parseInt(toAccountId), {
        balance: toAccount.balance + amountNum,
      });

      let feeTransactionId = null;
      // 3. If fee exists, create and apply an expense transaction for the fee
      if (feeNum > 0) {
        const feeTx = {
          date: transaction.date,
          time: transaction.time || "12:00",
          timestamp: transaction.timestamp || Date.now(),
          type: "expense",
          amount: feeNum,
          status: "paid",
          accountId: parseInt(fromAccountId),
          title: "Transfer Fee",
          details: `Fee for transfer of ${amountNum} from ${fromAccount.name} to ${toAccount.name}`,
          createdAt: new Date().toISOString(),
          linkedTransferId: transaction.id,
        };
        feeTransactionId = await db.transactions.add(feeTx);
        // Apply the fee expense immediately
        const feeResult = await applyTransaction(
          { ...feeTx, id: feeTransactionId },
          true,
        );
        if (!feeResult.success) {
          // rollback transfer changes
          await db.accounts.update(parseInt(fromAccountId), {
            balance: fromAccount.balance,
          });
          await db.accounts.update(parseInt(toAccountId), {
            balance: toAccount.balance,
          });
          return {
            success: false,
            message: `Fee processing failed: ${feeResult.message}`,
          };
        }
      }

      // Store fee transaction ID on the original transfer for easy reversal
      await db.transactions.update(transaction.id, { feeTransactionId });
      return { success: true, message: "Transfer completed successfully" };
    }

    // ---- CREDIT (no balance change) ----
    if (type === "credit") {
      return {
        success: true,
        message: "Credit/Debt recorded (pending settlement)",
      };
    }

    // ---- DEBT SETTLEMENT ----
    if (type === "debt_settlement") {
      if (!accountId) return { success: false, message: "No account selected" };
      const account = await db.accounts.get(parseInt(accountId));
      if (!account) return { success: false, message: "Account not found" };
      const { direction } = transaction;
      if (direction === "owe_me") {
        await db.accounts.update(parseInt(accountId), {
          balance: account.balance + amountNum,
        });
        return { success: true, message: "Payment received" };
      } else if (direction === "i_owe") {
        if (account.balance >= amountNum) {
          await db.accounts.update(parseInt(accountId), {
            balance: account.balance - amountNum,
          });
          return { success: true, message: "Payment made" };
        }
        return {
          success: false,
          message: `Insufficient balance in ${account.name}`,
        };
      }
    }

    return { success: false, message: "Unknown transaction type" };
  } catch (error) {
    console.error("applyTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      transaction,
    });
    return { success: false, message: error.message };
  }
}

// Reverse a transaction (undo its balance effects)
export async function reverseTransaction(transaction) {
  try {
    if (transaction.status !== "paid") {
      return {
        success: true,
        message: "Pending transaction - no balance to reverse",
      };
    }

    const { type, amount, accountId, fromAccountId, toAccountId, fee } =
      transaction;
    const amountNum = parseFloat(amount);
    const feeNum = parseFloat(fee) || 0;

    if (type === "expense") {
      const account = await db.accounts.get(parseInt(accountId));
      if (account) {
        await db.accounts.update(parseInt(accountId), {
          balance: account.balance + amountNum,
        });
      }
    } else if (type === "income") {
      const account = await db.accounts.get(parseInt(accountId));
      if (account) {
        await db.accounts.update(parseInt(accountId), {
          balance: account.balance - amountNum,
        });
      }
    } else if (type === "transfer") {
      const fromAccount = await db.accounts.get(parseInt(fromAccountId));
      const toAccount = await db.accounts.get(parseInt(toAccountId));
      if (fromAccount) {
        await db.accounts.update(parseInt(fromAccountId), {
          balance: fromAccount.balance + amountNum,
        });
      }
      if (toAccount) {
        await db.accounts.update(parseInt(toAccountId), {
          balance: toAccount.balance - amountNum,
        });
      }
      // Also delete and reverse the linked fee transaction if exists
      const feeId = transaction.feeTransactionId;
      if (feeId) {
        const feeTx = await db.transactions.get(feeId);
        if (feeTx) {
          await reverseTransaction(feeTx);
          await db.transactions.delete(feeId);
        }
      } else {
        // Fallback: find linked fee by linkedTransferId
        const linkedFee = await db.transactions
          .where("linkedTransferId")
          .equals(transaction.id)
          .first();
        if (linkedFee) {
          await reverseTransaction(linkedFee);
          await db.transactions.delete(linkedFee.id);
        }
      }
    } else if (type === "debt_settlement") {
      const account = await db.accounts.get(parseInt(accountId));
      const { direction } = transaction;
      if (account) {
        if (direction === "owe_me") {
          await db.accounts.update(parseInt(accountId), {
            balance: account.balance - amountNum,
          });
        } else if (direction === "i_owe") {
          await db.accounts.update(parseInt(accountId), {
            balance: account.balance + amountNum,
          });
        }
      }
    }

    return { success: true, message: "Transaction reversed" };
  } catch (error) {
    console.error("reverseTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      transaction,
    });
    return { success: false, message: error.message };
  }
}

// Delete a transaction completely
export async function deleteTransaction(transactionId) {
  try {
    const transaction = await db.transactions.get(transactionId);
    if (!transaction)
      return { success: false, message: "Transaction not found" };

    const reverseResult = await reverseTransaction(transaction);
    if (!reverseResult.success) {
      return {
        success: false,
        message: `Failed to reverse: ${reverseResult.message}`,
      };
    }

    await db.transactions.delete(transactionId);
    return { success: true, message: "Transaction deleted" };
  } catch (error) {
    console.error("deleteTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      transactionId,
    });
    return { success: false, message: error.message };
  }
}

// Edit transaction (delete old, create new)
export async function editTransaction(oldTransactionId, newTransactionData) {
  try {
    const oldTransaction = await db.transactions.get(oldTransactionId);
    if (!oldTransaction)
      return { success: false, message: "Original transaction not found" };

    const reverseResult = await reverseTransaction(oldTransaction);
    if (!reverseResult.success) {
      return {
        success: false,
        message: `Failed to reverse old: ${reverseResult.message}`,
      };
    }

    await db.transactions.delete(oldTransactionId);

    const newId = await db.transactions.add(newTransactionData);
    const applyResult = await applyTransaction(
      { ...newTransactionData, id: newId },
      true,
    );

    if (!applyResult.success) {
      await db.transactions.delete(newId);
      await applyTransaction(oldTransaction, true);
      return {
        success: false,
        message: `Failed to apply new: ${applyResult.message}`,
      };
    }

    return { success: true, message: "Transaction updated", newId };
  } catch (error) {
    console.error("editTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      oldTransactionId,
      newTransactionData,
    });
    return { success: false, message: error.message };
  }
}
