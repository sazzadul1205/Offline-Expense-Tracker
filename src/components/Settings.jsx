// src/components/Settings.jsx

// React
import { useState, useEffect } from 'react';

// Database
import { db } from '../db/database';
import { initSampleData } from '../db/database';


// Utils
import { exportData, importData } from '../utils/backup';
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showToast } from '../utils/alerts';

// Icons
import { FiShield, FiDatabase, FiInfo, FiDownload, FiUpload, FiTrash2, FiRefreshCw, FiLock, FiUnlock, FiAlertCircle } from 'react-icons/fi';
import { MdSecurity, MdUpdate } from 'react-icons/md';

// Components
import ErrorLogViewer from './ErrorLogViewer';

// Update Checker
import { checkForUpdates } from './UpdateChecker';


export default function Settings() {

  // States
  const [appVersion, setAppVersion] = useState('4.0.0');
  const [showErrorLogs, setShowErrorLogs] = useState(false);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true);
  const [stats, setStats] = useState({ totalAccounts: 0, totalCategories: 0, totalTransactions: 0, dbSize: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const accounts = await db.accounts.toArray();
    const categories = await db.categories.toArray();
    const transactions = await db.transactions.toArray();

    // Estimate DB size
    const dbData = { accounts, categories, transactions };
    const dbSize = new Blob([JSON.stringify(dbData)]).size;

    setStats({
      totalAccounts: accounts.length,
      totalCategories: categories.length,
      totalTransactions: transactions.length,
      dbSize: dbSize
    });
  };

  const handleExport = async () => {
    const confirmed = await showConfirmAlert(
      'Export Data',
      'This will export all your data as an encrypted backup file. Continue?',
      'Export',
      'Cancel'
    );

    if (confirmed) {
      try {
        await exportData();
        showSuccessAlert('Export Successful', 'Your data has been exported successfully!');
      } catch (error) {
        showErrorAlert('Export Failed', 'There was an error exporting your data.');
      }
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const confirmed = await showConfirmAlert(
      'Import Data',
      'This will replace all your existing data. Make sure you have a backup. Continue?',
      'Import',
      'Cancel'
    );

    if (confirmed) {
      try {
        const result = await importData(file);
        if (result.success) {
          showSuccessAlert('Import Successful', 'Your data has been imported successfully!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showErrorAlert('Import Failed', result.message);
        }
      } catch (error) {
        showErrorAlert('Import Failed', 'There was an error importing your data.');
      }
    }
  };

  const handleClearData = async () => {
    const confirmed = await showConfirmAlert(
      'Clear All Data',
      '⚠️ WARNING: This will permanently delete ALL your data. This action cannot be undone!',
      'Yes, Delete Everything',
      'Cancel'
    );

    if (confirmed) {
      try {
        await db.accounts.clear();
        await db.categories.clear();
        await db.transactions.clear();
        await initSampleData();
        showSuccessAlert('Data Cleared', 'All data has been cleared and reset to default.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        showErrorAlert('Error', 'There was an error clearing your data.');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const updateLog = [
    {
      version: 'v4.0.0', date: '2026-04-26', changes: [
        '🎉 Complete UI redesign with Tailwind CSS',
        '🔐 Added data encryption for security',
        '💰 Full BDT currency support',
        '⏰ Added time tracking for transactions',
        '📊 Enhanced reports with insights',
        '💳 Improved debt tracking system',
        '📱 Better mobile experience',
        '⚡ Performance optimizations'
      ]
    },
    {
      version: 'v3.0.0', date: '2026-03-15', changes: [
        'Added credit/debt tracking',
        'Multi-account support',
        'Transfer with fees',
        'Category management',
        'Export/Import backup'
      ]
    },
    {
      version: 'v2.0.0', date: '2026-02-01', changes: [
        'Added PWA support',
        'Offline first architecture',
        'Basic expense tracking',
        'Income management'
      ]
    },
    {
      version: 'v1.0.0', date: '2026-01-10', changes: [
        'Initial release',
        'Basic expense tracking'
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Security Status */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isEncryptionEnabled ? <FiLock size={20} /> : <FiUnlock size={20} />}
            <span className="text-sm font-medium">Security Status</span>
          </div>
          <FiShield size={20} className="opacity-80" />
        </div>
        <div className="text-lg font-bold">
          {isEncryptionEnabled ? '🔒 Data Encrypted' : '⚠️ Encryption Disabled'}
        </div>
        <div className="text-xs mt-2 opacity-80">
          All your data is encrypted locally for maximum security
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <FiDatabase className="text-blue-700" size={18} />
            <h2 className="font-semibold text-blue-800">Data Management</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-100">

          {/* Stats */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Accounts</span>
              <span className="font-semibold">{stats.totalAccounts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Categories</span>
              <span className="font-semibold">{stats.totalCategories}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-semibold">{stats.totalTransactions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Database Size</span>
              <span className="font-semibold">{formatFileSize(stats.dbSize)}</span>
            </div>
          </div>

          {/* Export/Import */}
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="bg-green-100 p-2 rounded-xl">
              <FiDownload className="text-green-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-800">Export Backup</div>
              <div className="text-xs text-gray-500">Save your data to a secure file</div>
            </div>
          </button>

          {/* Import */}
          <label className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="bg-blue-100 p-2 rounded-xl">
              <FiUpload className="text-blue-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-800">Import Backup</div>
              <div className="text-xs text-gray-500">Restore from a backup file</div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* Clear */}
          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="bg-red-100 p-2 rounded-xl">
              <FiTrash2 className="text-red-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-red-600">Clear All Data</div>
              <div className="text-xs text-gray-500">⚠️ Permanently delete all your data</div>
            </div>
          </button>

          {/* Check for Updates */}
          <button
            onClick={() => checkForUpdates(true)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="bg-blue-100 p-2 rounded-xl">
              <FiDownload className="text-blue-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-800">Check for Updates</div>
              <div className="text-xs text-gray-500">Download latest version with new features</div>
            </div>
          </button>

          {/* Error Logs */}
          <button
            onClick={() => setShowErrorLogs(true)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="bg-red-100 p-2 rounded-xl">
              <FiAlertCircle className="text-red-600" size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-800">Error Log Book</div>
              <div className="text-xs text-gray-500">View application errors and diagnostics</div>
            </div>
          </button>
        </div>
      </div>

      {/* Update Log */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
          <div className="flex items-center gap-2">
            <MdUpdate className="text-purple-700" size={18} />
            <h2 className="font-semibold text-purple-800">Update Log</h2>
            <span className="ml-auto text-xs text-purple-600">v{appVersion}</span>
          </div>
          <p className="text-xs text-purple-600 mt-1 ml-1">What's new in the latest version</p>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {updateLog.map((update, index) => (
            <div key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">{update.version}</span>
                <span className="text-xs text-gray-400">{update.date}</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-600">
                {update.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiInfo className="text-gray-700" size={18} />
            <h2 className="font-semibold text-gray-800">About</h2>
          </div>
        </div>
        <div className="p-5 text-center">
          <div className="text-3xl mb-2">💰</div>
          <div className="font-bold text-gray-800">Offline Expense Tracker</div>
          <div className="text-xs text-gray-500 mt-1">Version {appVersion}</div>
          <div className="text-xs text-gray-400 mt-2">
            Fully offline personal finance tracking system
          </div>
          <div className="text-xs text-gray-400 mt-1">
            All data is stored locally and encrypted 🔒
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="text-[10px] text-gray-400">
              Made with ❤️ for financial freedom
            </div>
          </div>
        </div>
      </div>

      {showErrorLogs && <ErrorLogViewer onClose={() => setShowErrorLogs(false)} />}

      {/* CSS for safe bottom area */}
      <style jsx>{`
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}