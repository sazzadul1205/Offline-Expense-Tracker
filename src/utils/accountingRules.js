// src/utils/accountingRules.js

import { db } from "../db/database";
import { logError, ERROR_CATEGORIES, ERROR_LEVELS } from "./errorLogger";

// Only paid transactions affect balances
export async function applyTransaction(transaction, isNew = true) {
  try {
    // Skip pending transactions for balance changes
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

    // EXPENSE
    if (type === "expense") {
      if (!accountId) {
        return { success: false, message: "No account selected for expense" };
      }

      const account = await db.accounts.get(parseInt(accountId));
      if (!account) {
        return { success: false, message: "Account not found" };
      }

      if (account.balance >= amountNum) {
        await db.accounts.update(parseInt(accountId), {
          balance: account.balance - amountNum,
        });
        return { success: true, message: "Expense recorded successfully" };
      }
      return {
        success: false,
        message: `Insufficient balance in ${account.name}. Available: ${account.balance}`,
      };
    }

    // INCOME
    if (type === "income") {
      if (!accountId) {
        return { success: false, message: "No account selected for income" };
      }

      const account = await db.accounts.get(parseInt(accountId));
      if (!account) {
        return { success: false, message: "Account not found" };
      }

      await db.accounts.update(parseInt(accountId), {
        balance: (account?.balance || 0) + amountNum,
      });
      return { success: true, message: "Income recorded successfully" };
    }

    // TRANSFER
    if (type === "transfer") {
      if (!fromAccountId || !toAccountId) {
        return {
          success: false,
          message: "Missing transfer account information",
        };
      }

      const fromAccount = await db.accounts.get(parseInt(fromAccountId));
      const toAccount = await db.accounts.get(parseInt(toAccountId));

      if (!fromAccount || !toAccount) {
        return { success: false, message: "One or both accounts not found" };
      }

      const feeNum = parseFloat(fee) || 0;
      const totalDeduction = amountNum + feeNum;

      if (fromAccount.balance >= totalDeduction) {
        // Deduct from source account
        await db.accounts.update(parseInt(fromAccountId), {
          balance: fromAccount.balance - totalDeduction,
        });

        // Add to destination account
        await db.accounts.update(parseInt(toAccountId), {
          balance: (toAccount?.balance || 0) + amountNum,
        });

        // Record fee as separate expense if applicable
        if (feeNum > 0) {
          const feeTransaction = {
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
            linkedTransferId: transaction.id, // Link fee to original transfer
          };

          const feeId = await db.transactions.add(feeTransaction);

          // Store the fee transaction ID with the original transfer for easy reversal
          await db.transactions.update(transaction.id, {
            feeTransactionId: feeId,
          });
        }

        return { success: true, message: "Transfer completed successfully" };
      }
      return {
        success: false,
        message: `Insufficient balance in ${fromAccount.name} including fee. Required: ${totalDeduction}, Available: ${fromAccount.balance}`,
      };
    }

    // CREDIT/DEBT - No immediate balance change
    if (type === "credit") {
      return {
        success: true,
        message: "Credit/Debt recorded (pending settlement)",
      };
    }

    // DEBT SETTLEMENT
    if (type === "debt_settlement") {
      if (!accountId) {
        return {
          success: false,
          message: "No account selected for settlement",
        };
      }

      const account = await db.accounts.get(parseInt(accountId));
      if (!account) {
        return { success: false, message: "Account not found" };
      }

      const { direction } = transaction;

      if (direction === "owe_me") {
        // Someone paid you back - add to account
        await db.accounts.update(parseInt(accountId), {
          balance: account.balance + amountNum,
        });
        return {
          success: true,
          message: "Debt settlement recorded (money received)",
        };
      } else if (direction === "i_owe") {
        // You paid someone - deduct from account
        if (account.balance >= amountNum) {
          await db.accounts.update(parseInt(accountId), {
            balance: account.balance - amountNum,
          });
          return {
            success: true,
            message: "Debt settlement recorded (payment made)",
          };
        }
        return {
          success: false,
          message: `Insufficient balance in ${account.name} for settlement`,
        };
      }
    }

    return { success: false, message: "Unknown transaction type" };
  } catch (error) {
    console.error("applyTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      transaction,
    });
    return {
      success: false,
      message: "Transaction processing error: " + error.message,
    };
  }
}

