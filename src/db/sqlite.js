// src/db/sqlite.js
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { dexieDB } from './database';

let sqliteDB = null;
let isSQLiteReady = false;

// Initialize SQLite database
export const initSQLiteDB = async () => {
  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db = await sqlite.createConnection('expense_tracker', false, 'no-encryption', 1);
    await db.open();
    
    // Create tables - SAME structure as your Dexie
    await db.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('cash','mobile','card','bank')),
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'BDT'
      )
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('expense','income'))
      )
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT,
        timestamp INTEGER NOT NULL,
        type TEXT CHECK(type IN ('expense','income','transfer','credit','debt_settlement')),
        amount REAL NOT NULL,
        status TEXT CHECK(status IN ('pending','paid')) DEFAULT 'paid',
        direction TEXT CHECK(direction IN ('owe_me','i_owe')),
        person TEXT,
        accountId INTEGER,
        fromAccountId INTEGER,
        toAccountId INTEGER,
        categoryId INTEGER,
        title TEXT,
        details TEXT,
        fee REAL,
        linkedTransferId INTEGER,
        feeTransactionId INTEGER,
        created_at TEXT
      )
    `);
    
    // Indexes for speed
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp DESC)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_person ON transactions(person)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(accountId)`);
    
    sqliteDB = db;
    isSQLiteReady = true;
    console.log('✅ SQLite database ready');
    return db;
  } catch (error) {
    console.error('SQLite init failed, using Dexie fallback:', error);
    isSQLiteReady = false;
    return null;
  }
};

// Check if we should use SQLite (Android only)
export const shouldUseSQLite = () => {
  return window.Capacitor?.isNativePlatform() === true && isSQLiteReady;
};

// Get current db (SQLite if available, fallback to Dexie)
export const getDB = () => {
  if (shouldUseSQLite() && sqliteDB) {
    return sqliteDB;
  }
  return dexieDB; // Fallback to original Dexie
};

// ============ MIGRATION FUNCTION ============
export const migrateDataToSQLite = async () => {
  if (!isSQLiteReady) {
    console.log('SQLite not ready, skipping migration');
    return false;
  }
  
  // Check if already migrated
  const check = await sqliteDB.query('SELECT COUNT(*) as count FROM accounts');
  const accountCount = check.values?.[0]?.count || 0;
  
  if (accountCount > 0) {
    console.log('Data already migrated to SQLite');
    return true;
  }
  
  console.log('Starting migration from Dexie to SQLite...');
  
  try {
    // Migrate accounts
    const accounts = await dexieDB.accounts.toArray();
    for (const acc of accounts) {
      await sqliteDB.run(
        `INSERT INTO accounts (id, name, type, balance, currency) VALUES (?, ?, ?, ?, ?)`,
        [acc.id, acc.name, acc.type, acc.balance || 0, acc.currency || 'BDT']
      );
    }
    
    // Migrate categories
    const categories = await dexieDB.categories.toArray();
    for (const cat of categories) {
      await sqliteDB.run(
        `INSERT INTO categories (id, name, type) VALUES (?, ?, ?)`,
        [cat.id, cat.name, cat.type]
      );
    }
    
    // Migrate transactions
    const transactions = await dexieDB.transactions.toArray();
    for (const tx of transactions) {
      await sqliteDB.run(
        `INSERT INTO transactions (
          id, date, time, timestamp, type, amount, status, 
          direction, person, accountId, fromAccountId, toAccountId, 
          categoryId, title, details, fee, linkedTransferId, feeTransactionId, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id, tx.date, tx.time, tx.timestamp, tx.type, tx.amount, tx.status || 'paid',
          tx.direction, tx.person, tx.accountId, tx.fromAccountId, tx.toAccountId,
          tx.categoryId, tx.title, tx.details, tx.fee, tx.linkedTransferId, tx.feeTransactionId,
          tx.createdAt || new Date().toISOString()
        ]
      );
    }
    
    console.log(`✅ Migration complete: ${accounts.length} accounts, ${categories.length} categories, ${transactions.length} transactions`);
    return true;
    
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};

// Wrapper functions that work with both SQLite and Dexie
export const queryAccounts = async () => {
  const db = getDB();
  if (shouldUseSQLite()) {
    const result = await db.query('SELECT * FROM accounts ORDER BY id');
    return result.values || [];
  }
  return await db.accounts.toArray();
};

export const queryCategories = async () => {
  const db = getDB();
  if (shouldUseSQLite()) {
    const result = await db.query('SELECT * FROM categories ORDER BY id');
    return result.values || [];
  }
  return await db.categories.toArray();
};

export const queryTransactions = async (limit = 100, offset = 0) => {
  const db = getDB();
  if (shouldUseSQLite()) {
    const result = await db.query(
      `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return result.values || [];
  }
  return await db.transactions.orderBy('timestamp').reverse().offset(offset).limit(limit).toArray();
};

export const addTransactionToDB = async (transaction) => {
  const db = getDB();
  if (shouldUseSQLite()) {
    const result = await db.run(
      `INSERT INTO transactions (
        date, time, timestamp, type, amount, status, direction, person,
        accountId, fromAccountId, toAccountId, categoryId, title, details, fee, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.date, transaction.time, transaction.timestamp, transaction.type,
        transaction.amount, transaction.status || 'paid', transaction.direction || null,
        transaction.person || null, transaction.accountId || null, transaction.fromAccountId || null,
        transaction.toAccountId || null, transaction.categoryId || null,
        transaction.title || '', transaction.details || '', transaction.fee || null,
        new Date().toISOString()
      ]
    );
    return result.insertId;
  }
  return await db.transactions.add(transaction);
};

export const updateTransactionInDB = async (id, updates) => {
  const db = getDB();
  if (shouldUseSQLite()) {
    const keys = Object.keys(updates);
    const values = keys.map(k => updates[k]);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    await db.run(`UPDATE transactions SET ${setClause} WHERE id = ?`, [...values, id]);
    return true;
  }
  await db.transactions.update(id, updates);
  return true;
};

export const deleteTransactionFromDB = async (id) => {
  const db = getDB();
  if (shouldUseSQLite()) {
    await db.run('DELETE FROM transactions WHERE id = ?', [id]);
    return true;
  }
  await db.transactions.delete(id);
  return true;
};