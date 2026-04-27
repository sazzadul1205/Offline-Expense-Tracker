// src/version.js
// Centralized version management - Update this file when releasing new versions

export const APP_VERSION = "4.0.2";

// Optional: Add version history for tracking
export const VERSION_HISTORY = [
  {
    version: "4.0.0",
    date: "2026-04-26",
    notes: "Initial release with auto-update",
  },
  { version: "3.0.0", date: "2026-03-15", notes: "Added credit/debt tracking" },
  { version: "2.0.0", date: "2026-02-01", notes: "Added PWA support" },
  { version: "1.0.0", date: "2026-01-10", notes: "Initial release" },
];

// Build number (increments with each build, even for same version)
export const BUILD_NUMBER = "1";

// Get full version string
export const getFullVersion = () => `${APP_VERSION}.${BUILD_NUMBER}`;

// Check if a version is newer than current
export const isNewerVersion = (remoteVersion) => {
  const currentParts = APP_VERSION.split(".").map(Number);
  const remoteParts = remoteVersion.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, remoteParts.length); i++) {
    const current = currentParts[i] || 0;
    const remote = remoteParts[i] || 0;
    if (remote > current) return true;
    if (remote < current) return false;
  }
  return false;
};
