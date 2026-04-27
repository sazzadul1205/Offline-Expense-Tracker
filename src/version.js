// src/version.js
// Centralized version management - Update this file when releasing new versions

export const APP_VERSION = "1.1.0";

// Build number (increments with each build, even for same version)
export const BUILD_NUMBER = "1";

// Get full version string
export const getFullVersion = () => `${APP_VERSION}.${BUILD_NUMBER}`;

// Complete version history with all changes
export const VERSION_HISTORY = [
  {
    version: "1.1.0",
    date: "2026-04-27",
    changes: ["App FulLY Overhauled"],
  },
  {
    version: "1.0.5",
    date: "2026-04-27",
    changes: [
      "🐛 Fixed database version conflict error",
      "💰 Changed currency format to English digits with commas",
      "📱 Renamed 'bKash' to 'Mobile Banking' for broader compatibility",
      "🔧 Fixed debt settlement to clear all pending transactions",
      "🛡️ Added account deletion protection (prevents deleting accounts with transactions)",
      "🔄 Auto-refresh account balances after transactions",
      "📊 Improved error handling in Reports section",
      "⚡ Database performance optimizations with better indexes",
    ],
  },
  {
    version: "1.0.4",
    date: "2026-04-26",
    changes: [
      "📱 Fixed bottom navigation overlapping with gesture bar",
      "🎨 Added safe area padding for modern phones",
      "🐛 Fixed minor bugs in debt tracking",
      "⚡ Performance improvements",
      "💳 Updated account balance calculation",
    ],
  },
  {
    version: "1.0.3",
    date: "2026-04-26",
    changes: [
      "🎉 Complete UI redesign with Tailwind CSS",
      "🔐 Added data encryption for security",
      "💰 Full BDT currency support",
      "⏰ Added time tracking for transactions",
      "📊 Enhanced reports with insights",
      "💳 Improved debt tracking system",
      "📱 Better mobile experience",
      "⚡ Performance optimizations",
    ],
  },
  {
    version: "1.0.2",
    date: "2026-04-26",
    changes: [
      "Added credit/debt tracking",
      "Multi-account support",
      "Transfer with fees",
      "Category management",
      "Export/Import backup",
    ],
  },
  {
    version: "1.0.1",
    date: "2026-04-26",
    changes: [
      "Added PWA support",
      "Offline first architecture",
      "Basic expense tracking",
      "Income management",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-04-26",
    changes: ["Initial release", "Basic expense tracking"],
  },
];

// Get latest version info
export const getLatestVersionInfo = () => {
  return VERSION_HISTORY[0];
};

// Get version by number
export const getVersionInfo = (version) => {
  return VERSION_HISTORY.find((v) => v.version === version);
};

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

// Format version for display
export const formatVersion = (version) => {
  return `v${version}`;
};
