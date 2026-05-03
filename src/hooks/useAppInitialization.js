// src/hooks/useAppInitialization.js
import { useState, useEffect } from "react";
import { initSampleData, dexieDB } from "../db/database";
import {
  initSQLiteDB,
  migrateDataToSQLite,
  shouldUseSQLite,
} from "../db/sqlite";

export function useAppInitialization() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setProgress(10);

        // First, initialize Dexie (your existing DB) - ALWAYS
        setProgress(30);
        await initSampleData();

        setProgress(50);

        // If on Android, also initialize SQLite and migrate
        if (window.Capacitor?.isNativePlatform()) {
          console.log("📱 Android detected, initializing SQLite...");
          await initSQLiteDB();
          setProgress(70);

          console.log("🔄 Migrating data to SQLite...");
          await migrateDataToSQLite();
          setProgress(90);
        }

        setProgress(100);

        // Minimum delay for smooth UX
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error("App initialization error:", err);
        setError(err.message || "Failed to initialize app");
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    initializeApp();
  }, []);

  return { isLoading, error, progress };
}
