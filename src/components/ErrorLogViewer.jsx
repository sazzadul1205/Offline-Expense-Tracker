// src/components/ErrorLogViewer.jsx

// React
import { useState, useEffect } from 'react';

// Utils
import {
  getErrorLogs,
  getErrorStats,
  markErrorResolved,
  deleteErrorLog,
  clearAllErrorLogs,
  ERROR_LEVELS
} from '../utils/errorLogger';
import { showConfirmAlert, showToast } from '../utils/alerts';

// Icons
import { MdError, MdWarning, MdInfo } from 'react-icons/md';
import { FiAlertCircle, FiCheckCircle, FiTrash2, FiRefreshCw, FiX } from 'react-icons/fi';

export default function ErrorLogViewer({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ level: '', category: '', resolved: '' });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const errorStats = await getErrorStats();
      setStats(errorStats);

      const errorLogs = await getErrorLogs(100, 0, filter);
      setLogs(errorLogs);
    } catch (error) {
      console.error('Failed to load error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    const confirmed = await showConfirmAlert('Resolve Error', 'Mark this error as resolved?', 'Resolve', 'Cancel');
    if (confirmed) {
      await markErrorResolved(id);
      await loadData();
      showToast('Error marked as resolved', 'success');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirmAlert('Delete Error', 'Delete this error log?', 'Delete', 'Cancel');
    if (confirmed) {
      await deleteErrorLog(id);
      await loadData();
      showToast('Error log deleted', 'success');
    }
  };

  const handleClearAll = async () => {
    const confirmed = await showConfirmAlert('Clear All Logs', '⚠️ This will permanently delete all error logs. Continue?', 'Clear All', 'Cancel');
    if (confirmed) {
      await clearAllErrorLogs();
      await loadData();
      showToast('All error logs cleared', 'success');
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case ERROR_LEVELS.FATAL: return <MdError className="text-red-600" size={18} />;
      case ERROR_LEVELS.ERROR: return <FiAlertCircle className="text-orange-600" size={18} />;
      case ERROR_LEVELS.WARNING: return <MdWarning className="text-yellow-600" size={18} />;
      default: return <MdInfo className="text-blue-600" size={18} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case ERROR_LEVELS.FATAL: return 'bg-red-100 text-red-800';
      case ERROR_LEVELS.ERROR: return 'bg-orange-100 text-orange-800';
      case ERROR_LEVELS.WARNING: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-red-50 to-orange-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="text-red-600" size={24} />
            <h2 className="text-lg font-bold text-gray-800">Error Log Book</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <FiX size={22} />
          </button>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-lg p-2 shadow-sm">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-500">Total Errors</div>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-sm">
                <div className="text-2xl font-bold text-red-600">{stats.unresolved}</div>
                <div className="text-xs text-gray-500">Unresolved</div>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-xs text-gray-500">Resolved</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-3 border-b border-gray-200 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter({ ...filter, resolved: '' })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filter.resolved ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter({ ...filter, resolved: false })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter.resolved === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Unresolved
          </button>
          <button
            onClick={() => setFilter({ ...filter, resolved: true })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter.resolved === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Resolved
          </button>
          <button
            onClick={handleClearAll}
            className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={loadData}
            className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          >
            <FiRefreshCw size={14} />
          </button>
        </div>

        {/* Error List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-gray-500 mt-2">Loading logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <FiCheckCircle className="text-green-600" size={32} />
              </div>
              <div className="text-gray-600 font-medium">No error logs found</div>
              <div className="text-sm text-gray-400 mt-1">All systems running smoothly!</div>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`bg-white rounded-xl p-3 border ${log.resolved ? 'border-green-200 bg-green-50/30' : 'border-gray-200'} shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{log.category}</span>
                        {log.resolved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Resolved
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-800 mb-1 break-words">
                        {log.message}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(log.timestampMs)}
                      </div>
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">Stack trace</summary>
                          <pre className="text-xs text-gray-500 mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                      {log.context && log.context !== '{}' && (
                        <details className="mt-1">
                          <summary className="text-xs text-blue-600 cursor-pointer">Context</summary>
                          <pre className="text-xs text-gray-500 mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                            {log.context}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {!log.resolved && (
                      <button
                        onClick={() => handleResolve(log.id)}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Mark as resolved"
                      >
                        <FiCheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete log"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}