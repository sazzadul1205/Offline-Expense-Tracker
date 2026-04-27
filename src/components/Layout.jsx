import { useState, useEffect, useRef } from 'react';
import { exportData, importData } from '../utils/backup';
import {
  FiMenu, FiDownload, FiUpload, FiX, FiCheckCircle,
  FiAlertCircle, FiDatabase, FiSettings
} from 'react-icons/fi';
import { MdBackup, MdRestore } from 'react-icons/md';

export default function Layout({ children, title }) {
  const [showBackup, setShowBackup] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowBackup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showMessage = (type, message) => {
    setNotification({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleExport = async () => {
    try {
      await exportData();
      showMessage('success', 'Backup exported successfully!');
      setShowBackup(false);
    } catch (error) {
      showMessage('error', 'Failed to export backup');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsProcessing(true);
      try {
        const result = await importData(file);
        showMessage(result.success ? 'success' : 'error', result.message);
        if (result.success) {
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (error) {
        showMessage('error', 'Failed to import backup');
      } finally {
        setIsProcessing(false);
        setShowBackup(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-slide-down">
          <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-lg ${notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
            }`}>
            {notification.type === 'success' ? (
              <FiCheckCircle size={22} />
            ) : (
              <FiAlertCircle size={22} />
            )}
            <span className="flex-1 text-sm font-medium">{notification.message}</span>
            <button onClick={() => setShowNotification(false)} className="opacity-75 hover:opacity-100">
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{title}</h1>
              <p className="text-xs text-blue-100 mt-0.5 opacity-80">Offline Expense Tracker</p>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowBackup(!showBackup)}
                className="bg-white/10 backdrop-blur-sm p-2 rounded-xl hover:bg-white/20 transition-all"
              >
                <FiMenu size={22} />
              </button>

              {/* Dropdown Menu */}
              {showBackup && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl z-10 overflow-hidden animate-fade-in">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <div className="flex items-center gap-2">
                      <FiDatabase className="text-blue-600" size={18} />
                      <span className="font-semibold text-gray-800 text-sm">Data Management</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Backup or restore your data</p>
                  </div>

                  <button
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="bg-green-100 p-2 rounded-xl group-hover:bg-green-200 transition-colors">
                      <MdBackup className="text-green-600" size={18} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-800">Export Backup</div>
                      <div className="text-xs text-gray-500">Save data to JSON file</div>
                    </div>
                    <FiDownload size={16} className="text-gray-400" />
                  </button>

                  <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="bg-blue-100 p-2 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <MdRestore className="text-blue-600" size={18} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-800">Import Backup</div>
                      <div className="text-xs text-gray-500">Restore from JSON file</div>
                    </div>
                    <FiUpload size={16} className="text-gray-400" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      disabled={isProcessing}
                      className="hidden"
                    />
                  </label>

                  <div className="p-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiSettings size={12} />
                      <span>All data stored locally</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-5 pb-24 max-w-md mx-auto">
        {children}
      </main>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <div className="text-gray-800 font-medium">Processing backup...</div>
            <div className="text-xs text-gray-500 mt-1">Please wait</div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}