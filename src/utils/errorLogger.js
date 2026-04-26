// src/utils/errorLogger.js
import { db } from "../db/database";

// Error levels
export const ERROR_LEVELS = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  FATAL: "fatal",
};

// Error categories
export const ERROR_CATEGORIES = {
  DATABASE: "database",
  VALIDATION: "validation",
  NETWORK: "network",
  AUTH: "auth",
  UI: "ui",
  TRANSACTION: "transaction",
  ENCRYPTION: "encryption",
  BACKUP: "backup",
};

// Log an error
export const logError = async (
  error,
  category = ERROR_CATEGORIES.ERROR,
  level = ERROR_LEVELS.ERROR,
  context = {},
) => {
  try {
    const errorLog = {
      id: Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      level: level,
      category: category,
      message: error.message || String(error),
      stack: error.stack || null,
      context: JSON.stringify(context),
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false,
      notes: "",
    };

    await db.errorLogs.add(errorLog);

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${level.toUpperCase()}] ${category}:`, error, context);
    }

    return errorLog.id;
  } catch (err) {
    console.error("Failed to log error:", err);
    return null;
  }
};

// Get all error logs
export const getErrorLogs = async (limit = 100, offset = 0, filters = {}) => {
  try {
    let query = db.errorLogs.orderBy("timestampMs").reverse();

    if (filters.level) {
      query = query.filter((log) => log.level === filters.level);
    }
    if (filters.category) {
      query = query.filter((log) => log.category === filters.category);
    }
    if (filters.resolved !== undefined) {
      query = query.filter((log) => log.resolved === filters.resolved);
    }

    const logs = await query.offset(offset).limit(limit).toArray();
    return logs;
  } catch (error) {
    console.error("Failed to get error logs:", error);
    return [];
  }
};

// Get error log by ID
export const getErrorLogById = async (id) => {
  try {
    return await db.errorLogs.get(id);
  } catch (error) {
    console.error("Failed to get error log:", error);
    return null;
  }
};

// Mark error as resolved
export const markErrorResolved = async (id, notes = "") => {
  try {
    await db.errorLogs.update(id, {
      resolved: true,
      resolvedAt: new Date().toISOString(),
      notes: notes,
    });
    return true;
  } catch (error) {
    console.error("Failed to mark error as resolved:", error);
    return false;
  }
};

// Delete error log
export const deleteErrorLog = async (id) => {
  try {
    await db.errorLogs.delete(id);
    return true;
  } catch (error) {
    console.error("Failed to delete error log:", error);
    return false;
  }
};

// Clear all error logs
export const clearAllErrorLogs = async () => {
  try {
    await db.errorLogs.clear();
    return true;
  } catch (error) {
    console.error("Failed to clear error logs:", error);
    return false;
  }
};

// Get error statistics
export const getErrorStats = async () => {
  try {
    const logs = await db.errorLogs.toArray();
    const stats = {
      total: logs.length,
      byLevel: {},
      byCategory: {},
      resolved: logs.filter((l) => l.resolved).length,
      unresolved: logs.filter((l) => !l.resolved).length,
      last24Hours: logs.filter(
        (l) => l.timestampMs > Date.now() - 24 * 60 * 60 * 1000,
      ).length,
      last7Days: logs.filter(
        (l) => l.timestampMs > Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).length,
    };

    logs.forEach((log) => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byCategory[log.category] =
        (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Failed to get error stats:", error);
    return null;
  }
};

// Wrap async function with error logging
export const withErrorLogging = async (
  fn,
  context = {},
  category = ERROR_CATEGORIES.ERROR,
) => {
  try {
    return await fn();
  } catch (error) {
    await logError(error, category, ERROR_LEVELS.ERROR, context);
    throw error;
  }
};
