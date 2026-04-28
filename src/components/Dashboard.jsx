// src/components/Dashboard.jsx

// React
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Database
import { db } from '../db/database';

import { TfiWallet } from "react-icons/tfi";
import { MdOutlinePendingActions, MdEdit, MdDelete, MdClose } from 'react-icons/md';
import {
  FiTrendingDown,
  FiTrendingUp,
  FiAlertCircle,
  FiArrowDown,
  FiArrowUp,
  FiRepeat,
  FiCreditCard,
  FiClock
} from 'react-icons/fi';

import { formatCurrency } from '../utils/currency';
import { showToast, showErrorAlert, showConfirmAlert } from '../utils/alerts';
import { deleteTransaction } from '../utils/accountingRules';
import { useDataRefresh } from '../utils/refresh';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    totalBalance: 0,
    totalExpenses: 0,
    totalIncome: 0,
    pendingDebt: 0,
    recentTransactions: []
  });
  const [accounts, setAccounts] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Long press detection
  const pressTimer = useRef(null);
  const [pressedTransactionId, setPressedTransactionId] = useState(null);
  const savedScrollPosition = useRef(0);
  const scrollContainerRef = useRef(null);

  // Load data function
  const loadDashboardData = async () => {
    try {
      const accountsList = await db.accounts.toArray();
      const totalBalance = accountsList.reduce((sum, acc) => sum + acc.balance, 0);

      const transactions = await db.transactions
        .orderBy('timestamp')
        .reverse()
        .limit(50)
        .toArray();

      const paid = transactions.filter(t => t.status === 'paid');

      const totalExpenses = paid
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);

      const totalIncome = paid
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);

      const pendingDebt = (await db.transactions
        .where('status')
        .equals('pending')
        .toArray())
        .reduce((s, t) => s + t.amount, 0);

      setStats({
        totalBalance,
        totalExpenses,
        totalIncome,
        pendingDebt,
        recentTransactions: transactions.slice(0, 20)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadAccounts = async () => {
    try {
      const acc = await db.accounts.toArray();
      setAccounts(acc);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
    loadAccounts();
  }, []);

  // Refresh when navigation key changes (user returns to this page)
  useEffect(() => {
    loadDashboardData();
    loadAccounts();
  }, [location.key]);

  // Listen for global data change events
  useDataRefresh(() => {
    loadDashboardData();
    loadAccounts();
  });

  // Find the scrollable container after data loads
  useEffect(() => {
    const container = document.querySelector('.transactions-scroll-container');
    if (container) {
      scrollContainerRef.current = container;
    }
  }, [stats.recentTransactions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  // Close modal function
  const closeModal = () => {
    setOpenMenuId(null);
    setPressedTransactionId(null);
  };

  // Long press handlers - without preventDefault
  const handleTouchStart = (e, transactionId) => {
    // Don't call preventDefault
    setPressedTransactionId(transactionId);
    pressTimer.current = setTimeout(() => {
      // Save current scroll position before opening modal
      if (scrollContainerRef.current) {
        savedScrollPosition.current = scrollContainerRef.current.scrollTop;
      } else {
        savedScrollPosition.current = window.scrollY;
      }
      setOpenMenuId(transactionId);
      setPressedTransactionId(null);
    }, 500);
  };

  const handleTouchEnd = (e) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressedTransactionId(null);
  };

  const handleTouchMove = (e) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressedTransactionId(null);
  };

  // Delete transaction
  const handleDelete = async (transaction) => {
    closeModal();

    const confirmed = await showConfirmAlert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.title || transaction.type}" for ${formatCurrency(transaction.amount)}?`,
      'Yes, Delete',
      'Cancel'
    );

    if (confirmed) {
      const result = await deleteTransaction(transaction.id);
      if (result.success) {
        showToast(result.message, 'success');
        await loadDashboardData();
        await loadAccounts();
        window.dispatchEvent(new CustomEvent('data-changed'));
      } else {
        showErrorAlert('Delete Failed', result.message);
      }
    }
  };

  // Edit transaction
  const handleEdit = (transaction) => {
    closeModal();
    navigate('/edit-transaction', { state: { transaction } });
  };

  const formatDateTime = (date, time) => {
    const d = new Date(date);
    return time
      ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${time}`
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTransactionIcon = (type) => {
    const map = {
      expense: <FiArrowDown className="text-red-500" size={18} />,
      income: <FiArrowUp className="text-emerald-500" size={18} />,
      transfer: <FiRepeat className="text-blue-500" size={18} />,
      credit: <FiCreditCard className="text-violet-500" size={18} />,
      debt_settlement: <FiRepeat className="text-purple-500" size={18} />
    };
    return map[type] || <FiCreditCard className="text-gray-400" size={18} />;
  };

  // Get transaction color
  const getTransactionColor = (type) => {
    const map = {
      expense: 'text-red-600',
      income: 'text-emerald-600',
      transfer: 'text-blue-600',
      credit: 'text-violet-600',
      debt_settlement: 'text-purple-600'
    };
    return map[type] || 'text-gray-600';
  };

  // Reusable card
  const Card = ({ children, className = "" }) => (
    <div className={`rounded-2xl shadow-sm border border-gray-100 bg-white ${className}`}>
      {children}
    </div>
  );

  // Find the selected transaction
  const selectedTransaction = openMenuId ? stats.recentTransactions.find(t => t.id === openMenuId) : null;

  return (
    <div className="space-y-5">
      {/* TOP GRID */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md">
          <div className="flex justify-between items-center">
            <TfiWallet size={20} className="opacity-80" />
            <span className="text-xs opacity-70">Balance</span>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">
            {formatCurrency(stats.totalBalance)}
          </div>
          <div className="text-xs opacity-70 mt-1">All accounts combined</div>
        </div>

        <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
          <div className="flex justify-between items-center">
            <MdOutlinePendingActions size={20} className="opacity-80" />
            <span className="text-xs opacity-70">Pending</span>
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight">
            {formatCurrency(stats.pendingDebt)}
          </div>
          <div className="text-xs opacity-70 mt-1">Outstanding amount</div>
        </div>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <FiTrendingDown className="text-red-500" />
            <span className="text-xs text-gray-400">Expenses</span>
          </div>
          <div className="mt-3 text-lg font-semibold text-red-600">
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div className="text-xs text-gray-400">Total spent</div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center">
            <FiTrendingUp className="text-emerald-500" />
            <span className="text-xs text-gray-400">Income</span>
          </div>
          <div className="mt-3 text-lg font-semibold text-emerald-600">
            {formatCurrency(stats.totalIncome)}
          </div>
          <div className="text-xs text-gray-400">Total earned</div>
        </Card>
      </div>

      {/* SAVINGS */}
      {stats.totalIncome > 0 && (
        <Card className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-emerald-700 font-medium">
                Savings Rate
              </div>
              <div className="text-2xl font-bold text-emerald-800">
                {(((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-full bg-emerald-100">
              <TfiWallet className="text-emerald-700" size={22} />
            </div>
          </div>
          <div className="text-xs text-emerald-600 mt-2">
            Saved {formatCurrency(stats.totalIncome - stats.totalExpenses)} so far
          </div>
        </Card>
      )}

      {/* TRANSACTIONS */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
          <span className="text-xs text-gray-400">Hold on a transaction to edit/delete</span>
        </div>

        <div
          className="transactions-scroll-container divide-y divide-gray-50 max-h-[400px] overflow-y-auto"
        >
          {stats.recentTransactions.length === 0 ? (
            <div className="py-14 text-center">
              <FiAlertCircle className="mx-auto text-gray-300" size={28} />
              <div className="mt-2 text-gray-500 font-medium">
                No transactions found
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Start by adding your first entry
              </div>
            </div>
          ) : (
            stats.recentTransactions.map(t => (
              <div
                key={t.id}
                className={`px-5 py-3 flex items-center justify-between transition-all duration-200
                  ${pressedTransactionId === t.id ? 'bg-blue-50 scale-[0.99]' : 'hover:bg-gray-50'}
                `}
                onTouchStart={(e) => handleTouchStart(e, t.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
                onMouseDown={(e) => handleTouchStart(e, t.id)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchMove}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  touchAction: 'manipulation'
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pointer-events-none">
                  <div className="p-2 rounded-xl bg-gray-50">
                    {getTransactionIcon(t.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {t.title || t.type}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <FiClock size={10} />
                      {formatDateTime(t.date, t.time)}
                    </div>
                  </div>
                </div>

                <div className={`font-semibold text-sm ${getTransactionColor(t.type)} pointer-events-none`}>
                  {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                  {formatCurrency(t.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Instruction tooltip */}
      {stats.recentTransactions.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-2 bg-blue-50 rounded-xl mx-2">
          💡 Tip: Hold on any transaction to edit or delete
        </div>
      )}

      {/* MODAL */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-1 hover:bg-gray-200 rounded-full transition-colors z-10"
              >
                <MdClose size={20} className="text-gray-500" />
              </button>
              <div className="font-semibold text-gray-800 text-center text-lg pr-6">
                {selectedTransaction.title || selectedTransaction.type}
              </div>
              <div className={`text-center text-2xl font-bold mt-2 ${getTransactionColor(selectedTransaction.type)}`}>
                {selectedTransaction.type === 'expense' ? '-' : selectedTransaction.type === 'income' ? '+' : ''}
                {formatCurrency(selectedTransaction.amount)}
              </div>
              <div className="text-xs text-gray-500 text-center mt-1">
                {formatDateTime(selectedTransaction.date, selectedTransaction.time)}
              </div>
            </div>
            <button
              onClick={() => handleEdit(selectedTransaction)}
              className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100"
            >
              <MdEdit size={22} className="text-blue-500" />
              <div>
                <div className="text-sm font-medium">Edit Transaction</div>
                <div className="text-xs text-gray-400">Modify this transaction</div>
              </div>
            </button>
            <button
              onClick={() => handleDelete(selectedTransaction)}
              className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
            >
              <MdDelete size={22} />
              <div>
                <div className="text-sm font-medium">Delete Transaction</div>
                <div className="text-xs text-red-400">Remove this entry</div>
              </div>
            </button>
            <button
              onClick={closeModal}
              className="w-full px-4 py-3 text-center text-gray-500 hover:bg-gray-50 border-t border-gray-100 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}