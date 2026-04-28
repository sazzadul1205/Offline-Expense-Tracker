// src/hooks/useAppInitialization.js

import { useState, useEffect } from "react";
import { initSampleData, migrateExistingTransactions } from "../db/database";

export function useAppInitialization() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setProgress(10);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + Math.random() * 10;
          });
        }, 200);

        // Minimum loading time for better UX
        const minLoadTime = new Promise((resolve) => setTimeout(resolve, 1500));

        // Initialize database
        setProgress(30);
        const dbInit = initSampleData();

        setProgress(60);
        const dbMigrate = migrateExistingTransactions();

        await Promise.all([dbInit, dbMigrate, minLoadTime]);

        clearInterval(progressInterval);
        setProgress(100);

        // Small delay to ensure everything is ready
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      } catch (err) {
        console.error("App initialization error:", err);
        setError(err.message || "Failed to initialize app");
        // Still hide loading screen after error
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    initializeApp();
  }, []);

  return { isLoading, error, progress };
}