// Helper function to find and delete linked fee transaction
async function deleteLinkedFeeTransaction(transaction) {
  try {
    // Check if this is a transfer transaction with a linked fee
    if (transaction.type === "transfer") {
      // First try to get feeTransactionId from the transaction
      let feeId = transaction.feeTransactionId;

      // If not found, try to find fee transaction by linkedTransferId or details
      if (!feeId) {
        const linkedFee = await db.transactions
          .where("linkedTransferId")
          .equals(transaction.id)
          .first();

        if (linkedFee) {
          feeId = linkedFee.id;
        } else {
          // Fallback: Search by details pattern
          const allFees = await db.transactions
            .where("type")
            .equals("expense")
            .filter(
              (t) =>
                t.title === "Transfer Fee" &&
                t.details &&
                t.details.includes(`transfer of ${transaction.amount}`),
            )
            .toArray();

          // Get the most recent matching fee (likely the one we want)
          if (allFees.length > 0) {
            feeId = allFees[0].id;
          }
        }
      }

      if (feeId) {
        await db.transactions.delete(feeId);
        console.log(
          `Deleted linked fee transaction ${feeId} for transfer ${transaction.id}`,
        );
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error deleting linked fee transaction:", error);
    return false;
  }
}

// Reverse a transaction (for edits/deletions)
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

    // First, handle balance reversals
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
        // Reverse the deduction (add back the amount + fee)
        await db.accounts.update(parseInt(fromAccountId), {
          balance: fromAccount.balance + amountNum + feeNum,
        });
      }
      if (toAccount) {
        // Reverse the addition (subtract the amount)
        await db.accounts.update(parseInt(toAccountId), {
          balance: toAccount.balance - amountNum,
        });
      }

      // Delete the linked fee transaction if it exists
      await deleteLinkedFeeTransaction(transaction);
    } else if (type === "debt_settlement") {
      const account = await db.accounts.get(parseInt(accountId));
      const { direction } = transaction;

      if (account) {
        if (direction === "owe_me") {
          // Reverse incoming payment
          await db.accounts.update(parseInt(accountId), {
            balance: account.balance - amountNum,
          });
        } else if (direction === "i_owe") {
          // Reverse outgoing payment
          await db.accounts.update(parseInt(accountId), {
            balance: account.balance + amountNum,
          });
        }
      }
    }

    return { success: true, message: "Transaction reversed successfully" };
  } catch (error) {
    console.error("reverseTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      transaction,
      action: "reverseTransaction",
    });
    return { success: false, message: error.message };
  }
}

// Complete transaction deletion with cleanup
export async function deleteTransaction(transactionId) {
  try {
    const transaction = await db.transactions.get(transactionId);

    if (!transaction) {
      return { success: false, message: "Transaction not found" };
    }

    // Reverse the balance changes first
    const reverseResult = await reverseTransaction(transaction);

    if (!reverseResult.success) {
      return {
        success: false,
        message: `Failed to reverse transaction: ${reverseResult.message}`,
      };
    }

    // Delete the transaction itself
    await db.transactions.delete(transactionId);

    return { success: true, message: "Transaction deleted successfully" };
  } catch (error) {
    console.error("deleteTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      transactionId,
      action: "deleteTransaction",
    });
    return { success: false, message: error.message };
  }
}

// Edit transaction (delete old, create new)
export async function editTransaction(oldTransactionId, newTransactionData) {
  try {
    const oldTransaction = await db.transactions.get(oldTransactionId);

    if (!oldTransaction) {
      return { success: false, message: "Original transaction not found" };
    }

    // Reverse the old transaction
    const reverseResult = await reverseTransaction(oldTransaction);

    if (!reverseResult.success) {
      return {
        success: false,
        message: `Failed to reverse old transaction: ${reverseResult.message}`,
      };
    }

    // Delete the old transaction
    await db.transactions.delete(oldTransactionId);

    // Create the new transaction
    const newId = await db.transactions.add(newTransactionData);

    // Apply the new transaction
    const applyResult = await applyTransaction(
      { ...newTransactionData, id: newId },
      true,
    );

    if (!applyResult.success) {
      // Rollback - delete the new transaction if it failed
      await db.transactions.delete(newId);
      // Try to re-apply the old transaction
      await applyTransaction(oldTransaction, true);
      return {
        success: false,
        message: `Failed to apply new transaction: ${applyResult.message}`,
      };
    }

    return {
      success: true,
      message: "Transaction updated successfully",
      newId,
    };
  } catch (error) {
    console.error("editTransaction error:", error);
    await logError(error, ERROR_CATEGORIES.TRANSACTION, ERROR_LEVELS.ERROR, {
      oldTransactionId,
      newTransactionData,
      action: "editTransaction",
    });
    return { success: false, message: error.message };
  }
}
